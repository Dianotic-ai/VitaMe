---
title: "Start Here"
description: "VitaMe 当前唯一入口：用 10 分钟理解 P0 执行楔子、长期 Agent 北极星、当前阶段、阅读路径和下一步。"
doc_type: "index"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["start-here", "docs", "current-state", "agent", "p0"]
---

# VitaMe — Start Here

> 如果只能读一份文档，先读这份。它只描述当前有效判断，不让历史材料继续污染日常阅读路径。

## 1. VitaMe 当前是什么

VitaMe 是一个**以补剂安全判断为入口的自我进化健康 Agent**。

P0 先做一把窄而可信的判断刀：用户在买补剂或准备服用补剂前，输入产品、成分、病史和在用药，系统告诉用户是否需要警惕、为什么、下一步怎么更稳妥。

长期方向不是“更会聊天的健康顾问”，而是一个会记住用户反馈、安排提醒、沉淀 Memory、周期性归纳模式的 Agent app：

```
Verify 安全判断 → 保存 → Reminder → Feedback → Memory → Hermit Agent → 更准的提醒和复查
```

## 2. 为什么先从补剂安全切入

用户真实痛点不是缺少健康内容，而是：

- 普通用户看不懂成分、剂型、剂量和相互作用。
- 有病史、孕期、老人用药等上下文时，通用搜索和大模型都难以稳定回答“我能不能吃”。
- 消费级健康产品不能一上来要求完整建档；用户必须先看到价值，再愿意持续反馈。
- 补剂是低频但高焦虑的决策入口，适合建立信任，再自然延伸到提醒和反馈闭环。

## 3. 分阶段事实

| 阶段 | 产品主语 | 交付目标 | 不做什么 |
|---|---|---|---|
| P0 | 补剂安全判断 + Agent shell | 60 秒内完成一次可解释风险判断，并展示受约束工具调度 | 不做诊断、导购、长期调理 |
| P1 | Reminder + Feedback | 用户确认服用提醒，并用轻反馈自然沉淀档案 | 不做重表单建档 |
| P2 | Memory + Hermit Agent | Agent 能周期性发现模式，提出可确认的调整 | 不做医学归因和处方建议 |
| P3 | 大健康事件管道 | 扩展到处方药、睡眠、饮食、运动、体检 | 不牺牲隐私和边界 |

## 4. P0 必须守住

- 高风险组合优先走确定性规则，不交给 LLM 判断。
- “未收录”必须是灰色，不得伪装成安全。
- “已收录但无禁忌”才可以是绿色。
- L3 只把结构化风险翻译成人话，不能改判定。
- P0 Agent shell 只能调工具和解释工具结果，不能自行生成风险等级。
- 所有未医学审核的规则命中必须挂 DemoBanner 或等价边界提示。
- P0 仍是近期交付楔子，不能被长期 Agent 愿景稀释。

## 5. 长期 Agent 必须守住

- Reminder 是反馈入口，不是打扰用户的活跃工具。
- Feedback Ritual 一次只问一个小问题，全部可跳过。
- Memory 是用户反馈和事件的可召回上下文，不是默认上传的黑盒档案。
- Hermit Agent 只能提出“观察”和“建议确认”，不得输出诊断、因果归因或处方。
- 隐私 HUD / 字段级开关 / LLM 输入可见性是长期信任基础。

## 6. 当前进度

当前分支：`dev-merged-2026-04-24`。

已完成：

- 三分支文档和代码已合到集成分支。
- Next.js P0 app、L0/L1/L2/L3 主要代码和 API routes 已落地。
- 已实现 API 以代码为准：`POST /api/intent`、`POST /api/judgment`、`POST /api/translation`。
- 文档结构已从散乱材料重建为 `START-HERE → 当前判断 → DOCS-COVERAGE → 产品/工程事实源`。
- Agent runtime 决策已更新：P0 黑客松 MVP 选择 Vercel AI SDK ToolLoopAgent 作为 Agent shell；Mastra / LangGraph 后移为 P1/P2 或 durable graph 评估项，详见 `docs/engineering/specs/agent-runtime-decision.md`。

未完成或高风险：

- P0 主链联调仍是下一优先级：`/api/intent → /api/judgment → /api/translation → result UI`；Agent shell `/api/agent` 仍是 planned MVP，不得写成已实现。
- Archive / Recheck / Reminder / Feedback / Memory / Hermit 仍是 planned，不得写成已实现。
- 医学/药剂师审核未完成，硬编码禁忌命中必须清晰标注未审核状态。
- NIH / PubChem 烘焙受本地网络阻塞，计划到 SV 服务器重跑。

## 7. 推荐阅读路径

1. [`docs/START-HERE.md`](./START-HERE.md)
2. [`docs/product/当前判断.md`](./product/当前判断.md)
3. [`docs/product/定位.md`](./product/定位.md)
4. [`docs/product/Agent-北极星.md`](./product/Agent-北极星.md)
5. [`docs/product/PRD.md`](./product/PRD.md)
6. [`docs/product/用户旅程.md`](./product/用户旅程.md)
7. [`docs/engineering/specs/system-architecture.md`](./engineering/specs/system-architecture.md)
8. [`docs/engineering/specs/data-flow.md`](./engineering/specs/data-flow.md)
9. [`docs/engineering/specs/agent-runtime-decision.md`](./engineering/specs/agent-runtime-decision.md)
10. [`docs/engineering/specs/api-contract.md`](./engineering/specs/api-contract.md)
11. [`docs/engineering/specs/implementation-map.md`](./engineering/specs/implementation-map.md)
12. [`docs/DOCS-COVERAGE.md`](./DOCS-COVERAGE.md)
