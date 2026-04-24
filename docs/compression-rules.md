---
title: "上下文压缩规则"
description: "VitaMe 会话压缩前后应保留和恢复的关键信息规则。"
doc_type: "runbook"
status: "active"
created: "2026-04-21"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["context", "compression", "runbook"]
---

# 上下文压缩规则 — 何时可压、何时不可压、压后如何恢复

> 从 `CLAUDE.md` §9.7 拆出。仅在「会话即将被自动压缩」或「压缩后第一时间恢复」时读。

## 1. 禁止的压缩行为

- 🚫 不要在跑 TDD 的 RED-GREEN 中途压缩（失败的测试 + 未写的实现一起丢，极其危险）
- 🚫 不要在 compliance middleware 调试中途压缩（6 层顺序一乱就违规）
- 🚫 不要在 bake 脚本输出未核对前压缩（体积/条数 console.log 是验证锚，丢了要重跑）
- 🚫 不要在用户刚给新指令 / 新约束后立刻压缩（新约束容易被视作"老上下文"砍掉）

如遇到自动压缩触发在上述时刻，先完成当前 atomic step 再让它压。

## 2. 压缩后恢复的检查项（新会话开头 checklist）

每次新会话启动（尤其是压缩后续）必须先做：

- 读 `docs/SESSION-STATE.md` 里 "最后更新" + "刚完成" + "下一步"（这是唯一跨会话锚点）
- 读 `CLAUDE.md` §0 → §7（路径索引） → 当前阶段对应的 design doc
- `git log --oneline -10` 对齐最近 commits
- `git status` 看有没有未提交的遗留
- 向用户确认锚点里的 next action 是否仍有效
