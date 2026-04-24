---
title: "Data Flow"
description: "VitaMe 用户输入、风险判断、提醒、反馈、Memory 召回和 Hermit 周期任务的数据流。"
doc_type: "data-flow"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "data-flow", "agent", "memory", "privacy"]
---

# VitaMe — Data Flow

## 1. P0 Deterministic Verify Flow

```
rawQuery
  → /api/intent
  → IntentResult + grounded slugs
  → /api/judgment
  → Risk[]
  → /api/translation
  → TranslationResult
  → result UI
```

Rules:

- rawQuery 不应进入长期存储。
- L0 输出 slug，不输出风险判断。
- L2 输出结构化风险。
- L3 输出用户可读解释和 disclaimer。
- Deterministic flow 不经过 Agent runtime；它是 ToolLoopAgent 可调用的安全工具链。

## 2. P0 Agent Shell Flow (planned MVP)

```
rawUserMessage
  → /api/agent
  → ToolLoopAgent
  → parseIntentTool
  → runJudgmentTool
  → translateRiskTool
  → createActionPlanTool
  → createMemoryPreviewTool
  → AgentTrace + TranslationResult + ActionPlan
  → agent demo UI
```

Rules:

- ToolLoopAgent 只能调用白名单工具。
- `runJudgmentTool` 是唯一风险等级来源。
- `stopWhen` 必须限制 step 数，防止无限工具循环。
- Agent trace 应展示“识别了什么、调用了什么工具、工具返回了什么”。
- Memory preview 只在 session 内展示，不写成长期存储。

## 3. P1 Planned Workflow

```
TranslationResult saved
  → workflow step: create ArchiveEntry
  → deterministic step: build ReminderPlan
  → scheduled step: fire ReminderEvent
  → user step: collect FeedbackEvent
  → deterministic step: write MemoryEvent
```

Rules:

- Reminder 默认来自硬编码属性表。
- Feedback 一次一问。
- 严重异常关键词先过 hard guard。
- 用户可暂停、降频、删除。
- P1 workflow runtime 尚未锁死；优先复用 AI SDK pattern，必要时再评估 Mastra。

## 4. P2 Planned Memory + Hermit Flow

```
MemoryEvent[]
  → workflow step: MemoryRetriever Top N
  → agent step: Hermit observation draft
  → user step: confirms / rejects
  → deterministic step: LearningSignal
```

Rules:

- Observation 必须引用来源事件。
- 用户确认前不能改变核心健康判断。
- 用户否定必须进入学习信号。
- 删除的 Memory 不可被召回。
- Hermit Agent 只能生成 observation，不生成诊断、处方或风险等级。

## 5. Privacy Flow

```
Field
  → privacyMode
  → local | pseudonymous | cloud_memory
  → prompt redaction
  → LLM input preview
```

Privacy modes:

| Mode | Meaning |
|---|---|
| local | 只用于本地规则，不进入 LLM |
| pseudonymous | 去标识化后可用于判断或解释 |
| cloud_memory | 用户明示同意后进入长期 Memory |

## 6. Data Retention Defaults

- P0 session：短 TTL。
- Archive：用户主动保存才创建。
- Feedback：用户主动响应才创建。
- Memory：必须有 privacy mode。
- Audit：不存 PII，存 hash、规则 id、命中状态。

## 7. Runtime Status

| Flow | Runtime | Status |
|---|---|---|
| P0 Verify | Next.js API routes | implemented |
| P0 Agent shell | Vercel AI SDK ToolLoopAgent | planned MVP |
| Archive / Recheck | Next.js route + future workflow backing | planned |
| Reminder / Feedback | AI SDK first; Mastra optional later | planned |
| Memory / Hermit | AI SDK first; Mastra / LangGraph optional later | planned |
