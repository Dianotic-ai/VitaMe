---
title: "Action-First MVP 文档包"
description: "VitaMe 从档案优先矫正为行动优先 MVP 的产品事实源和 AI coding harness 入口。"
doc_type: "index"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "mvp", "product-spec", "coding-harness"]
---

# Action-First MVP 文档包

本目录是 VitaMe 当前 MVP 的开发事实源。它的目的不是多写文档，而是约束 Sunny 或任何 AI coding agent：只能按这里定义的产品边界、用户旅程、状态机、UI 和数据流开发，不能随意把产品改回“健康档案 / 功能菜单 / 长期记忆平台”。

## 一句话方向

VitaMe P0 不是让新用户先建档案，也不是做多人健康档案。用户先说症状、需求或粘贴商品页 URL；Agent 把补剂方向、官网规格、剂量时间、禁忌、提醒和反馈整理成可执行行动。

## 阅读顺序

1. [00 产品原则与范围](./00-product-principles.md)
2. [01 PRD 与验收口径](./01-prd.md)
3. [02 用户旅程与 UI 设计](./02-user-journey-and-ui.md)
4. [03 功能设计](./03-functional-spec.md)
5. [04 概要设计与数据流](./04-system-data-flow.md)
6. [05 AI Coding Agent Harness](./05-ai-coding-agent-harness.md)
7. [06 回答与 Prompt 契约](./06-answer-and-prompt-contract.md)
8. [07 验收测试矩阵](./07-acceptance-test-matrix.md)

## 当前 MVP 状态机

```text
P0 clean chat-only
  - 不要求注册
  - 不要求建档
  - 不提供多人档案
  - 不展示 PersonSwitcher
  - /api/chat 不带 profile
  - /api/chat 不带 safetyMemory
  - 不调用 /api/extract
  - 用户可直接描述症状或粘贴商品 URL

用户显式点击“保存到我的提醒”
  ↓
P1 local action materialized
  - 显示早 / 中 / 晚 / 睡前
  - 写入 routine
  - 写入用户显式确认的 action memory event
  - 可记录 3 天后效果
```

## 产品锁点

- MVP 不做多人档案。测试可以覆盖“我妈/家人”这类说法，但不能物化为核心产品功能。
- 首访不能出现“先建档案”入口。
- 主路径不能展示 PersonSwitcher。
- P0 不能形成 profile，也不能把 profile 注入 LLM。
- 不允许每轮对话后调用 LLM 抽取健康档案。
- 长期上下文只能来自用户显式动作产生的 action memory event。
- 高危 pre-check 默认只在本轮使用，不自动写长期 memory。
- 商品输入 P0 以 URL 为核心；拍照/OCR 不进入首版核心范围。
- 商品 URL 必须有实际抓取尝试，不能只提示用户手动粘贴。
- Agent 回答必须服务于购买和服用行动，不是泛泛健康问答。
- 新功能必须先在 harness 文档里登记目标、验收和回滚方式，再进入代码。

## 最低完成标准

- 首访没有 profile/person/routine 数据。
- 输入症状能得到六段式行动建议。
- 粘贴官网 URL 能触发商品解析。
- 高危词命中时不调用 LLM，直接硬路由。
- 只有用户点击“保存到我的提醒”后，早 / 中 / 晚 / 睡前才物化。
- Network 面板看不到 `/api/extract`。
