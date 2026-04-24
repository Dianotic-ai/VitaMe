---
title: "Metrics Instrumentation"
description: "VitaMe P0/P1/P2 指标埋点契约：区分 P0 上线必需指标、P1/P2 planned Agent 指标和安全健康指标。"
doc_type: "spec"
status: "active"
created: "2026-04-20"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "metrics", "instrumentation", "p0", "p1", "p2", "agent"]
source_docs:
  - "docs/product/指标体系.md"
  - "docs/product/PRD.md"
  - "docs/product/demo-script-map.md"
  - "docs/engineering/specs/implementation-map.md"
---

# VitaMe — Metrics Instrumentation

## 1. Rule

本文是指标契约，不是实现状态报告。事件分三类：

| Status | Meaning |
|---|---|
| p0-required | 5 天上线应具备的最小观测点 |
| planned | P1/P2 设计目标，当前不得写成已实现 |
| guardrail | 安全、合规、疲劳和隐私健康指标 |

当前代码是否已接入埋点，以 `implementation-map.md` 或实际代码为准。

## 2. Metric Layers

| Phase | North Star / Proxy | Definition |
|---|---|---|
| P0 | Qualified Safety Decision | 用户完成一次安全判断，并理解风险、边界或证据 |
| P1 | Feedback Loop Completion | 用户从保存结果进入提醒，并完成一次轻反馈 |
| P2 | Confirmed Agent Learning | Hermit observation 被用户确认或纠错 |

## 3. P0 Required Events

| Event | Trigger | Required Properties |
|---|---|---|
| `vitame_query_started` | 用户提交查询 | `session_id`, `query_id`, `source_mode` |
| `vitame_intent_completed` | `/api/intent` 成功 | `intent_type`, `missing_slot_count`, `clarify_count` |
| `vitame_intent_failed` | `/api/intent` 失败 | `error_kind`, `fallback_used` |
| `vitame_judgment_completed` | `/api/judgment` 成功 | `overall_level`, `risk_count`, `rule_hit_count` |
| `vitame_judgment_failed` | `/api/judgment` 失败 | `error_kind`, `partial_data` |
| `vitame_translation_completed` | `/api/translation` 成功 | `overall_level`, `template_fallback_used` |
| `vitame_result_viewed` | 结果页首次展示 | `overall_level`, `disclaimer_present`, `demo_banner_present` |
| `vitame_evidence_viewed` | 用户展开证据 | `reason_code`, `source_type` |
| `vitame_understood_clicked` | 用户点击“知道了/我理解了” | `overall_level`, `after_evidence_view` |
| `vitame_agent_hook_viewed` | 展示 Reminder/Memory 北极星钩子 | `hook_type`, `surface` |
| `vitame_agent_started` | `/api/agent` 开始处理 | `session_id`, `runtime`, `tool_loop_limit` |
| `vitame_agent_tool_called` | Agent 调用工具 | `tool_name`, `step_index`, `allowed` |
| `vitame_agent_tool_completed` | 工具返回结果 | `tool_name`, `status`, `latency_ms` |
| `vitame_agent_finished` | Agent shell 返回最终响应 | `step_count`, `overall_level`, `disclaimer_present` |

P0 不要求真实保存、真实提醒、真实 Memory。若 UI 展示保存或北极星钩子，事件只能记录点击和展示，不得记录成后端已完成。

## 4. P1 Planned Events

| Event | Trigger | Status |
|---|---|---|
| `vitame_archive_save_clicked` | 用户点击保存 | planned |
| `vitame_archive_saved` | 后端创建 ArchiveEntry | planned |
| `vitame_reminder_created` | 创建提醒计划 | planned |
| `vitame_reminder_fired` | 提醒触达 | planned |
| `vitame_feedback_logged` | 用户完成一次轻反馈 | planned |
| `vitame_feedback_severe_keyword_hit` | 反馈命中严重异常关键词 | planned guardrail |
| `vitame_reminder_frequency_reduced` | 用户跳过后降频 | planned guardrail |

## 5. P2 Planned Events

| Event | Trigger | Status |
|---|---|---|
| `vitame_memory_event_created` | 反馈或观察写入 Memory | planned |
| `vitame_memory_recalled` | Memory 被召回供 Agent 使用 | planned |
| `vitame_memory_deleted` | 用户删除 Memory | planned guardrail |
| `vitame_hermit_cycle_started` | 周期任务开始 | planned |
| `vitame_hermit_observation_created` | 生成 observation draft | planned |
| `vitame_hermit_observation_confirmed` | 用户确认 observation | planned |
| `vitame_hermit_observation_rejected` | 用户否定 observation | planned guardrail |

## 6. Guardrail Metrics

| Metric | Why It Matters |
|---|---|
| Disclaimer coverage | 所有 AI 解释、反馈页、Hermit observation 必须有边界提示 |
| DemoBanner coverage | 未医学审核规则命中时必须提示 demo / pending review |
| Gray rate | 未收录和不确定不能被包装成绿色 |
| Severe keyword escalation rate | 反馈中的危险信号必须脱离 Agent 推理 |
| Reminder fatigue | 连续跳过必须触发暂停或降频 |
| Memory deletion success | 删除后不可再被召回 |
| Hermit rejection rate | 高拒绝率说明 observation 质量或边界有问题 |

## 7. Dashboard Cuts

| Cut | Values |
|---|---|
| Phase | `p0`, `p1`, `p2` |
| Risk level | `red`, `yellow`, `gray`, `green` |
| Source mode | `manual`, `ocr`, `link`, `demo_seed` |
| Person ref | `self`, `mom`, `dad`, `other`, `none` |
| Runtime | `next_api`, `vercel_ai_sdk_tool_loop_planned`, `mastra_planned`, `none` |

`runtime = vercel_ai_sdk_tool_loop_planned` 只能在 `/api/agent` 实现前用于文档和 mock 标注。P0 deterministic APIs 真实运行仍是 `next_api`。

## 8. Acceptance

- P0 dashboard 能回答：查询是否开始、是否完成判断、结果等级是什么、用户是否看懂或查看证据。
- P1/P2 事件在后端未实现前只能标 `planned`，不得进入“已完成”漏斗。
- 所有涉及健康风险的事件不记录 PII；如需关联用户，只存匿名 `session_id` / `query_id` / `person_ref`。
