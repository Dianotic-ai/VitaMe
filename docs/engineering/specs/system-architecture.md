---
title: "System Architecture"
description: "VitaMe P0 deterministic core、Vercel AI SDK Agent shell 与 P1/P2 Reminder、Feedback、Memory、Hermit Agent 的系统架构。"
doc_type: "architecture"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "architecture", "agent", "vercel-ai-sdk", "memory", "p0", "p1", "p2"]
external_sources:
  - "https://ai-sdk.dev/docs/agents/overview"
  - "https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent"
  - "https://vercel.com/academy/svelte-on-vercel/tools-and-agents"
  - "https://docs.langchain.com/oss/javascript/langgraph/durable-execution"
---

# VitaMe — System Architecture

## 1. Architecture Principle

P0 deterministic core 是安全判断系统，P0 Agent shell 是黑客松可演示的工具调度层，P1/P2 是 Agent 自我进化系统。三者共享同一条可信边界：LLM 可以理解、解释、包装、归纳，但不得自行判定医学风险。

## 2. High-level Architecture

```
User
 │
 ▼
Next.js H5 UI
 │
 ├── P0 Agent Shell (planned MVP)
 │     └── /api/agent → Vercel AI SDK ToolLoopAgent
 │           ├── parseIntentTool
 │           ├── runJudgmentTool
 │           ├── translateRiskTool
 │           ├── createActionPlanTool
 │           └── createMemoryPreviewTool
 │
 ├── P0 Deterministic Verify
 │     ├── /api/intent       → L0 Query Intake
 │     ├── /api/judgment     → L2 Safety Judgment
 │     └── /api/translation  → L3 Safety Translation
 │
 └── P1/P2 Agent Loop (planned)
       └── AI SDK first; Mastra optional later
             ├── archive/save
             ├── reminder/create
             ├── feedback/log
             ├── memory/search
             └── hermit-cycle/run
```

## 3. Agent Runtime Decision

P0 deterministic core 不引入 Agent framework，继续保持 Next.js API routes 和确定性 L0/L2/L3 主链。

黑客松 MVP 新增 **Vercel AI SDK ToolLoopAgent** 作为 P0 Agent shell。它负责工具调度、tool trace、行动建议和 Memory preview，不负责医学风险等级。

Mastra 和 LangGraph 后移：Mastra 作为 P1/P2 workflow 候选，LangGraph 作为 durable checkpoint graph 候选。

详细 ADR：`docs/engineering/specs/agent-runtime-decision.md`。

## 4. P0 Layers

| Layer | Responsibility | Code |
|---|---|---|
| L0 Query Intake | natural language → grounded slugs | `src/lib/capabilities/queryIntake/` |
| L1 Knowledge | static baked data | `src/lib/db/` |
| L2 Judgment | deterministic risk evaluation | `src/lib/capabilities/safetyJudgment/` |
| L3 Translation | user-facing explanation | `src/lib/capabilities/safetyTranslation/` |

ToolLoopAgent 不包裹或替代 L2。任何复查风险都只能调用现有 deterministic judgment service。

## 5. P0 Agent Shell Tools

| Tool | Input | Output | Constraint |
|---|---|---|---|
| `parseIntentTool` | raw user message | grounded intake result | 不输出风险等级 |
| `runJudgmentTool` | grounded lookup request | `JudgmentResult` | 唯一风险等级来源 |
| `translateRiskTool` | structured risks | `TranslationResult` | 不改 level |
| `createActionPlanTool` | translation + level | action cards | 不诊断、不处方 |
| `createMemoryPreviewTool` | session summary | local preview | 不写长期存储 |

## 6. Planned Agent Components

| Component | Responsibility | Phase |
|---|---|---|
| Archive | 保存 verify result 和 context | P1 |
| Reminder Engine | 根据成分属性生成提醒 | P1 |
| Feedback Ritual | 提醒后收集轻反馈 | P1 |
| Memory Store | 存储可召回事件 | P2 |
| Memory Retriever | 为 Agent 召回相关上下文 | P2 |
| Hermit Agent | 周期性归纳模式 | P2 |
| Privacy HUD | 用户可见的数据路径控制 | P1/P2 |

## 7. Trust Boundary

- L0 LLM：只做 intent parsing 和问句措辞。
- ToolLoopAgent：只选择工具、解释工具结果、生成下一步行动。
- L2：唯一风险判定层。
- L3 LLM：只翻译，不改 level。
- Hermit LLM：只输出 observation，不输出诊断或处方。
- Severe keywords：硬编码拦截，不交给 LLM 判断。

## 8. Deployment Context

当前 P0 使用 Next.js API routes，Node runtime。ToolLoopAgent MVP 应作为同一 Next.js app 的 planned `/api/agent` route，不引入大型微服务。

## 9. Architectural Red Flags

- 前端直接拼 L2/L3 以外的医学判断。
- planned API 被 UI 当成已实现。
- Vercel AI SDK / Mastra / LangGraph 被写成当前已接入，除非对应代码和依赖已落地。
- Agent runtime 接管 L2 风险等级。
- Hermit 观察没有证据事件。
- Memory 默认上云且无可见开关。
- Reminder 被用于制造 DAU，而不是触发反馈。
