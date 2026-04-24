---
title: "Compliance Audit Status"
description: "VitaMe disclaimer、禁词、DemoBanner、audit log、隐私 HUD 和 Agent 观察的合规审计状态。"
doc_type: "audit-status"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "compliance", "audit", "privacy"]
---

# VitaMe — Compliance Audit Status

## 1. Audit Table

| Control | Target | Current Status |
|---|---|---|
| Disclaimer | every user-facing AI result | implemented in translation contract; verify UI |
| Banned words | block diagnosis/treatment claims | tests exist for banned words filter |
| DemoBanner | unreviewed hardcoded rule hit | required; verify route/UI wiring |
| Critical escalation | red/pregnancy/warfarin/severe symptoms | partial; feedback severe symptoms planned |
| Audit log | JSONL without PII | planned or partial; implementation map tracks gap |
| Privacy HUD | visible data mode and LLM input view | planned |
| Hermit observation boundary | observation, not diagnosis | planned |

## 2. Required Audit Fields

Planned audit event:

```ts
type AuditEvent = {
  timestamp: string;
  sessionIdHash: string;
  eventType: string;
  overallLevel?: "red" | "yellow" | "gray" | "green";
  bannedHit?: boolean;
  criticalHit?: boolean;
  demoBannerHit?: boolean;
  unreviewedRuleIds?: string[];
  sourceDistribution?: Record<string, number>;
};
```

## 3. Go / No-Go

Do not demo externally if:

- disclaimer can be missing from any result path
- red result can be translated into “safe”
- unreviewed rule hit has no visible boundary
- gray result is written as safe
- Hermit observation uses diagnostic language

## 4. Privacy Requirements

For P1/P2:

- Show current privacy mode.
- Show what is sent to LLM.
- Allow field-level upload control.
- Allow Memory deletion.
- Do not store raw health text in audit logs.
