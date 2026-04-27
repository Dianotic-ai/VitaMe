---
title: "VitaMe Docs"
description: "VitaMe v0.4 文档系统入口、目录说明和维护规则。"
doc_type: "index"
status: "active"
created: "2026-04-17"
updated: "2026-04-27"
canonical: true
---

# VitaMe Docs

`docs/` 是 VitaMe v0.4 的人类可读事实源。2026-04-27 大清理之后，仅保留当前有效文档；v0.2/v0.3 历史归档到 `archive/full-pre-cleanup-2026-04-27` 分支。

## 先读什么

1. [`START-HERE.md`](./START-HERE.md) — 10 分钟理解当前是什么、读哪些文档
2. [`v0.4-engineering-spec/README.md`](./v0.4-engineering-spec/README.md) — 9 篇工程规格索引（PRD / UX / 设计 / 架构 / API / 数据 / 合规 / 已知问题）
3. [`product/Agent-北极星.md`](./product/Agent-北极星.md) — 长期愿景
4. [`v0.4-vs-action-first-divergence.md`](./v0.4-vs-action-first-divergence.md) — main 上"代码 vs Kevin action-first 文档"已知矛盾
5. [`action-first-mvp/README.md`](./action-first-mvp/README.md) — Kevin 的下一版方向锁

## 目录

| 子目录 / 文件 | 用途 |
|---|---|
| [`v0.4-engineering-spec/`](./v0.4-engineering-spec/) | **核心** — 9 篇当前实现的工程规格（reverse-engineered from main）|
| [`action-first-mvp/`](./action-first-mvp/) | Kevin 提的下一版产品方向锁 + AI coding harness |
| [`product/`](./product/) | 5 篇当前产品文档：Agent-北极星 / 品牌视觉规范 / 风险判定矩阵 / 信任与Claims边界 / Aha-Moment |
| [`engineering/specs/`](./engineering/specs/) | 仅留 `v0.4-northstar-loop-plan.md`（v0.4 启动时的对齐稿）|
| [`assets/`](./assets/) | 视觉资产（hero / signature / 装饰带参考图）|
| `v0.4-handoff-2026-04-26.md` | partner 验证清单（仍有效）|
| `v0.4-vs-action-first-divergence.md` | 8 条已知矛盾 + 5 月之后 3 条解决路径 |
| `glossary.md` `known-blockers.md` `naming-conventions.md` `compression-rules.md` | 通用工程参考 |

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
---
```

## 维护规则

- 代码改了 → 同步更新 `v0.4-engineering-spec/` 对应章节（PR 配套）
- 新增文档前先看 `v0.4-engineering-spec/` 是否已覆盖，避免重复
- 不要在主路径文档里把 planned 能力写成 implemented
- 旧文档（v0.2/v0.3 era）需要恢复时：`git show archive/full-pre-cleanup-2026-04-27:docs/<旧路径>`

## 历史归档

2026-04-27 大清理移除（全部仍在 `archive/full-pre-cleanup-2026-04-27` 分支可访问）：

- `_archive/` 老 BMAD 产物 + duplicates + superseded（3.4M）
- `research/` 调研报告（1.5M）
- `decisions/` 历史决策记录
- `context/` 旧背景信息
- `product/` 16 篇 v0.2/v0.3 era 产品文档（PRD / 路线图 / 用户旅程 等）
- `engineering/specs/` 18 篇 v0.2 era 工程 specs（system-architecture / api-contract 等）
- `engineering/plans/` 4 篇 P0 老计划
- `SESSION-STATE.md` `DOCS-COVERAGE.md` `MAIN-CC-LESSONS.md` `CLAUDE.md-changelog.md` `session-state-history.md` `2026-04-21-kevin-review-handoff.md` `v0.3-handoff-2026-04-26.md`

理由：这些文档全部 `updated: 2026-04-24` 之前 = v0.3 RAG chatbot pivot **之前**的视角，跟 v0.4 实际代码不一致，留在 main 会引起接手混淆。
