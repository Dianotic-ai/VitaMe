---
title: "Branch Policy: docs/canonical"
description: "VitaMe 文档源真实分支约定。所有 docs 改动只在 docs/canonical；代码分支只读、不写。"
doc_type: "branch-policy"
status: "active"
created: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["meta", "branch-policy", "governance"]
---

# `docs/canonical` — Source of Truth for VitaMe Documentation

## 决策

- 所有产品/工程文档（PRD、spec、产品原则、视觉规范、对话契约、决策记录、研究、归档）的演进**只在 `docs/canonical` 分支**进行。
- 代码分支（`main`、`v0.4-northstar-loop`、`codex/*`、`vitame-dev-*` 等）**只读** docs，不写入。
- 历史版本通过 git history 在 `docs/canonical` 上追溯。

## 为什么这么做

代码分支节奏（feature / release / hotfix）≠ 文档节奏（PM 思考、规范演进、阶段性反思）。把 docs 跟代码分支耦合会导致：

- **cherry-pick 地狱**：同一份 spec 要跨 3+ 分支同步，演化越久越乱。
- **冻结期 PM 失语**：WAIC 期 `main` 不动 → docs 也跟着冻结，重要 PM 决策无处落档。
- **跨分支不一致**：v0.3 上的 brand spec、v0.4 上的旧版 brand spec、main 上的最新版三份并存，agent 跨分支读会读到不同事实。
- **代码漂移污染 docs 视角**：v0.4 D13 fix 修代码顺手改 docs 引用，docs 跟着代码语义飘走，最终 docs 失去权威性。

独立 docs 分支让 docs 有自己的 release cycle；代码分支通过 GitHub stable URL 引用，永远读到最新 canonical 版本。

## 分支结构

```
docs/canonical                ← 唯一允许写 docs 的分支
  └── docs/                   ← 所有产品/工程文档
  └── BRANCH-POLICY.md        ← 本文件
  └── （按需）codex/* docs/<topic>-* 工作分支 → PR 回 docs/canonical

main                          ← 当前 = v0.3 RAG chatbot，WAIC 4/30 demo 生产分支（code-only）
v0.4-northstar-loop           ← 北极星 loop 实现分支（code-only，partner 验证）
vitame-dev-*                  ← 历史代码分支（code-only）
codex/*                       ← 临时工作分支
```

## 工作流

### 改 docs

1. 从 `docs/canonical` 创建工作分支：
   ```sh
   git checkout docs/canonical
   git pull --ff-only
   git checkout -b codex/docs-<topic>-<YYYYMMDD>
   ```
2. 编辑 `docs/` 下的文件。
3. 开 PR → base = `docs/canonical`。
4. **不向 `main` / `v0.x` 同步。** 如有跨分支需要的 README/CLAUDE.md 见"例外"。

### 看 docs（在代码分支上工作时）

- **GitHub URL（推荐）**：永远引用 `docs/canonical` 上的 stable 路径，例如：
  ```
  https://github.com/Dianotic-ai/VitaMe/blob/docs/canonical/docs/product/品牌视觉规范.md
  ```
- **本地命令行**：
  ```sh
  git fetch origin docs/canonical
  git show origin/docs/canonical:docs/product/品牌视觉规范.md
  ```
- **本地 worktree**：保留一个 `docs/canonical` 的 worktree，方便随时跳过去查文档。

### Agent / coding agent 读 docs

CLAUDE.md / AGENTS.md 在代码分支上保留薄壳，但产品级 spec 引用 `docs/canonical` URL。Agent 在代码分支上**禁止编辑** `docs/` 路径。

## 例外（哪些文件可以同时存在于代码分支和 docs/canonical）

仅限以下两类，因为它们必须就地存在才能被分支自身使用：

- **`README.md`**：每条分支可有自己的 README，描述该分支用途、demo URL、当前主题。
- **`CLAUDE.md` / `AGENTS.md`**：每条分支可有自己的 agent context，但其中产品级规范应以 URL 形式指向 `docs/canonical`。

其他所有 `docs/` 路径下的文件**只在 `docs/canonical` 上修改**。

## 历史 docs 的迁移

`docs/canonical` 起点 = `main` HEAD `fd1944d`（"docs: tighten action-first MVP decisions"，2026-04-27）。

- 此前散落在 `main` 上的所有 docs 自动随 `fd1944d` 进入 canonical 起点。
- v0.4-northstar-loop 上独有的 docs（`v0.4-northstar-loop-plan.md`、`v0.3-vs-北极星-alignment.md`、`v0.4-handoff-2026-04-26.md`）尚未进入 canonical；按需在 docs/canonical 上 cherry-pick 或重写。
- 旧版 docs 在代码分支上保持不动，被视为 historical snapshot；任何更新都必须在 docs/canonical 上做。

## 常见疑问

**Q: 这跟把 docs 拆成独立 repo 有什么区别？**
A: 独立 repo 的代价是失去与代码 commit 的 traceability（引用代码行号、PR 互链）。同 repo 不同分支保留这层，但用 branch 边界代替目录边界做隔离。

**Q: 代码分支的 PR 能不能"顺手"修文档？**
A: 不能。即使是 typo，也开一个 docs PR。这条不严格执行的话，policy 会快速失效。

**Q: 如果 v0.4 上某个 spec 在 canonical 还没有，开发要被卡住吗？**
A: 不会。v0.4 的 spec 文件如果暂未在 canonical，先在代码分支上保留旧版（read-only 心态），然后 ASAP 在 docs/canonical 开 PR 同步过去，并在 commit message 注明 "sync from v0.4"。

## 政策生效

提交此文件即生效。撤销或修改本政策需要在 `docs/canonical` 上 PR 显式说明。
