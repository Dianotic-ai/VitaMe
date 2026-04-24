---
title: "Demo Script Map"
description: "VitaMe 90 秒 Demo 脚本与验收项、测试样例和文档事实源的映射。"
doc_type: "demo-map"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["product", "demo", "acceptance", "p0"]
---

# VitaMe — Demo Script Map

## 1. Demo Goal

90 秒内证明：VitaMe 不是健康内容站，也不是导购，而是能把个人上下文翻译成补剂安全判断的 Agent。

Demo 叙事借鉴 Vercel-style Agent UX：用户给一个自然语言任务，系统展示工具调用、可信判断、行动建议和 Memory preview。但 VitaMe 不讲 text-to-app，不讲代码生成，不讲自动部署。

## 2. 90-Second Agent Demo

| Time | Scene | Message | Acceptance |
|---|---|---|---|
| 0-10s | 首页 | “买补剂前，先让 Agent 帮你查安全边界” | 首页承诺清晰，不导购 |
| 10-20s | Agent 输入 | “我妈在吃华法林，能吃辅酶 Q10 吗？” | 输入是自然语言任务，不是表单 |
| 20-35s | Tool trace | `parseIntentTool → runJudgmentTool` | 展示 Agent 正在调用工具，不自行判定 |
| 35-50s | 判断 | 红色风险 + 原因 | `/api/judgment` 命中硬编码规则 |
| 50-65s | 解释 | 人话解释 + 证据 + disclaimer | `/api/translation` 不改 level |
| 65-80s | 行动建议 | “先不要自行服用 / 带结果问医生 / 保存给妈妈档案” | action cards 不诊断、不处方 |
| 80-90s | 北极星钩子 | “保存后可设提醒，反馈会让 Agent 越来越懂你” | 明确 Memory/Reminder 是 planned preview |

## 3. Agent Feel Requirements

- 必须可见 tool trace，让评委理解 VitaMe 是 tool-using Agent。
- 必须显示 L2 判断是 deterministic，不是模型自由发挥。
- 必须给出下一步行动卡，而不是只输出一段解释文字。
- 可以展示 local memory preview，但必须标明未写入长期存储。
- 可以说明未来支持 Claude/GPT/Grok provider 切换，但不要把模型切换作为核心卖点。

## 4. Required Cases

| Case | Expected |
|---|---|
| CoQ10 + Warfarin | Red |
| Pregnancy + high-risk supplement | Red / caution with strong disclaimer |
| Magnesium oxide + gastric ulcer | Yellow |
| Unknown ingredient | Gray |
| Known ingredient no matched risk | Green with boundary sentence |

## 5. Do Not Claim

- 不说已完成 Reminder / Feedback / Memory / Hermit。
- 不说“保证安全”。
- 不说医学诊断。
- 不说医生已审核全部规则，除非 `medical-review-workflow.md` 状态已更新。
- 不说 VitaMe 是 text-to-app platform。
- 不说 Agent 可以替代 L2 风险规则。

## 6. Source Docs

- `docs/product/PRD.md`
- `docs/product/Agent-北极星.md`
- `docs/engineering/specs/test-matrix.md`
- `docs/engineering/specs/implementation-map.md`
