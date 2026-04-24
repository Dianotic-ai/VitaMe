---
title: "Main CC Lessons"
description: "主 Claude Code 在 VitaMe 项目中的自查教训和常见失误记录。"
doc_type: "lessons"
status: "active"
created: "2026-04-22"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["lessons", "engineering", "agent"]
---

# 主 CC — VitaMe 自查教训

> 跟 `_vitame-wave2/CODEX-LESSONS.md` / `GEMINI-LESSONS.md` 对齐的体系，**给主 CC 自己用**。
> 每条都来自真实任务（Wave 1 / Wave 2 / Phase 0 scaffold），不是预防性废话。
> 主 CC 启动新会话时不必读，**遇到对应症状或踩到同款坑时再来查 + append**。

---

## 1. Scaffold 阶段就该补的 boilerplate，别拖到外包发现

**踩坑实例**（W2-E 验收，2026-04-22 D5）：
- 第 2 个 Claude 浏览器手验 5 个新页面时，console 报 `favicon.ico 404`
- 写进了 NOTES.md §5 已知小 issue 列表
- 实际是 Phase 0 scaffold 阶段（D1-D2 建项目时）就该补的 — Next.js App Router 的标配
- 拖到 D5 才发现 = 5 天里所有人本地 dev / 浏览器调试都看到这个 404

**为什么**：boilerplate 类东西（favicon / robots.txt / manifest / `.gitignore` 完整性）每个 Next 项目都有，外包 brief 不会写这种「显然该有」的东西，外包也不会主动补（白名单约束）。**主 CC 是这些东西的唯一负责人**。

**下次怎么做**：
- 每次 scaffold 新项目 / 新模块时，主 CC 自己跑一次 `npm run dev` + 打开浏览器，看 console 是否干净（404 / warn / hydration mismatch 都要清掉）
- Phase 0 收尾时过一遍 Next.js boilerplate checklist：
  - `src/app/icon.svg` 或 `favicon.ico`（Next 自动 inject）
  - `src/app/robots.txt`（如果不要被爬就 disallow all；P0 阶段建议 disallow）
  - `src/app/manifest.json`（PWA / WeChat 添加到主屏，可选）
  - 根 `.gitignore` 完整性（`.next/` / `node_modules/` / `.env.local` / IDE / OS）
- 外包 brief 出问题时反思：是不是有 boilerplate 缺失让外包必须绕道？如果是 → 主 CC 先补再发 brief

**对应 fix**（D5）：在 `src/app/icon.svg` 写一个极简 V 字 SVG（vita-brown 背景 + 白 V），Next 14 App Router 自动 inject 到 `<link rel="icon">`。

---

## 2. 验收前**必须复跑一次外包的自检命令**，不能信报告

**踩坑教训累积**（Wave 1 + Wave 2）：
- W2-E 报告说"配色 grep 无违规" — 主 CC 复跑 grep 验证后才标 ✅（事实诚实，但流程不能省）
- W2-A 报告"全绿" — 主 CC 跑 typecheck + test 才发现 `judgmentEngine.spec.ts` 2 处副作用要清理（不是 Codex 的错，但需要主 CC 工作）
- W2-C 报告"完成" — 主 CC 跑 bake 才发现 raw json 带 BOM，跑 bake 才发现数据是占位

**为什么**：外包报告反映的是「我以为的状态」，主 CC 验收要确认「实际状态」。差异不一定是外包诚信问题，可能是：
- 外包跑的环境跟主仓不一致（sandbox 没 package.json / tsconfig）
- 外包的「自检」覆盖不了跨文件副作用
- 外包眼里的「完成」跟主 CC 眼里的「合仓可用」边界不同

**下次怎么做**：
- 验收 checklist 雷打不动：
  1. 静态审 output（NOTES.md + 关键文件抽样）
  2. 拷文件到主仓
  3. 跑外包说"通过"的所有命令（typecheck / test / build / bake / 浏览器）
  4. **再跑一次外包没说但应该跑的命令**（如外包说"typecheck pass"，主 CC 还要跑 test:unit 看有没有副作用）
  5. 配色 / 命名 / 红线之类的自检 grep 复跑（信任但验证）
- 任何一步出问题 → 不直接改外包代码 / 不静默修，**先记录是 sandbox vs 主仓的差异、还是外包的 bug、还是 brief 写漏**，再决定动谁

---

## 3. 任务边界写不全 → 副作用清理是主 CC 的活，不是 bug

**踩坑实例**（W2-A 验收，D4 晚）：
- W2-A brief 明文禁止改 `judgmentEngine.spec.ts`
- Codex 严守了，没改
- 但 suppai 从空桩激活后，`judgmentEngine.spec.ts` 里 2 个测试因为 `partialData=true` 假设被打破而失败
- 这不是 Codex 的 bug — 是 brief 没说"激活后老测试要更新"（也很难提前预知）
- 主 CC 拷回主仓后自己用 `vi.spyOn` 重写了测试，保留 §11.12 红线契约

**为什么**：「跨文件契约变动」是主 CC 的全局责任。外包按 brief 白名单干活是对的，副作用清理 = 主 CC 的工作不是 brief 漏写。

**下次怎么做**：
- 验收外包代码后，**一定要跑全套测试**，不只是新增的那部分
- 测试失败时先判断：是外包 bug、还是激活带来的连带影响、还是 brief 没覆盖的边界
- 如果是连带影响：主 CC 自己修，**修的时候保护原契约**（不要为了让测试过而把红线测试删掉 / 弱化）
- 改完在 task-delegation-log 的「结果」段记一笔「副作用清理（不在外包工单范围）」，不让外包背锅

---

## 维护

**每次踩到主 CC 自己的同款新坑** → append 一条到本文件。append-only，不删历史教训。
