---
title: "VitaMe Aha Moment"
description: "VitaMe P0/P1/P2 的 Aha moment、激活定义、关键断点和指标。"
doc_type: "activation-spec"
status: "active"
created: "2026-04-17"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["product", "activation", "aha", "agent"]
---

# VitaMe — Aha Moment

## 1. P0 Aha：安全判断被看懂

用户第一次意识到：

**同样叫补剂，成分形式、病史和当前用药会让“能不能吃”发生变化，而且 VitaMe 能把原因讲清楚。**

强激活 = 完成查询 + 看懂原因 + 做出动作 + 保存结果。

## 2. P1 Aha：保存变成反馈闭环

用户第一次发现：

**保存不是把结果丢进档案，而是让 Agent 帮我安排提醒，并用很轻的反馈记住真实情况。**

强激活 = 保存结果 + 确认提醒 + 完成第一次提醒后反馈。

## 3. P2 Aha：Agent 真的在变懂我

用户第一次看到：

**Agent 基于我的反馈说出了一个我认可的模式，而且我可以确认、否定或删除。**

强激活 = 查看 Hermit 观察 + 确认准确或给出纠错反馈。

## 4. Activation Flow

```
Verify → Result understood → Save → Reminder confirmed → Feedback logged → Memory recalled → Hermit observation confirmed
```

## 5. Key Breakpoints

| Breakpoint | Failure | Fix |
|---|---|---|
| 首页 | 看不出和内容/ChatGPT 的差异 | 强化“买前先查” |
| 追问 | 像问诊表 | 最多 2 轮，只问影响判断的字段 |
| 结果 | 只有颜色 | 颜色后必须跟一句“为什么和你有关” |
| 保存 | 像后台管理 | 明确“下次少问什么” |
| 提醒 | 像打卡 KPI | 用户可暂停、跳过、降频 |
| Hermit | 像诊断 | 只写观察，不写因果医学结论 |

## 6. Metrics

| Metric | Definition | Phase |
|---|---|---|
| Qualified Safety Decision | 完成一次有效查询并看到可解释结果 | P0 |
| Strong Activation Rate | 查询 + 理解 + 保存 | P0 |
| Reminder Opt-in Rate | 保存后确认提醒的比例 | P1 |
| Feedback Response Rate | 提醒后有有效反馈的比例 | P1 |
| Confirmed Observation Rate | Hermit 观察被用户确认的比例 | P2 |

## 7. One-line Conclusion

VitaMe 的 Aha 不是“AI 回答了”，而是“系统越来越能把我的健康决策变成可解释、可复查、可学习的闭环”。
