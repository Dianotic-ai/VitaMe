---
title: "Agent 北极星"
description: "VitaMe 长期 Agent 北极星：Reminder、Feedback、Memory、Hermit Agent 和自我进化闭环。"
doc_type: "north-star"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["product", "agent", "north-star", "memory", "reminder", "hermit"]
source_docs:
  - "docs/decisions/VitaMe-Agent-SOP-v2-对话快照-2026-04-23.md"
  - "docs/engineering/specs/agent-runtime-decision.md"
---

# VitaMe — Agent 北极星

## 1. North Star

**通过长期反馈让 Agent 越来越懂你。**

补剂安全判断是入口，Reminder 是触发器，Feedback 是数据来源，Memory 是上下文，Hermit Agent 是自我进化机制。

## 2. Core Loop

```
加入一款补剂
  → 属性识别
  → 设置提醒
  → 服用后轻反馈
  → Memory 沉淀
  → Hermit 周期归纳
  → 用户确认观察
  → 调整提醒或复查
```

## 3. Reminder

Reminder 不只是通知。它承担两个任务：

- 帮用户减少忘记服用。
- 在合适时机触发轻反馈。

默认规则：

- 默认低频。
- 用户可暂停、跳过、降频。
- 连续无响应自动降频。
- 高风险补剂或未审核规则不生成“放心服用”暗示。

## 4. Feedback Ritual

每次只问一个问题：

- 吃了吗？
- 有什么感觉？
- 是否跳过？
- 要调整时间吗？

全部可跳过。严重异常关键词必须硬编码拦截，输出“建议咨询医生或药师”，不让 LLM 做病因推断。

## 5. Memory

Memory 是 agent-readable context，不是传统表单档案。

基本结构：

```ts
type MemoryEvent = {
  eventId: string;
  occurredAt: string;
  eventType: "verify" | "reminder" | "feedback" | "observation" | "correction";
  entityRefs: string[];
  userText?: string;
  tags: string[];
  privacyMode: "local" | "pseudonymous" | "cloud_memory";
};
```

## 6. Hermit Agent

Hermit Agent 是周期性归纳器：

- 发现反馈模式。
- 提醒用户复查。
- 建议调整提醒。
- 请求补充一个关键字段。

它不能：

- 诊断疾病。
- 做因果医学归因。
- 自动改变用户方案。
- 替代医生或药师。

## 7. Self-evolution

VitaMe 的自我进化只允许发生在用户可见、可确认、可撤销的范围内。

允许：

- “我观察到你最近 3 次晚间服用后都反馈胃不舒服，是否要把提醒改到饭后？”

不允许：

- “你的胃不舒服是 B 族导致的，所以你应该停止。”

## 8. Privacy

长期 Agent 必须提供：

- 模式徽章：Local / Pseudonymous / Cloud Memory。
- “LLM 看到什么”视图。
- 字段级上行开关。
- 一键清档。
- Memory 删除和导出。

## 9. Relationship to P0

P0 不实现完整 Agent 北极星，只预埋保存和复查。P1 才开始 Reminder + Feedback，P2 才开始 Memory + Hermit。
