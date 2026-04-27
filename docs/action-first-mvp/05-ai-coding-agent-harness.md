---
title: "Action-First MVP AI Coding Agent Harness"
description: "给 Sunny 和 AI coding agent 的强约束开发流程、锁点、验收门禁和变更协议。"
doc_type: "coding-harness"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "harness", "ai-coding-agent"]
---

# AI Coding Agent Harness

本文件是开发约束，不是建议。任何 coding agent 在改 VitaMe Action-First MVP 前必须遵守。

## 1. 启动指令

给 AI coding agent 的首条 prompt 应包含：

```text
你正在开发 VitaMe Action-First MVP。
先阅读 docs/action-first-mvp/README.md，并按其中顺序阅读全部文档。
实现时必须保持 P0 clean chat-only 状态机，不得把产品改回 profile-first。
MVP 不做多人档案；测试可以覆盖家人说法，但不能创建家人档案功能。
每次代码改动前，先说明对应哪个文档章节和验收项。
如果你认为需要改变用户旅程、状态机、UI 主路径或数据模型，必须先输出 Product Change Proposal，不得直接改代码。
```

## 2. 允许改动的目标

当前阶段只允许围绕这些目标改代码：

- 拆掉 P0 profile 注入。
- 下线每轮 `/api/extract`。
- 实现 deterministic safety pre-check。
- 实现 Product Inspect URL/text 解析。
- 实现 RoutineConfirmCard 和 RoutineSummaryStrip。
- 实现 LocalStorage routine。
- 实现 actionMemory event store。
- 调整首屏 seed 和输入文案。
- 调整 system prompt 到 Action-First 六段式。
- 增加验收测试。

## 3. 禁止直接改动

未经 Kevin 明确确认，禁止：

- 把 PersonSwitcher 放回 chat header。
- 在首屏放“建档案 / 档案管理 / 家人档案”主 CTA。
- 把“多人档案”作为 MVP 产品功能。
- 每轮对话后调用 LLM 抽取 profile。
- 把 action memory 做成 profile 的替代壳。
- 自动记录 conditions、ageRange、sex、conversationSummary。
- 把 Memory、Hermit、FeedbackPrompt 自动弹窗放进 P0 主路径。
- 新增购物车批量解析、价格比较、渠道推荐。
- 新增拍照/OCR 作为 P0 核心路径。
- 改变 P0→P1 唯一通道。
- 改免责声明和医疗边界。

## 4. Product Change Proposal 协议

如果 coding agent 认为需要改产品逻辑，必须先写：

```md
## Product Change Proposal

### Proposed change

### Why current spec is insufficient

### Affected docs

### Affected state machine

### User journey before / after

### Data privacy impact

### Acceptance tests to add or update

### Rollback plan
```

Kevin 确认前不得实现。

## 5. 开发阶段

### Phase A: Strip profile from P0

目标：

- `/api/chat` 不再接受 `profile`。
- P0 不注入 `<user_profile>`。
- 前端不发送 `personToSnapshot(activePerson)`。
- 删除或停用 `/api/extract`。

验收：

- Network 不出现 `/api/extract`。
- P0 `/api/chat` body 无 `profile`、`userMentioned`、`safetyMemory`。

### Phase B: Safety pre-check

目标：

- 新增 `detectRedFlags`。
- 在 LLM 前硬拦截。
- 命中时返回静态响应。

验收：

- “我在吃华法林想吃鱼油”不调用 LLM。
- “我妈在吃华法林想吃鱼油”不创建妈妈档案。

### Phase C: Product Inspect

目标：

- `/api/product/inspect`。
- crawler/parser。
- URL paste inline trigger。
- text fallback。

验收：

- 静态 fixture 测试能抽成分、剂量、警示语、剂型。
- 403 页面显示抓取失败和文本 fallback。

### Phase D: Routine materialization

目标：

- `routineStore`。
- `RoutineConfirmCard`。
- `RoutineSummaryStrip`。
- `RoutineDrawer`。
- `actionMemory`.

验收：

- 保存前 LocalStorage routine 为空。
- 保存前 actionMemory 为空。
- 保存后顶部条出现。

### Phase E: Prompt and UX

目标：

- seed 改成症状主诉。
- prompt 六段式。
- 去除高指向 few-shot。
- NextActionChip 上下文化。

验收：

- 真实用户问题能得到行动答案，不是泛泛建议。

## 6. 每次提交前检查

必须运行：

```bash
npm run typecheck
npm run test:unit
```

如果实现涉及 UI：

```bash
npm run build
```

如果测试无法运行，提交说明必须写明原因。

## 7. Review Checklist

Reviewer 必须检查：

- 首屏是否仍是 clean chat-only。
- P0 是否仍不创建 profile。
- MVP 是否没有多人档案入口。
- P0 是否仍不带 `userMentioned` / `safetyMemory` / profile snapshot。
- 是否出现新的菜单式功能 dock。
- 商品 URL 是否有实际抓取尝试。
- Agent 是否能给出行动链。
- 是否新增未记录在文档里的核心路径。
- 是否破坏医疗安全边界。

## 8. Harness 输出格式

Coding agent 每次完成任务必须输出：

```md
## Implemented

## Files changed

## Spec sections satisfied

## Tests run

## Remaining gaps

## Manual verification steps
```

不允许只说“已完成”。
