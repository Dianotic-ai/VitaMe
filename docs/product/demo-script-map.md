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

## 2. Script

| Time | Scene | Message | Acceptance |
|---|---|---|---|
| 0-10s | 首页 | “买补剂前，先查它适不适合你的体质” | 首页承诺清晰 |
| 10-25s | 输入 | “我妈在吃华法林，能吃辅酶 Q10 吗？” | `/api/intent` 识别 ingredient + medication |
| 25-45s | 判断 | 红色风险 + 原因 | `/api/judgment` 命中硬编码规则 |
| 45-60s | 解释 | 人话解释 + 证据 + disclaimer | `/api/translation` 不改 level |
| 60-75s | 保存 | 保存到妈妈档案 | archive 当前可为 planned/mock，但不能写成已实现 |
| 75-90s | 北极星 | “保存后可设提醒，反馈会让 Agent 越来越懂你” | 明确 P1/P2 planned |

## 3. Required Cases

| Case | Expected |
|---|---|
| CoQ10 + Warfarin | Red |
| Pregnancy + high-risk supplement | Red / caution with strong disclaimer |
| Magnesium oxide + gastric ulcer | Yellow |
| Unknown ingredient | Gray |
| Known ingredient no matched risk | Green with boundary sentence |

## 4. Do Not Claim

- 不说已完成 Reminder / Feedback / Memory / Hermit。
- 不说“保证安全”。
- 不说医学诊断。
- 不说医生已审核全部规则，除非 `medical-review-workflow.md` 状态已更新。

## 5. Source Docs

- `docs/product/PRD.md`
- `docs/product/Agent-北极星.md`
- `docs/engineering/specs/test-matrix.md`
- `docs/engineering/specs/implementation-map.md`
