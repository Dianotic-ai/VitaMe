---
title: "VitaMe Master PRD"
description: "VitaMe 从 P0 补剂安全判断到 P2 Memory/Hermit Agent 的主产品需求文档。"
doc_type: "prd"
status: "active"
created: "2026-04-17"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["product", "prd", "agent", "p0", "p1", "p2"]
---

# VitaMe — Master PRD

## 1. Summary

VitaMe 是一个从补剂安全判断切入的自我进化健康 Agent。P0 打穿“输入 → 风险判断 → 人话解释 → 保存”，P1 用 Reminder + Feedback 建立持续反馈，P2 用 Memory + Hermit Agent 周期性发现模式。

## 2. Contacts

| Role | Owner | 责任 |
|---|---|---|
| PM | Sunny | 产品方向、范围、验收 |
| Engineering | Kevin / Agent | 架构、实现、测试 |
| Medical reviewer | TBD | 禁忌规则审核 |
| Compliance | PM + reviewer | Claims、免责声明、上线边界 |

## 3. Background

用户在补剂决策中遇到的是“信息不可操作”：他们看得到成分和营销话术，但无法判断这些内容和自己的病史、用药、年龄、孕期或真实反馈有什么关系。

大模型可以回答一次，但普通用户不知道怎么问，也不知道答案是否越界。VitaMe 的机会是把规则、证据、LLM 翻译、提醒、反馈和 Memory 封装成用户不用配置的路径。

## 4. Objectives

### Product Objective

让用户在关键健康决策前完成一次可信判断，并让每次判断沉淀为下一次更准、更轻的 Agent 上下文。

### Key Results

| 阶段 | KR |
|---|---|
| P0 | 首次查询完成率 >= 80%；强激活率可被测量；Go/No-Go 样例全部通过 |
| P1 | 提醒确认率 >= 50%；提醒后反馈率 >= 40%；跳过率可解释 |
| P2 | 单用户 30 天有效反馈 >= 20 条；Hermit 可生成至少 1 条可解释观察 |

## 5. Segments

| Segment | JTBD | 首发优先级 |
|---|---|---|
| 自己买补剂的人 | 买前判断是否适合自己 | P0 primary |
| 给父母买的人 | 降低替家人买错的风险 | P0 demo / P1 family |
| 长期多补剂用户 | 管理服用和反馈 | P1 primary |
| 高隐私敏感用户 | 想用 Agent，但不想无感上云 | P1/P2 trust |

## 6. Value Propositions

| 阶段 | Before | VitaMe | After |
|---|---|---|---|
| P0 | 看不懂、靠搜索、靠问 ChatGPT | 红黄灰绿 + 原因 + 证据 + 边界 | 知道该警惕什么 |
| P1 | 买了后靠记忆服用 | 提醒 + 轻反馈 | 形成真实服用记录 |
| P2 | 反馈散落、自己看不出模式 | Memory + Hermit 周期扫描 | Agent 能提出可确认观察 |

## 7. Requirements

### P0 — Safety Verify

- 用户可输入自然语言、产品名、成分名或药物名。
- 系统通过 L0 识别意图、grounding、slotResolver 和最多 2 轮追问补齐关键上下文。
- 系统通过 L2 输出红黄灰绿风险，含 `reasonCode`、证据、CTA。
- 系统通过 L3 输出普通人能懂的解释和规避方向。
- 每次结果展示免责声明、证据来源和保存入口。
- 保存能力在当前代码中未完全实现时，文档必须标为 planned，并在 implementation map 中记录。

### P1 — Reminder + Feedback

- 用户保存结果后，可一键确认提醒计划。
- Reminder 根据成分属性、剂型、时段和禁忌规则生成默认建议。
- 每次提醒后只问一个轻反馈问题，如“吃了吗”“感觉如何”“是否跳过”。
- 严重异常关键词必须硬编码拦截，并建议咨询医生或药师。
- 用户可暂停、降频、删除提醒。

### P2 — Memory + Hermit Agent

- 每条反馈沉淀为可召回 Memory：时间、事件、关联实体、用户原话、标签、隐私模式。
- Hermit Agent 周期性扫描 Memory，输出“观察”，不是医学诊断。
- 每条 Hermit 观察必须可解释、可确认、可否定。
- 用户可查看“LLM 看到了什么”，可关闭上行字段。

### P3 — Health Event Pipeline

- 扩展事件类型到处方药、睡眠、饮食、运动、体检。
- 仍沿用事件 → 属性识别 → 提醒 → 反馈 → Memory → Hermit 的管道。

## 8. Non-Goals

- 不做疾病诊断、治疗方案、处方建议。
- 不做 CPS、品牌导购和渠道偏置推荐。
- 不做默认完整建档。
- 不做不可解释的后台自作主张。
- 不把 planned 能力写成 implemented。

## 9. Release Plan

| Release | 主题 | 必须完成 |
|---|---|---|
| P0 | 能查，能信 | intent / judgment / translation 主链、Go/No-Go 测试、DemoBanner |
| P1 | 能提醒，能反馈 | Reminder table、Feedback ritual、隐私 HUD v0 |
| P2 | 能记住，能进化 | Memory schema、召回策略、Hermit cycle |
| P3 | 能迁移 | 多健康事件管道、跨场景 Memory |
