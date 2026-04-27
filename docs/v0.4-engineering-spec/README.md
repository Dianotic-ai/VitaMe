---
title: "v0.4 实现工程规格 — 文档总览"
description: "把当前 main (v0.4-northstar-loop merged) 的实际代码反向整理成 PRD / UX / 设计 / 架构 / API / 数据 / 合规 / 已知问题 8 篇文档。给下一版本迭代当事实源用。"
doc_type: "engineering-spec-index"
status: "active"
created: "2026-04-27"
canonical: true
audience: "下一阶段 dev / partner / Kevin / 接手 AI agent"
---

# VitaMe v0.4 工程规格（reverse-engineered from main）

## 这套文档是什么

**不是**新功能 spec，**是**把已经在 vitame.live 上跑的 v0.4 northstar loop 实现反向写成可读文档。下一版本迭代任何代码改动前**先读这里**，避免按过时假设拍脑袋改。

跟 `docs/action-first-mvp/`（Kevin 提的下一版方向锁）、`docs/product/Agent-北极星.md`（长期愿景）的关系：

| 文档 | 时态 | 谁说了算 |
|---|---|---|
| `docs/action-first-mvp/` | 未来（下一版重写方向）| Kevin / partner 的产品决策 |
| **本目录** | **现在**（v0.4 真在跑的样子）| **代码本身 + 本文档** |
| `docs/product/Agent-北极星.md` | 长期愿景 | 不变的产品哲学 |
| `CLAUDE.md` v3.0 | 工程基线 | 工程规则 + 8 红线 |

矛盾时：行为以代码为准；约束以 CLAUDE.md 为准；下一版方向以 action-first 为准。

跟 `docs/v0.4-vs-action-first-divergence.md` 互补 — 那份说"代码 vs Kevin 文档的矛盾"；这份说"代码到底是什么样"。

---

## 阅读顺序

1. [`01-prd.md`](./01-prd.md) — PRD：产品定位 / 目标用户 / 核心场景 / scope in & out
2. [`02-user-journey.md`](./02-user-journey.md) — 6 条主用户流程图（首访 / 安全检查 / 选品 / 设提醒 / 反馈 / 切人 / Hermit 归纳）
3. [`03-design-system.md`](./03-design-system.md) — 视觉契约（色 / 字 / 组件契约 / Pill Box × Seed signature）
4. [`04-architecture.md`](./04-architecture.md) — Next 16 + Edge + zustand 5 + AI SDK 6 系统图、关键时序
5. [`05-api-spec.md`](./05-api-spec.md) — `/api/chat` `/api/extract` `/api/hermit` 请求响应 schema + tool-use 协议
6. [`06-data-model.md`](./06-data-model.md) — 4 个 zustand store（profile / memory / reminder / conversation）schema + LocalStorage key + 迁移历史
7. [`07-compliance.md`](./07-compliance.md) — 8 红线落地映射 + audit 边界 + 禁词链 + critical 硬编码
8. [`08-known-issues.md`](./08-known-issues.md) — 已知 divergence + 未做的 P3 / 性能与拓展点 + Codex review 修复回顾

---

## 关键事实速查

- **Branch**: `main` (已 merge `v0.4-northstar-loop`，最新 commit ~`71aa747`)
- **Live**: https://vitame.live — Vercel 自动部署 `main`
- **Tech stack**: Next.js 16.2.4 / React 18.3 / TypeScript 6 / Tailwind 3.4 / AI SDK 6 / zustand 5 / minimax 国际版（Anthropic 协议）
- **Persistence**: 4 个 zustand persist 全部仅 LocalStorage（北极星 §9.8）— 不上服务器
- **Audit**: Upstash Redis REST（仅 hash + sourceId，不存明文）
- **核心交互**: `/chat` 主对话 + 4 个 tab（`/profile` / `/memory` / `/reminders`）+ chat header PillBox strip 顶部
- **8 合规红线**: 全部活的（CLAUDE.md §9 + 本目录 `07-compliance.md`）

---

## 维护方式

代码改了 → 这套文档要改对应章节。可以：

a. **每次 PR 同步改**（推荐）— 改完代码立刻补本目录对应小节
b. **里程碑批量重写**（v0.5 / WAIC 后等节点）— 按周期重新审视一次

不接受："文档过时但代码已变"长期不修。看到不一致请：
1. 写 PR 同步改文档
2. 或加 `⚠️ DRIFTED` 标记 + Issue 链接，注明哪段已脱离实际

---

**Last updated**: 2026-04-27 by Sunny + Claude Opus 4.7
