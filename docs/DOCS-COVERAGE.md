---
title: "Docs Coverage"
description: "VitaMe 当前文档完整性矩阵：列出核心文档、状态、用途、负责人和缺口。"
doc_type: "matrix"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["docs", "coverage", "matrix", "governance"]
---

# VitaMe — Docs Coverage

> 状态枚举：`current` = 当前可用；`rewrite-needed` = 有内容但需要重写；`missing` = 缺失；`archived` = 已归档；`superseded` = 已被当前文档吸收。

## 1. 当前事实源

| 文档 | 状态 | 用途 | Owner |
|---|---|---|---|
| `docs/START-HERE.md` | current | 10 分钟项目入口 | PM / Agent |
| `docs/product/当前判断.md` | current | 最新产品判断和洞察 | PM |
| `docs/product/Agent-北极星.md` | current | 长期 Agent 北极星 | PM |
| `docs/SESSION-STATE.md` | current | 会话和工程进度 ledger | Engineering |
| `docs/README.md` | current | 文档目录和治理规则 | PM Ops |
| `docs/DOCS-COVERAGE.md` | current | 文档缺口矩阵 | PM Ops |

## 2. 产品核心文档

| 文档 | 状态 | 用途 | Owner |
|---|---|---|---|
| `docs/product/定位.md` | current | 产品定位和边界 | PM |
| `docs/product/PRD.md` | current | Master PRD | PM |
| `docs/product/用户旅程.md` | current | Verify → Memory → Hermit 端到端旅程 | PM / Design |
| `docs/product/路线图.md` | current | Outcome roadmap | PM |
| `docs/product/Aha-Moment.md` | current | P0/P1/P2 激活路径 | PM |
| `docs/product/留存飞轮.md` | current | Reminder + Feedback + Memory 留存闭环 | PM |
| `docs/product/指标体系.md` | current | North Star 和指标体系 | PM / Data |
| `docs/product/demo-script-map.md` | current | 90 秒 Demo 到验收项映射 | PM / QA |
| `docs/product/P0-执行总纲.md` | current | P0 唯一执行基线 | PM / Eng |
| `docs/product/风险判定矩阵.md` | current | 红黄灰绿判定规则 | PM / Eng / Medical reviewer |
| `docs/product/数据白名单.md` | current | P0 数据源范围 | Eng |
| `docs/product/信任与Claims边界.md` | current | 对外表达和合规边界 | PM / Compliance |
| `docs/product/品牌视觉规范.md` | current | 品牌视觉、UI 气质、插画和出图规则 | PM / Design |
| `docs/product/用户上下文.md` | current | P0 查询上下文字段和追问策略 | PM / Eng |
| `docs/product/宏观设计.md` | rewrite-needed | 早期页面级设计母型，需对齐 Agent v2 和 ToolLoopAgent shell | PM / Design |

## 3. 工程实施文档

| 文档 | 状态 | 用途 | Owner |
|---|---|---|---|
| `docs/engineering/specs/system-architecture.md` | current | P0/P1/P2 总架构 | Eng / Architect |
| `docs/engineering/specs/data-flow.md` | current | Verify / Reminder / Feedback / Memory 数据流 | Eng |
| `docs/engineering/specs/agent-runtime-decision.md` | current | Vercel AI SDK ToolLoopAgent 选型 ADR | Eng / Architect |
| `docs/engineering/specs/api-contract.md` | current | implemented vs planned API | Eng |
| `docs/engineering/specs/test-matrix.md` | current | P0/P1/P2 测试矩阵 | Eng / QA |
| `docs/engineering/specs/implementation-map.md` | current | 文档目标到代码实现对照 | Eng |
| `docs/engineering/specs/medical-review-workflow.md` | current | 禁忌规则医学审核流程 | PM / Medical reviewer |
| `docs/engineering/specs/data-source-status.md` | current | 数据源状态表 | Eng |
| `docs/engineering/specs/compliance-audit-status.md` | current | 合规审计状态表 | Eng / Compliance |
| `docs/engineering/specs/launch-checklist.md` | current | 上线 checklist | Eng |
| `docs/engineering/specs/query-intake.md` | current | L0 意图识别和追问 | Eng |
| `docs/engineering/specs/safety-judgment.md` | current | L2 判定引擎 | Eng |
| `docs/engineering/specs/safety-translation.md` | current | L3 翻译和兜底 | Eng |
| `docs/engineering/specs/compliance.md` | current | 合规 middleware 和红线 | Eng / Compliance |
| `docs/engineering/specs/archive-recheck.md` | current | 保存和复查设计 | Eng |
| `docs/engineering/specs/metrics-instrumentation.md` | current | P0/P1/P2 分层指标和埋点契约 | PM / Eng |
| `docs/engineering/plans/p0-plan.md` | current | 12 天 P0 实施计划 | Eng |
| `docs/engineering/plans/data-ingest.md` | current | 数据接入和烘焙计划 | Eng |
| `docs/engineering/plans/data-sources.md` | current | 数据源盘点 | Eng |
| `docs/engineering/plans/data-baking-gpt.md` | current | P0 规则和数据烘焙参考方案 | Eng |

## 4. Research 和参考材料

| 文档 | 状态 | 用途 | Owner |
|---|---|---|---|
| `docs/research/竞品参考素材.md` | current | 竞品截图素材入口 | PM / Design |
| `docs/research/场景空白分析-竞品矩阵.md` | current | 竞品场景差异判断 | PM |
| `docs/research/竞品调研报告.md` | reference | 竞品背景材料 | PM |
| `docs/research/禁忌规则-v0-种子库-待医学审核-2026-04-23.md` | reference | 医学审核输入材料 | PM / Reviewer |

## 5. 已归档噪音

| 路径 | 状态 | 说明 |
|---|---|---|
| `docs/_archive/duplicates-2026-04-24/` | archived | 合并后重复副本 |
| `docs/_archive/superseded/strategy/` | archived | 早期泛健康/黑客松策略稿 |
| `docs/_archive/superseded/product/` | archived | 早期定位稿 |
| `docs/_archive/superseded/product-agent-v2-2026-04-24/` | archived | 旧 Golden Path 和旧 Reminder 北极星 draft，已被当前文档吸收 |
| `docs/_archive/_bmad/` | archived | BMAD 工具残留 |
| `docs/_archive/_bmad-output/` | archived | BMAD 工具输出残留 |

## 6. 当前剩余缺口

| 文档 | 状态 | 为什么需要 | 建议位置 |
|---|---|---|---|
| Reminder 属性查表 | missing | P1 需要水溶/脂溶/时段/随餐规则 | `docs/engineering/specs/reminder-attribute-table.md` |
| Feedback Ritual 文案库 | missing | P1 需要低摩擦反馈和严重关键词 | `docs/engineering/specs/feedback-ritual.md` |
| Memory schema 细化 | missing | P2 需要字段、召回和隐私模式 | `docs/engineering/specs/memory-schema.md` |
| Hermit Agent 任务设计 | missing | P2 需要周期、输出、用户纠错 | `docs/engineering/specs/hermit-agent.md` |

## 7. 维护规则

- planned 能力不得写成 implemented。
- 文档和代码冲突统一进入 `implementation-map.md`。
- 新的产品判断先更新 `docs/product/当前判断.md`。
- 新的工程接口或 schema 变更必须同步 `api-contract.md`。
- 新的验收标准必须同步 `test-matrix.md`。
