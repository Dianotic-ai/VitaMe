---
title: "VitaMe API Contract"
description: "VitaMe 当前已实现 API 与 planned API 的接口契约，区分代码事实和产品目标。"
doc_type: "contract"
status: "active"
created: "2026-04-20"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "api", "contract", "implemented", "planned"]
source_docs:
  - "docs/product/PRD.md"
  - "docs/product/Agent-北极星.md"
  - "docs/engineering/specs/system-architecture.md"
  - "docs/engineering/specs/data-flow.md"
  - "docs/engineering/specs/agent-runtime-decision.md"
---

# VitaMe — API Contract

## 1. Rule

本文档把接口分成两类：

- `implemented`：当前代码中已存在 route。
- `planned`：产品和架构目标，不能写成已完成。

当前 implemented 以代码事实为准：`src/app/api/intent/route.ts`、`src/app/api/judgment/route.ts`、`src/app/api/translation/route.ts`。

Agent runtime 选择不改变已实现 API。P0 Agent shell 计划使用 Vercel AI SDK ToolLoopAgent 暴露新的 planned `/api/agent`；它只能调用现有 L0/L2/L3 工具链，不得自行生成风险等级。

## 2. Implemented APIs

### `POST /api/intent`

Purpose：自然语言 query → L0 IntakeOutcome。

Request：

```ts
type IntentRequest = {
  sessionId: string;
  rawQuery: string;
  imageOcrText?: string;
  history?: Array<{ topic: string; userChoice: string }>;
};
```

Response：`IntakeOutcome`，由 `src/lib/capabilities/queryIntake/intakeOrchestrator.ts` 定义。

Behavior：

- LLM 只做 intent parsing 和问句包装。
- Grounding 和 slot decision 必须走确定性逻辑。
- 最多 2 轮 clarify。
- 错误走 `{ error: { kind, message } }` envelope。

### `POST /api/judgment`

Purpose：grounded LookupRequest → structured JudgmentResult。

Request：

```ts
type JudgmentRequest = {
  sessionId: string;
  request: {
    ingredients: string[];
    medications: string[];
    conditions: string[];
    allergies?: string[];
    specialGroups?: string[];
    genes?: string[];
    timings?: string[];
    strategies?: string[];
  };
};
```

Response：`JudgmentResult`，由 `src/lib/types/risk.ts` 定义。

Behavior：

- 风险判断必须来自 L1/L2。
- LLM 不得参与 level 判定。
- red > yellow > gray > green。

### `POST /api/translation`

Purpose：Risk[] → human-readable TranslationResult。

Request：

```ts
type TranslationRequest = {
  sessionId: string;
  risks: Risk[];
};
```

Response：`TranslationResult`。

Behavior：

- L3 可以调用 LLM，但不得改变 level、dimension、reasonCode、cta。
- disclaimer 顶层必须非空。
- LLM 失败时走 template fallback。

## 3. Planned APIs

本节全部是 planned。当前不得从 UI 当成真实后端能力调用。

### `POST /api/agent`

Status：planned MVP。

Purpose：黑客松 Agent shell。接收自然语言请求，由 ToolLoopAgent 调用白名单工具，返回安全判断结果、行动建议和 tool trace。

Target request：

```ts
type AgentRequest = {
  sessionId: string;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  demoMode?: boolean;
};
```

Target response：

```ts
type AgentResponse = {
  sessionId: string;
  trace: Array<{
    step: "parse_intent" | "run_judgment" | "translate_risk" | "create_action_plan" | "create_memory_preview";
    status: "started" | "completed" | "failed";
    summary: string;
  }>;
  intake?: unknown;
  judgment?: JudgmentResult;
  translation?: TranslationResult;
  actionPlan?: Array<{
    label: string;
    intent: "avoid" | "ask_doctor" | "review_evidence" | "save_preview" | "reminder_preview";
    enabled: boolean;
  }>;
  memoryPreview?: {
    personLabel?: string;
    facts: string[];
    privacyMode: "local";
  };
  disclaimer: string;
};
```

Runtime note：`runJudgmentTool` 是唯一风险等级来源。ToolLoopAgent 不得直接输出 `red/yellow/gray/green`。

### Agent Tool Contracts

本节定义 planned `/api/agent` 内部可调用工具。工具契约借鉴 Vercel-style tool loop：每个 tool 必须有稳定 input/output、trace summary 和清晰权限边界。工具可以由 AI SDK Agent shell 调度，但医学风险事实只能来自 deterministic service。

| Tool | Status | Input | Output | Deterministic | Boundary |
|---|---|---|---|---|---|
| `parseIntentTool` | planned | `message`, `history?` | `IntakeOutcome` | mixed | 不输出风险等级 |
| `runJudgmentTool` | planned | grounded `LookupRequest` | `JudgmentResult` | yes | 唯一风险等级来源 |
| `translateRiskTool` | planned | `Risk[]`, `locale?` | `TranslationResult` | mixed | 不改写 level/dimension/reasonCode |
| `createActionPlanTool` | planned | `JudgmentResult`, `TranslationResult` | action cards | yes | 只给下一步建议，不诊断、不处方 |
| `createMemoryPreviewTool` | planned | session summary, user label | local preview | mixed | 不写长期存储，不默认上云 |

Tool trace target shape：

```ts
type AgentToolTrace = {
  tool:
    | "parseIntentTool"
    | "runJudgmentTool"
    | "translateRiskTool"
    | "createActionPlanTool"
    | "createMemoryPreviewTool";
  status: "started" | "completed" | "failed";
  summary: string;
  source: "llm" | "deterministic" | "template";
};
```

Provider note：模型 provider 可通过 AI SDK provider abstraction 或 AI Gateway 切换。Provider 变化不得改变 tool contract、risk level precedence 或 disclaimer requirements。

### `POST /api/archive/save`

Status：planned。

Purpose：保存一次 Verify 结果到 person context。

Runtime note：未来可由 AI SDK workflow pattern 或 Mastra workflow step 支撑，但 route contract 不随 runtime 改变。

Target request：

```ts
type ArchiveSaveRequest = {
  sessionId: string;
  personRef: { label: "self" | "mom" | "dad" | "other"; customLabel?: string };
  querySummary: string;
  result: TranslationResult;
};
```

### `POST /api/archive/recheck`

Status：planned。

Purpose：基于已保存 context 新增一项并复查。

Runtime note：复查必须调用现有 deterministic `/api/judgment` 语义，不允许 Agent runtime 自行改判定。

### `POST /api/reminder/create`

Status：planned。

Purpose：保存结果后创建提醒计划。

Runtime note：未来可由 AI SDK workflow pattern 或 Mastra workflow 编排提醒创建、暂停和降频。

### `POST /api/feedback/log`

Status：planned。

Purpose：记录提醒后的轻反馈。

Runtime note：严重异常关键词必须先过 hard guard，再进入任何 Agent 归纳。

### `POST /api/memory/search`

Status：planned。

Purpose：按相关性召回 Memory，供 Agent 使用。

Runtime note：Memory 召回必须遵守 privacy mode 和删除语义。

### `POST /api/hermit-cycle/run`

Status：planned。

Purpose：周期性扫描 Memory 并生成 observation。P0/P1 不实现。

Runtime note：Hermit 只能输出 observation draft，不能输出诊断、处方或风险等级。

## 4. Error Envelope

All APIs use:

```ts
type ApiError = {
  error: {
    kind: "validation" | "network" | "timeout" | "invalid_response" | "internal";
    message: string;
  };
};
```

## 5. Implementation Notes

- 前端 API client 位于 `src/lib/api/client.ts`。
- planned API 不应被前端调用，除非对应 route 已落地。
- 文档目标和代码差异记录在 `docs/engineering/specs/implementation-map.md`。
