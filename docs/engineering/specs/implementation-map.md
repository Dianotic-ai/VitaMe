---
title: "Implementation Map"
description: "VitaMe 文档需求到当前代码实现的对照表，标出 implemented、planned、mismatch 和 review-needed。"
doc_type: "implementation-map"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "implementation", "coverage", "docs-code-sync"]
---

# VitaMe — Implementation Map

## 1. Status Legend

| Status | Meaning |
|---|---|
| implemented | 当前代码已存在 |
| partial | 有代码，但未完整满足文档 |
| planned | 文档目标，代码未实现 |
| mismatch | 文档和代码冲突 |
| review-needed | 需要人工或医学审核 |

## 2. P0 Core

| Capability | Status | Code / Doc |
|---|---|---|
| L0 intent API | implemented | `src/app/api/intent/route.ts` |
| L2 judgment API | implemented | `src/app/api/judgment/route.ts` |
| L3 translation API | implemented | `src/app/api/translation/route.ts` |
| Browser API client | implemented | `src/lib/api/client.ts` |
| Query intake | implemented | `src/lib/capabilities/queryIntake/` |
| Safety judgment | implemented | `src/lib/capabilities/safetyJudgment/` |
| Safety translation | implemented | `src/lib/capabilities/safetyTranslation/` |
| Archive save/recheck | planned | docs only |
| Reminder / Feedback | planned | docs only |
| Memory / Hermit | planned | docs only |
| P0 Agent shell | planned | Vercel AI SDK ToolLoopAgent selected; not implemented |
| P1/P2 workflow runtime | planned | AI SDK first; Mastra / LangGraph deferred |

## 3. Product / Code Mismatches

| Item | Product Target | Current Code | Status |
|---|---|---|---|
| Fish oil + Warfarin severity | Older risk docs/test docs previously marked red | `contraindications.ts` marks yellow | review-needed |
| Archive save | PRD requires result save | no route found | planned |
| Recheck | PRD requires reuse context | no route found | planned |
| Medical review state | reviewer fields exist on rules | all current hardcoded rules start `pharmacistReviewed: false` | partial |
| Compliance audit logger | specs describe JSONL audit | no dedicated audit logger found in current file list | planned |
| ToolLoopAgent route | Agent shell requires `/api/agent` | no route found | planned |
| AI SDK dependency | Agent shell requires `ai` package | not in current `package.json` | planned |
| Reminder engine | Agent north star requires reminder plans | no route/model found | planned |
| Memory store | Agent north star requires MemoryEvent | no route/model found | planned |
| Hermit cycle | Agent north star requires periodic observations | no route/job found | planned |

## 4. Current Test Coverage

| Area | Current Tests |
|---|---|
| API routes | `tests/unit/api/*Route.spec.ts` |
| Query intake | `tests/unit/queryIntake/` |
| Safety judgment | `tests/unit/safetyJudgment/` |
| Safety translation | `tests/unit/safetyTranslation/` |
| Seed questions | `tests/seed-questions.spec.ts` |

## 5. Implementation Rule

This file is the only place where planned product goals may be contrasted with current code. Other docs should not imply planned APIs are already live.
