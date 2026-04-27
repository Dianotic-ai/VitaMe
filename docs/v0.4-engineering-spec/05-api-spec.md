---
title: "v0.4 API 规格"
description: "`/api/chat` `/api/extract` `/api/hermit` 三个核心路由的请求 / 响应 schema + tool-use 协议 + audit 事件类型。"
doc_type: "api-spec"
status: "active"
created: "2026-04-27"
canonical: true
---

# API 规格

## 0. 全局约定

- Base URL: `https://vitame.live`
- Content-Type: `application/json` (request & response)
- 无 auth header（v0.4 不做用户系统）
- CORS：仅同源（无 cross-origin 调用场景）
- 老 v0.2 路由（`/api/agent` `/api/intent` `/api/judgment` `/api/translation`）保留但 chat 路径不调用

---

## 1. POST `/api/chat`

主对话路由，Vercel Edge runtime + streamText。

### 1.1 Request

```ts
interface ChatBody {
  sessionId: string;          // 必填，profile.sessionId（永久 nanoid）
  messages: UIMessage[];      // 必填，AI SDK 标准 UIMessage[]，最末必须是 user role
  profile?: ProfileSnapshot;  // 可选，活的 person 快照（详见下）
}

interface ProfileSnapshot {
  conditions?: { slug?: string; mention: string; firstAt: string }[];
  medications?: { slug?: string; mention: string; isLongTerm?: boolean }[];
  currentSupplements?: {       // Codex Finding #4 修复后注入
    slug?: string;
    mention: string;
    dosage?: string;
    schedule?: string;
    startedAt?: string;
  }[];
  allergies?: { mention: string; firstAt: string }[];
  specialGroups?: string[];
  ageRange?: '<18'|'18-30'|'30-45'|'45-60'|'60+';
  sex?: 'M'|'F';
  recentTopics?: string[];     // 最近 conversationSummaries 的 topics 平铺，最多 6
}
```

### 1.2 Response

Stream（SSE）：AI SDK v6 `toUIMessageStreamResponse()` 标准格式：
- `text` chunks
- `tool-call` parts（当 LLM 决定调 `create_reminder`）
- `tool-result` parts（客户端 onToolCall 处理后回传）
- `finish` event

错误情况返回 JSON：

| Status | Body | 触发 |
|---|---|---|
| 400 | `{error:"invalid json body"}` | req.json() 解析失败 |
| 400 | `{error:"sessionId and messages required"}` | 必填字段缺失 |
| 400 | `{error:"no user message found"}` | messages 没有 user role 项 |
| 500 | `{error:"<provider err>"}` | createChatProvider 抛错（env missing） |

流式中错误：`onError` 回调写 `chat_error` audit + `console.error`，stream 自然结束（用户看到部分输出）。

### 1.3 Tool 协议

仅一个 tool：

```ts
chatTools.create_reminder = tool({
  description: '为当前 active person 的某个保健品创建每日吃药提醒...',
  inputSchema: z.object({
    supplementMention: z.string().min(1),
    timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
  }),
  // 无 execute → 客户端 useChat onToolCall 处理
})
```

streamText 配 `stopWhen: stepCountIs(2)` — 允许 tool-call → tool-result → 确认文字 共 2 step。

### 1.4 客户端处理 tool 调用

```tsx
useChat({
  id: `chat-${activePerson.id}`,
  messages: storedMessages,
  transport: new DefaultChatTransport({ api: '/api/chat', body: () => ({...}) }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
});

// useEffect 监听 messages 中 tool-create_reminder 的 'input-available' 状态
// → 模糊匹配 supplement → 自动 addSupplement (如缺) → addRule → addToolResult
```

### 1.5 历史裁剪

- UI 全保留 (storedMessages, 上限 12 条/person)
- 发给 LLM 仅最近 `MAX_LLM_MESSAGES = 10` 条 ≈ 5 轮配对（Codex Finding #1）

---

## 2. POST `/api/extract`

每轮 chat 完成后异步调，从对话抽 ProfileDelta。

### 2.1 Request

```ts
interface ExtractBody {
  sessionId: string;       // 必填
  userMsg: string;         // 必填
  assistantMsg: string;    // 必填
}
```

### 2.2 Response

```ts
interface ExtractResponse {
  delta?: ProfileDelta;
  skipped?: boolean;       // userMsg.length < 3 时 skipped=true, delta=空
  error?: string;
}

interface ProfileDelta {
  newConditions?: { mention: string; slug?: string }[];
  newMedications?: { mention: string; slug?: string; isLongTerm?: boolean }[];
  newSupplements?: { mention: string; slug?: string; brand?: string; dosage?: string }[];
  newAllergies?: { mention: string }[];
  newSpecialGroups?: ('pregnancy'|'breastfeeding'|'infant'|'elderly')[];
  ageRange?: '<18'|'18-30'|'30-45'|'45-60'|'60+';
  sex?: 'M'|'F';
  conversationSummary?: { summary: string; topics: string[] };
}
```

### 2.3 实现要点

- runtime: nodejs（普通 JSON）
- maxDuration: 30s
- 内部用 `extractMemoryFromTurn` 调 minimax → 严格 JSON 输出 prompt
- 无 audit（数据不出本机）
- userMsg < 3 字符直接 skip（"嗯" / "好" 没必要 LLM 调用）

### 2.4 客户端幂等（Codex Finding #2）

- `processedExtractRef: Set<lastMsg.id>` 已处理 message id 不再 fetch
- hydration 时把已存历史里所有 assistant id 一次性标"已处理"
- 切换 person → ref.clear()

---

## 3. POST `/api/hermit`

Hermit Agent 周期归纳，stateless LLM call。

### 3.1 Request

```ts
interface HermitRequest {
  personName?: string;
  personRelation?: string;
  events: MemoryEventInput[];   // 必填，最近 ≤50 条
  currentSupplements?: { supplementId: string; mention: string; dosage?: string; schedule?: string }[];
}

interface MemoryEventInput {
  eventId: string;              // Codex Finding #6 后必填
  eventType: string;
  occurredAt: string;
  entityRefs: string[];
  userText?: string;
  agentText?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
}
```

### 3.2 Response

```ts
interface HermitResponse {
  observations: ObservationOutput[];   // 最多 3 条
  error?: string;
  skipped?: string;                    // 'no events' 等
}

interface ObservationOutput {
  observationType: 'pattern'|'recheck'|'reminder-adjust'|'request-field';
  text: string;                        // ≤200 字
  proposal?: string;                   // ≤100 字
  basedOnEventIds: string[];           // 必须 ⊆ 输入 events 的 eventId（sanitize 强制）
  entityRefs?: string[];
}
```

### 3.3 错误

| Status | Body | 触发 |
|---|---|---|
| 400 | `{error:"invalid json"}` | req.json() 解析失败 |
| 200 | `{observations:[], skipped:"no events"}` | events 空 |
| 500 | `{error:"<msg>", observations:[]}` | LLM 调用失败 |

### 3.4 Sanitize 规则（4 条铁律）

- observationType 必须 ∈ `{pattern, recheck, reminder-adjust, request-field}`
- text 必填且 ≤200 字
- basedOnEventIds 必须 ≥1 且全部在输入里（不在的过滤掉）
- basedOnEventIds 过滤后空 → 整条 observation 丢弃

### 3.5 LLM Prompt 4 条 ❌

- ❌ 诊断疾病
- ❌ 因果医学归因
- ❌ 自动改用户方案
- ❌ 替代医生

---

## 4. Audit log（写入 Upstash Redis REST）

### 4.1 事件类型

```ts
type ChatAuditEvent =
  | 'chat_input'                      // 流前 input audit (Codex #5 加)
  | 'chat_input_banned_word_hit'      // 用户输入禁词命中 (Codex #5 加)
  | 'chat_turn'                       // 流后 output audit (turn 完成)
  | 'chat_banned_word_hit'            // 输出禁词命中
  | 'chat_error';                     // streamText 报错
```

### 4.2 Record schema

```ts
interface ChatAuditRecord {
  event: ChatAuditEvent;
  sessionId: string;
  inputHash?: string;                 // shortHash(latestUserText)
  outputHash?: string;                // shortHash(完整流出文字)
  retrievedSourceIds?: string[];      // ['nih-ods:vitamin-d', ...]
  criticalHits?: number;
  metadata?: Record<string, unknown>; // 不含明文健康数据
}
```

### 4.3 边界（详见 07-compliance.md §4）

- **流前** input audit：sync，失败可拒请求（v0.4 选"记录后继续"避免 audit infra 故障导致 chat 全挂）
- **流后** output audit：流已开始，失败仅 stderr，无法撤回 token

### 4.4 不记录

- 用户原话明文（仅 hash）
- profile 字段（diseases / medications 等）
- session 之间的关联

---

## 5. 老路径 API（v0.2，chat 路径不调）

| Path | 用途 | 状态 |
|---|---|---|
| `/api/agent` | v0.2 主 Agent shell | 锁定不动 |
| `/api/intent` | v0.2 意图识别 | 同上 |
| `/api/judgment` | v0.2 风险判定 | 同上 |
| `/api/translation` | v0.2 风险翻译 | 同上 |
| `/api/archive/save` `/api/archive/recheck` | v0.2 archive | 同上 |

CLAUDE.md §10 锁这些不改。

---

**事实源**：`src/app/api/*/route.ts` + `src/lib/chat/types.ts` + `src/lib/chat/audit.ts` + `src/lib/chat/tools.ts`
