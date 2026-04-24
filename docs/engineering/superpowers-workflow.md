---
title: "Superpowers Workflow"
description: "VitaMe 使用 Superpowers 技能时的标准工作流和项目内优先级。"
doc_type: "workflow"
status: "active"
created: "2026-04-21"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["superpowers", "workflow", "engineering"]
---

# Superpowers — 标准工作流

> 从 `CLAUDE.md` §8.4 拆出。CC 启动时不必读，**接到非 trivial 任务、要拆 plan 时**来查。
>
> 上下文：本项目用 [obra/superpowers](https://github.com/obra/superpowers) 精简装 4 个 skill — `writing-plans` / `subagent-driven-development` / `test-driven-development` / `requesting-code-review`。

## 标准工作流（非 trivial 任务）

```
user task
  └→ writing-plans         (produce a bite-sized plan,
                            reference CLAUDE.md §13 for which tasks need TDD)
      └→ subagent-driven-development   (execute plan, one subagent per task)
          └→ test-driven-development   (RED-GREEN-REFACTOR on §13-required code)
              └→ requesting-code-review (against the plan)
                  └→ npm run test:seed (MANDATORY before merge, §14)
                      └→ Sunny approves merge
```

Trivial 任务（typo fix、dependency bump、env.example tweak）可以跳过 `writing-plans` 和 `subagent-driven-development` —— 但 seed test 还是要在 merge 前跑。

## 与 CLAUDE.md 冲突时的优先级

`CLAUDE.md` 和 `DESIGN.md` 始终覆盖 Superpowers 默认行为。具体：

- `test-driven-development` 说"每行都测"，但 §13 说"bake 脚本免 TDD" → **听 §13**
- `writing-plans` 出的 plan 违反 §11 红线 → **弃 plan，flag 冲突给用户**
- `requesting-code-review` 通过的代码挂在 `npm run test:seed` → **以 seed test 为准，回滚**
