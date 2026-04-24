---
title: "VitaMe Test Matrix"
description: "VitaMe P0/P1/P2 测试矩阵：安全判断、提醒反馈、Memory/Hermit、隐私和合规。"
doc_type: "test_matrix"
status: "active"
created: "2026-04-20"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "qa", "test", "matrix", "agent"]
source_docs:
  - "docs/product/PRD.md"
  - "docs/product/Agent-北极星.md"
  - "docs/engineering/specs/api-contract.md"
  - "docs/engineering/specs/implementation-map.md"
---

# VitaMe — Test Matrix

## 1. Test Layers

| Layer | Purpose | Phase |
|---|---|---|
| R | 风险判定真值 | P0 |
| I | Intent / Intake / Clarify | P0 |
| T | Translation / Compliance | P0 |
| G | Agent shell / Tool loop | P0 planned MVP |
| A | Archive / Recheck | planned |
| M | Reminder / Feedback | P1 planned |
| H | Memory / Hermit | P2 planned |
| P | Privacy / Safety Guardrails | P1/P2 planned |

## 2. P0 Go / No-Go

| ID | Scenario | Expected |
|---|---|---|
| R-01 | CoQ10 + Warfarin | red, hardcoded rule |
| R-02 | Magnesium oxide + gastric ulcer | yellow |
| R-03 | Unknown ingredient | gray, not green |
| R-04 | Known ingredient with no matched risk | green with boundary sentence |
| I-01 | Natural query with ingredient + medication | `product_safety_check` ready |
| T-01 | Any result | disclaimer present |
| T-02 | Banned phrase | filtered or fallback |
| T-03 | LLM translation failure | template fallback still returns result |
| G-01 | Agent receives “我妈在吃华法林，能吃 Q10 吗” | calls parseIntentTool → runJudgmentTool → translateRiskTool |
| G-02 | Agent response includes risk level | level matches L2 output; Agent does not invent level |
| G-03 | Tool loop reaches step limit | stops cleanly with fallback message |
| G-04 | Memory preview shown | local preview only; no backend save claim |

## 3. Rule Review Cases

| ID | Scenario | Target | Current Risk |
|---|---|---|---|
| RR-01 | Fish oil + Warfarin | Existing product docs previously marked red; code/data-baking mark yellow | Medical review required before changing code |
| RR-02 | Pregnancy + Vitamin A high dose | red | Requires reviewer confirmation |
| RR-03 | Severe symptom feedback | hard escalation | Planned for Feedback Ritual |

## 4. P1 Planned Tests

| ID | Scenario | Expected |
|---|---|---|
| M-01 | Save result then create reminder | reminder plan created |
| M-02 | User skips reminder 3 times | system offers pause or reduce frequency |
| M-03 | User logs “吃了” | feedback event stored |
| M-04 | User reports severe keyword | hard escalation, no LLM diagnosis |

## 5. P2 Planned Tests

| ID | Scenario | Expected |
|---|---|---|
| H-01 | 20 feedback events exist | Memory search returns relevant events |
| H-02 | Hermit generates observation | includes evidence events and confidence |
| H-03 | User rejects observation | future similar observation is downranked |
| H-04 | User deletes Memory | deleted memory is not recalled |

## 6. Privacy Tests

| ID | Scenario | Expected |
|---|---|---|
| P-01 | Local mode | no cloud memory write |
| P-02 | LLM input view | user can inspect redacted payload |
| P-03 | Field upload off | field not included in prompt |
| P-04 | Clear archive | local and cloud references invalidated |

## 7. Commands

Current checks:

```bash
npm run typecheck
npm run test:unit
npm run test:seed
```

Planned E2E suites should be added only when corresponding APIs exist.
