---
title: "Agent Runtime Decision"
description: "VitaMe Agent runtime 选型记录：5 天黑客松 MVP 选择 Vercel AI SDK ToolLoopAgent 作为 P0 Agent shell，Mastra/LangGraph 留作后续评估。"
doc_type: "adr"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "architecture", "agent-runtime", "vercel-ai-sdk", "tool-loop-agent", "adr"]
external_sources:
  - "https://ai-sdk.dev/docs/agents/overview"
  - "https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent"
  - "https://vercel.com/academy/svelte-on-vercel/tools-and-agents"
  - "https://mastra.ai/"
  - "https://docs.langchain.com/oss/javascript/langgraph/durable-execution"
source_docs:
  - "docs/engineering/specs/system-architecture.md"
  - "docs/engineering/specs/data-flow.md"
  - "docs/product/Agent-北极星.md"
---

# VitaMe — Agent Runtime Decision

## 1. Decision

5 天黑客松 MVP 选择 **Vercel AI SDK ToolLoopAgent** 作为 P0 Agent shell。

P0 deterministic core 不变：`/api/intent`、`/api/judgment`、`/api/translation` 仍是风险判断事实源。ToolLoopAgent 只负责理解用户请求、选择工具、调用现有能力、展示 tool trace 和生成下一步行动建议。

Mastra 不再作为近端主选型。Mastra 保留为 P1/P2 Reminder → Feedback → Memory → Hermit workflow 的后续评估项。LangGraph 保留为更复杂 durable graph / checkpoint / human-in-the-loop 场景的后续评估项。

## 2. Context

VitaMe 参加 AI 黑客松，Demo 不能只是静态安全卡片。评委需要看到 Agent 行为：理解输入、调用工具、受边界约束、给出下一步行动，并把一次 Verify 转成后续 Memory / Reminder 的起点。

但健康场景不能让 LLM 自行决定医学风险等级。因此 Agent shell 必须包在现有 deterministic core 外面，而不是替代 L2。

## 3. Target Runtime

| Layer | Runtime | Status |
|---|---|---|
| P0 deterministic APIs | Next.js API routes | implemented |
| P0 Agent shell | Vercel AI SDK `ToolLoopAgent` | planned for MVP |
| P1/P2 workflow | Vercel AI SDK first; Mastra optional later | planned |
| Durable long-running graph | LangGraph optional later | deferred |

## 4. Agent Tools

ToolLoopAgent 可调用的工具必须是白名单：

| Tool | Responsibility | May Decide Risk Level |
|---|---|---|
| `parseIntentTool` | 调用 L0 intake / grounding | no |
| `runJudgmentTool` | 调用 L2 deterministic judgment | yes, by returning L2 output only |
| `translateRiskTool` | 调用 L3 translation / fallback | no |
| `createActionPlanTool` | 基于结构化结果生成下一步行动卡 | no |
| `createMemoryPreviewTool` | 生成 session-local Memory seed 预览 | no |

## 5. Why Vercel AI SDK

- 与当前 TypeScript / Next.js 栈一致，接入成本最低。
- `ToolLoopAgent` 是面向 tool-use loop 的官方抽象，适合“模型选择工具 → SDK 执行工具 → 模型基于结果继续响应”的 Demo。
- `tool()` + schema validation 能把 LLM 输出限制在可验证参数内。
- `stopWhen: stepCountIs(n)` 可以限制工具循环，避免 Agent 在健康场景无限推理。
- 可先作为单 route MVP 实现，不改变现有 P0 API。

## 6. Why Not Mastra / LangGraph Now

Mastra 适合更完整的 workflow、memory、observability，但 5 天内引入会扩大依赖和概念面。LangGraph 更强在 durable execution 和 checkpoint，但当前 MVP 不需要复杂长任务恢复。

这两者都不是否定，只是后移：先用 AI SDK 做 P0 Agent shell，等 P1/P2 真实 Reminder、Feedback、Memory、Hermit 要落地时再重评估。

## 7. Boundary

- ToolLoopAgent 不得直接生成 `red/yellow/gray/green`。
- 任何风险等级必须来自 `runJudgmentTool` 的 L2 输出。
- Agent prompt 必须明确“不诊断、不处方、不替代医生”。
- tool loop 必须有 step limit。
- Memory / Reminder 在 P0 只做 preview 或 planned，不写成已落地后端能力。

## 8. Consequences

| Area | Consequence |
|---|---|
| Hackathon story | Demo 从“安全卡片”升级为“受约束的健康 Agent” |
| Engineering risk | 新增 Agent shell，但不重写 L0/L2/L3 |
| Compliance | 医学风险仍由 deterministic L2 控制 |
| Future P1/P2 | 可先复用 AI SDK agent pattern，再评估 Mastra |
| Future durable tasks | 若 Hermit 需要跨天 checkpoint，再评估 LangGraph |
