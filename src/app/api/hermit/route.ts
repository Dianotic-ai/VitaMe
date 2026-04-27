// file: src/app/api/hermit/route.ts — 北极星 §6 Hermit 周期归纳器
//
// 设计调整 vs 原 PR-PLAN：
// - 原计划：Vercel Cron 每周扫所有 person 的 events
// - 改成：客户端按需触发（用户点 /memory 页"Hermit 帮我看看"按钮）
//   理由 — Memory events 只在客户端 LocalStorage（§9.8），服务端没有数据可扫
// - 服务端只做 stateless: 接收 events JSON → LLM 归纳 → 返回 observation card 数组
//
// 严格遵守北极星 §6 列表：不诊断 / 不归因 / 不自动改方案 / 不替代医生
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createExtractorProvider, getChatModelId } from '@/lib/llm/edgeProvider';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface MemoryEventInput {
  eventType: string;
  occurredAt: string;
  entityRefs: string[];
  userText?: string;
  agentText?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}

interface HermitRequest {
  personName?: string;
  personRelation?: string;
  events: MemoryEventInput[];
  /** 当前 active person 的在吃保健品列表（用于 observation 引用） */
  currentSupplements?: { supplementId: string; mention: string; dosage?: string; schedule?: string }[];
}

export interface ObservationOutput {
  observationType: 'pattern' | 'recheck' | 'reminder-adjust' | 'request-field';
  /** 观察文字（北极星 §7：用户可见可确认范围） */
  text: string;
  /** 提案（可执行的小行动） */
  proposal?: string;
  /** 这条 observation 基于哪些 event（让用户知道为什么） */
  basedOnEventIds?: string[];
  /** 涉及的实体 */
  entityRefs?: string[];
}

const HERMIT_PROMPT = `你是 VitaMe 的 Hermit Agent — 一个**周期性归纳器**，**不是医生**。

# 你能做什么（北极星 §6 + §7）
1. 发现反馈模式（如"晚上服用后多次反馈胃不适"）
2. 提醒用户复查（如"你 30 天没更新过 X 病史，是否仍准确"）
3. 建议调整提醒（如"你早上 8 点的提醒最近 5 次都跳过，改 9 点？"）
4. 请求补充关键字段（如"为了更准建议，能告诉我你年龄段吗？"）

# 你**不能**做（违反任何一条 → 这条 observation 删掉）
- ❌ 诊断疾病（"你可能患了 X"）
- ❌ 因果医学归因（"你的胃不舒服是 B 族导致的"）
- ❌ 自动改用户方案（"你应该停止服用 X"）
- ❌ 替代医生（"不需要看医生，按我说的来"）

# 输出格式
严格 JSON，不要 markdown，不要解释。最多 3 条 observation。如果没值得说的就返回空数组。

每条 observation 形如：
{
  "observationType": "pattern" | "recheck" | "reminder-adjust" | "request-field",
  "text": "我观察到你..."（≤80字，必须用'我观察到'/'我注意到'开头）,
  "proposal": "（可选）一个用户可以接受/拒绝的小提案"（≤40字）,
  "entityRefs": ["相关 supplement / condition slug"]
}

# 风格
- 像懂行的朋友，不像医生
- 用"你"不用"您"
- 短句优先
- 不确定就少说，宁愿 0 条 observation 也别瞎归纳

# 输入数据
下方 <events> 是用户最近的 Memory events JSON。
<currentSupplements> 是用户在吃的保健品（用户口语可能叫"保健品 / 补品 / 营养品 / 补剂"，都是同一类）。

输出 JSON 数组（仅 observation 对象，不要包 root key）：[{...}, {...}]`;

interface HermitRawOutput {
  observationType?: string;
  text?: string;
  proposal?: string;
  basedOnEventIds?: string[];
  entityRefs?: string[];
}

function tryParseJson(text: string): HermitRawOutput[] {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence && fence[1]) s = fence[1].trim();
  // 有时 LLM 返回的是单 object 而不是 array
  if (s.startsWith('{')) s = `[${s}]`;
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitize(raw: HermitRawOutput[]): ObservationOutput[] {
  const VALID_TYPES = ['pattern', 'recheck', 'reminder-adjust', 'request-field'];
  return raw
    .filter((r) => r?.text && r.observationType && VALID_TYPES.includes(r.observationType))
    .map((r) => ({
      observationType: r.observationType as ObservationOutput['observationType'],
      text: String(r.text).trim().slice(0, 200),
      proposal: r.proposal ? String(r.proposal).trim().slice(0, 100) : undefined,
      basedOnEventIds: Array.isArray(r.basedOnEventIds) ? r.basedOnEventIds.slice(0, 10) : undefined,
      entityRefs: Array.isArray(r.entityRefs) ? r.entityRefs.slice(0, 5) : undefined,
    }))
    .slice(0, 3);
}

export async function POST(req: Request) {
  let body: HermitRequest;
  try {
    body = (await req.json()) as HermitRequest;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.events || body.events.length === 0) {
    return NextResponse.json({ observations: [], skipped: 'no events' });
  }

  // 限制注入的 event 数量，避免 prompt 爆炸
  const recentEvents = body.events.slice(-50);

  const prompt = `${HERMIT_PROMPT}

<person>
名字：${body.personName ?? '匿名'}
关系：${body.personRelation ?? 'self'}
</person>

<currentSupplements>
${JSON.stringify(body.currentSupplements ?? [], null, 2)}
</currentSupplements>

<events count="${recentEvents.length}">
${JSON.stringify(recentEvents, null, 2)}
</events>

输出 JSON 数组：`;

  try {
    const provider = createExtractorProvider();
    const { text } = await generateText({
      model: provider(getChatModelId()),
      prompt,
      temperature: 0.3,
    });

    const observations = sanitize(tryParseJson(text));
    return NextResponse.json({ observations });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[hermit] LLM call failed:', msg);
    return NextResponse.json({ error: msg, observations: [] }, { status: 500 });
  }
}
