// file: src/app/api/chat/route.ts — v0.3 主对话路由（Vercel Edge + streamText）
//
// 流程（CLAUDE.md §3.1）:
//   POST {messages, sessionId, profile?}
//     → retrieveFacts(latestUserMsg, profile)
//     → buildSystemPrompt({retrieved, profile})
//     → streamText(provider(model), system, messages)
//     → toUIMessageStreamResponse() ← 跟前端 useChat 对接
//     → 流结束 onFinish → 写 audit + banned word 后置校验（fire-and-forget）
//
// 关键设计:
// - Edge runtime: 流式输出不受 Vercel Hobby 60s 限制
// - LLM provider: minimax 国际版 (CLAUDE.md §4)，复用 D8 baseURL+/v1 trick
// - profile 客户端传，服务端不持久化（CLAUDE.md §9.8）
// - audit log 用 Upstash REST（Edge 无 fs，CLAUDE.md §14 坑 #7）
//
// 后置校验 caveat: streamText 已开始流后无法中断。banned word 命中只能写 audit，
// 不能"撤回"已流出的 token。前端可选做客户端 regex 渲染时遮罩（v0.3 暂不做）。

import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createChatProvider, getChatModelId } from '@/lib/llm/edgeProvider';
import { retrieveFacts } from '@/lib/chat/retriever';
import { buildSystemPrompt } from '@/lib/chat/systemPrompt';
import { writeChatAudit, shortHash } from '@/lib/chat/audit';
import { chatTools } from '@/lib/chat/tools';
import type { ProfileSnapshot } from '@/lib/chat/types';

export const runtime = 'edge';
export const maxDuration = 60; // streaming 不受此限，留 60 作为非流响应兜底

interface ChatBody {
  sessionId?: string;
  messages: UIMessage[];
  profile?: ProfileSnapshot;
}

const BANNED_WORDS = ['治疗', '治愈', '处方', '根治', '药效'];

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

  // 4. 流式生成
  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: provider(getChatModelId()),
    system,
    messages: modelMessages,
    tools: chatTools,
    // 客户端 tool 调用回流后允许 LLM 再生成一段确认文字（吃药提醒已设置 ✓）
    stopWhen: stepCountIs(2),
    onFinish: async ({ text }) => {
      // banned word 检测
      const hits = BANNED_WORDS.filter((w) => text.includes(w));
      const outputHash = await shortHash(text);

      try {
        if (hits.length > 0) {
          await writeChatAudit({
            event: 'chat_banned_word_hit',
            sessionId,
            inputHash,
            outputHash,
            metadata: { hits, criticalHits: retrieved.criticalHits },
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
          },
        });
      } catch (auditErr) {
        // CLAUDE.md §9.6 妥协：流已开始，audit 失败不能中断响应。仅 stderr。
        console.error('[chat] audit write failed:', auditErr);
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
