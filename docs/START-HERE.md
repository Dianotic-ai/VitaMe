---
title: "Start Here"
description: "VitaMe v0.4 唯一入口：10 分钟理解当前是什么、读哪些文档、怎么开始改代码。"
doc_type: "index"
status: "active"
created: "2026-04-24"
updated: "2026-04-27"
canonical: true
---

# VitaMe — Start Here

> 第一份要读的文档。只描述 v0.4 实际跑出来的样子，不让历史叙事污染日常阅读。

## 1. VitaMe 当前是什么

**对话式保健品决策 Agent + 服用伴侣**：你的保健品顾问 + 服用伴侣 — 选对、吃对，越吃越懂你。

用户用自然语言聊 — 该补什么、买哪个、跟现有用药/疾病冲不冲突；从对话里建立提醒、记录反馈、积累跨设备一致的家人健康档案。

**Live**: https://vitame.live

## 2. 当前阶段

- **v0.4 northstar loop** 已 merge 到 main，vitame.live 跑的是这版
- WAIC 4/30 demo 用这版给评委 + partner 看
- 5 月之后 PM 决定走「按 action-first 重写」/「v0.4 是新方向」/「双轨」

## 3. 推荐阅读路径

1. [`docs/v0.4-engineering-spec/README.md`](./v0.4-engineering-spec/README.md) — 9 篇工程规格的索引（PRD / UX / 设计 / 架构 / API / 数据 / 合规 / 已知问题）
2. [`docs/v0.4-engineering-spec/01-prd.md`](./v0.4-engineering-spec/01-prd.md) — 产品定位 + 8 核心场景
3. [`docs/product/Agent-北极星.md`](./product/Agent-北极星.md) — 长期愿景
4. [`docs/v0.4-vs-action-first-divergence.md`](./v0.4-vs-action-first-divergence.md) — main 上"代码 vs Kevin action-first 文档"的已知矛盾
5. [`CLAUDE.md`](../CLAUDE.md) — v3.0 工程基线 + 8 红线
6. [`docs/known-blockers.md`](./known-blockers.md) — 部署 / fetch / SSL 等已知坑

## 4. 给 Claude / AI agent 的指令

任何代码改动前：
1. 读对应章节的 `v0.4-engineering-spec/` 文档
2. 看 `CLAUDE.md` §9（8 红线）+ §10（layer discipline）
3. 改 UI 视觉前看 `docs/product/品牌视觉规范.md` + `DESIGN.md`
4. 改产品边界前看 `docs/action-first-mvp/` + `v0.4-vs-action-first-divergence.md`

不要：
- 按过时假设拍脑袋改（v0.4-engineering-spec 是当前事实源）
- 删 v0.4 已实现功能而不跟 PM 确认（可能是 known divergence）
- 改 v0.2 老路径（CLAUDE.md §10 锁定）

## 5. 全部本地数据隐私

所有用户档案 / 提醒 / 对话 / Memory **仅存浏览器 LocalStorage**，永不上服务器。详见 `v0.4-engineering-spec/07-compliance.md` § 8 红线。

## 6. 历史 / 归档

v0.2 / v0.3 时代的产品文档、工程 specs、研究报告、决策记录全部移到 `archive/full-pre-cleanup-2026-04-27` 分支。需要时可：

```bash
git fetch origin archive/full-pre-cleanup-2026-04-27
git show archive/full-pre-cleanup-2026-04-27:docs/<旧文件>
```
