---
title: "VitaMe Docs"
description: "VitaMe 当前文档系统入口、阅读路径、目录说明和维护规则。"
doc_type: "index"
status: "active"
created: "2026-04-17"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["docs", "index", "navigation", "governance"]
---

# VitaMe Docs

`docs/` 是 VitaMe 的人类可读事实源。当前文档体系覆盖两层：P0 补剂安全判断楔子，以及 P1/P2 的 Agent 自我进化闭环。

## 先读什么

1. `docs/action-first-mvp/README.md` — 当前 MVP 的产品事实源和 AI coding harness。
2. `docs/action-first-mvp/01-prd.md` — Action-First MVP PRD 与验收口径。
3. `docs/action-first-mvp/05-ai-coding-agent-harness.md` — Sunny / AI coding agent 开发约束。
4. `docs/START-HERE.md` — 10 分钟理解当前状态。
5. `docs/product/当前判断.md` — 最新产品判断和取舍。
6. `docs/product/定位.md` — 产品定位。
7. `docs/product/Agent-北极星.md` — Reminder / Feedback / Memory / Hermit 长期方向。
8. `docs/product/PRD.md` — Master PRD。
9. `docs/engineering/specs/system-architecture.md` — 总架构。
10. `docs/engineering/specs/data-flow.md` — 数据流。
11. `docs/engineering/specs/api-contract.md` — implemented vs planned API。
12. `docs/DOCS-COVERAGE.md` — 文档完整性矩阵。

## 目录

- `action-first-mvp/`：当前 MVP 的产品设计、PRD、UI、功能、数据流、prompt 契约和 AI coding harness。
- `product/`：定位、PRD、用户旅程、路线图、Agent 北极星、指标、Aha、留存、Claims、视觉规范。
- `engineering/specs/`：架构、数据流、API、L0/L2/L3/compliance、测试矩阵、实现对照、上线和审核工作流。
- `engineering/plans/`：P0 实施计划、数据接入、数据烘焙。
- `decisions/`：会议纪要、技术决策、产品 pivot 记录。保留历史证据，不作为当前入口。
- `research/`：调研、种子问题、外部资料和医学/数据研究。可能包含敏感材料。
- `_archive/`：重复、过期、工具输出、旧策略稿。归档内容不进入日常阅读路径。

## Product Core

- `action-first-mvp/README.md`
- `action-first-mvp/00-product-principles.md`
- `action-first-mvp/01-prd.md`
- `action-first-mvp/02-user-journey-and-ui.md`
- `action-first-mvp/03-functional-spec.md`
- `action-first-mvp/04-system-data-flow.md`
- `action-first-mvp/05-ai-coding-agent-harness.md`
- `action-first-mvp/06-answer-and-prompt-contract.md`
- `action-first-mvp/07-acceptance-test-matrix.md`
- `product/当前判断.md`
- `product/定位.md`
- `product/Agent-北极星.md`
- `product/PRD.md`
- `product/用户旅程.md`
- `product/路线图.md`
- `product/Aha-Moment.md`
- `product/留存飞轮.md`
- `product/指标体系.md`
- `product/demo-script-map.md`
- `product/信任与Claims边界.md`
- `product/品牌视觉规范.md`

## Engineering Core

- `engineering/specs/system-architecture.md`
- `engineering/specs/data-flow.md`
- `engineering/specs/agent-runtime-decision.md`
- `engineering/specs/api-contract.md`
- `engineering/specs/test-matrix.md`
- `engineering/specs/implementation-map.md`
- `engineering/specs/medical-review-workflow.md`
- `engineering/specs/data-source-status.md`
- `engineering/specs/compliance-audit-status.md`
- `engineering/specs/launch-checklist.md`
- `engineering/specs/query-intake.md`
- `engineering/specs/safety-judgment.md`
- `engineering/specs/safety-translation.md`
- `engineering/specs/compliance.md`

## Frontmatter 标准

所有非归档 Markdown 文档必须包含：

```yaml
---
title: "文档标题"
description: "一句话说明文档用途"
doc_type: "文档类型"
status: "active | reference | superseded | draft"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
canonical: true
privacy: "internal | sensitive"
tags: ["tag-1", "tag-2"]
---
```

## 维护规则

- 新判断先更新 `product/当前判断.md`。
- Agent runtime 决策只写入 `engineering/specs/agent-runtime-decision.md`，不得在其他文档把 planned runtime 写成 implemented。
- planned 能力不得写成 implemented；差异统一记录在 `engineering/specs/implementation-map.md`。
- 新验收标准必须同步 `engineering/specs/test-matrix.md`。
- 归档前必须把仍有价值的 insight 抽取到 current 文档。
- `docs/research/gemini-health-consultation.md` 属敏感材料，不得默认 stage 或 push。
