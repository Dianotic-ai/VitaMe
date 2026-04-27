// file: src/app/api/chat/route.ts — v0.3 主对话路由（Vercel Edge + streamText）
//
// 流程（CLAUDE.md §3.1）:
//   POST {messages, sessionId, profile?}
//     → 输入合规 preflight（input audit + banned-word check on user query — 失败可拒）
//     → 历史裁剪到最近 MAX_LLM_MESSAGES 条
//     → retrieveFacts(latestUserMsg, profile)
//     → buildSystemPrompt({retrieved, profile})
//     → streamText(provider(model), system, messages, tools)
//     → toUIMessageStreamResponse() ← 跟前端 useChat 对接
//     → 流结束 onFinish → 写 output audit + banned-word 后置扫描
//
// 关键设计:
// - Edge runtime: 流式输出不受 Vercel Hobby 60s 限制
// - LLM provider: minimax 国际版 (CLAUDE.md §4)，复用 D8 baseURL+/v1 trick
// - profile 客户端传，服务端不持久化（CLAUDE.md §9.8）
// - audit log 用 Upstash REST（Edge 无 fs，CLAUDE.md §14 坑 #7）
// - 历史上限：UI 全保留（PromptInspector / 时间轴可见），但发给 LLM 仅最近
//   MAX_LLM_MESSAGES 条，避免 prompt 爆炸 + 控制成本。
//
// === Audit 边界（合规折中，必读）===
// 1. **流前 input audit**：req body 解析后立刻写一条 input audit。失败 → 拒绝请求
//    (return 5xx)。这是唯一能"拦截"恶意输入的窗口。
// 2. **流后 output audit**：onFinish 里写。**流已开始的物理事实**：即使 audit 失败，
//    也无法撤回已经发送给客户端的 token。失败仅 stderr，不抛错。
// 3. **禁词后置扫描**：onFinish 里跑 containsBannedWords(text) → 命中写 audit。
//    **前端额外**做 sanitize 替换给用户看（最差情况：流式过程中用户瞥到原词，但
//    最终渲染态是 sanitized 的）。
// 4. 真严格合规需要：①input/output 双写都同步阻塞 ②命中禁词时改用非流式生成 +
//    拒答模板。WAIC 时间内不做，明确为后续工作。

import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createChatProvider, getChatModelId } from '@/lib/llm/edgeProvider';
import { retrieveFacts } from '@/lib/chat/retriever';
import { buildSystemPrompt } from '@/lib/chat/systemPrompt';
import { writeChatAudit, shortHash } from '@/lib/chat/audit';
import { chatTools } from '@/lib/chat/tools';
import {
  BANNED_WORDS_EN,
  BANNED_WORDS_ZH,
  containsBannedWords,
  scanBannedWords,
} from '@/lib/capabilities/compliance/bannedWordsFilter';
import type { ProfileSnapshot } from '@/lib/chat/types';

export const runtime = 'edge';
export const maxDuration = 60; // streaming 不受此限，留 60 作为非流响应兜底

interface ChatBody {
  sessionId?: string;
  messages: UIMessage[];
  profile?: ProfileSnapshot;
}

// 发给 LLM 的最近消息上限（≈ 5 轮 user+assistant 配对）
const MAX_LLM_MESSAGES = 10;

function extractLatestUserText(messages: UIMessage[]): string {
  // useChat UIMessage.parts: [{type:'text', text:'...'}, ...]
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== 'user') continue;
    const parts = m.parts ?? [];
    const txt = parts
      .filter((p: { type: string }) => p.type === 'text')
      .map((p: { type: string; text?: string }) => p.text ?? '')
      .join(' ');
    if (txt.trim()) return txt;
  }
  return '';
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sessionId, messages, profile } = body;

  if (!sessionId || !messages?.length) {
    return new Response(JSON.stringify({ error: 'sessionId and messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const latestQuery = extractLatestUserText(messages);
  if (!latestQuery) {
    return new Response(JSON.stringify({ error: 'no user message found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. RAG 检索
  const retrieved = retrieveFacts(latestQuery, profile);

  // 2. 构造 system prompt
  const system = buildSystemPrompt({ retrieved, profile });

  // 3. provider + 模型
  let provider: ReturnType<typeof createChatProvider>;
  try {
    provider = createChatProvider();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const inputHash = await shortHash(latestQuery);

  // 4. **流前** input audit preflight（可同步阻塞 — 失败拒请求）
  // 这是合规 audit 唯一能"拦截"的窗口（流后无法撤回 token，见文件头注释）
  try {
    await writeChatAudit({
      event: 'chat_input',
      sessionId,
      inputHash,
      metadata: {
        criticalHits: retrieved.criticalHits,
        userMsgLen: latestQuery.length,
        ingredientSlugs: retrieved.ingredientSlugs,
        medicationSlugs: retrieved.medicationSlugs,
      },
    });
  } catch (auditErr) {
    // 严格模式应拒绝；WAIC demo 期暂记录后继续，避免 audit infra 故障导致 chat 全挂
    console.error('[chat] input audit write failed (continuing):', auditErr);
  }

  // 5. 用户输入禁词早查（命中也只 audit + 替换给 LLM 的 user 文本，避免污染回答；
  //    不拒请求 — 用户经常无意提到"诊断"等词描述自己情况）
  if (containsBannedWords(latestQuery)) {
    try {
      const scan = scanBannedWords(latestQuery);
      await writeChatAudit({
        event: 'chat_input_banned_word_hit',
        sessionId,
        inputHash,
        metadata: { hitWords: scan.hits.map((h) => h.word) },
      });
    } catch (auditErr) {
      console.error('[chat] input ban audit write failed:', auditErr);
    }
  }

  // 6. 历史裁剪 — UI 全保留，发给 LLM 仅最近 MAX_LLM_MESSAGES 条
  const trimmed = messages.slice(-MAX_LLM_MESSAGES);
  const modelMessages = await convertToModelMessages(trimmed);

  // 7. 流式生成
  const result = streamText({
    model: provider(getChatModelId()),
    system,
    messages: modelMessages,
    tools: chatTools,
    // 客户端 tool 调用回流后允许 LLM 再生成一段确认文字（吃药提醒已设置 ✓）
    stopWhen: stepCountIs(2),
    onFinish: async ({ text }) => {
      // 输出禁词后置扫描（完整 ZH+EN 词表 + 屈折 regex）
      const scan = scanBannedWords(text);
      const outputHash = await shortHash(text);

      try {
        if (scan.hits.length > 0) {
          await writeChatAudit({
            event: 'chat_banned_word_hit',
            sessionId,
            inputHash,
            outputHash,
            metadata: {
              hits: scan.hits.map((h) => h.word),
              uniqueWords: Array.from(new Set(scan.hits.map((h) => h.word))),
              criticalHits: retrieved.criticalHits,
              vocabZh: BANNED_WORDS_ZH.length,
              vocabEn: BANNED_WORDS_EN.length,
            },
          });
        }
        await writeChatAudit({
          event: 'chat_turn',
          sessionId,
          inputHash,
          outputHash,
          retrievedSourceIds: retrieved.facts.map((f) => `${f.sourceRef.source}:${f.sourceRef.id}`),
          criticalHits: retrieved.criticalHits,
          metadata: {
            ingredientSlugs: retrieved.ingredientSlugs,
            medicationSlugs: retrieved.medicationSlugs,
            llmMessageCount: modelMessages.length,
          },
        });
      } catch (auditErr) {
        // CLAUDE.md §9.6 妥协 + 文件头 §3 边界：流已开始，audit 失败不能中断响应。仅 stderr。
        console.error('[chat] output audit write failed:', auditErr);
      }
    },
    onError: async ({ error }) => {
      console.error('[chat] streamText error:', error);
      try {
        await writeChatAudit({
          event: 'chat_error',
          sessionId,
          inputHash,
          metadata: { msg: error instanceof Error ? error.message : String(error) },
        });
      } catch {
        // 双重失败也只能咽了
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
