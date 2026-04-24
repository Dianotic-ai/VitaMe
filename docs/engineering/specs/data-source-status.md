---
title: "Data Source Status"
description: "VitaMe P0/P1 数据源状态表：NIH、PubChem、DSLD、SUPP.AI、TGA、JP、Bluehat 等。"
doc_type: "status-table"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "data", "sources", "baking"]
---

# VitaMe — Data Source Status

## 1. Source Table

| Source | Purpose | Current Status | Blocker |
|---|---|---|---|
| Hardcoded contraindications | P0 red/yellow rules | implemented | medical review pending |
| SUPP.AI | supplement-drug interactions | baked partial | severity mapping review |
| Cn DRI | intake reference values | implemented | keep bundle size small |
| LPI | monographs and values | partial | source coverage |
| PubChem | ingredient CID/form mapping | partial | local network blocked |
| NIH ODS | fact sheets | planned/blocked | local DNS/VPN issue |
| DSLD | supplement label data | planned | not P0 blocker |
| TGA | AU ingredient status | planned | P1/P2 |
| JP | Japan data | planned | P1/P2 |
| Bluehat | China health food status | planned | P1/P2 |

## 2. Runtime Rule

Runtime must not call external data sources in P0. Baking happens offline into `src/lib/db/*.ts`.

## 3. Current Known Blockers

- NIH and PubChem were blocked locally by DNS/VPN behavior.
- SV server re-bake is the preferred path.
- Missing sources must produce gray or lower confidence, never false green.

## 4. Validation Requirements

Every bake script should print:

```text
size: <KB> entries: <count>
```

Stop if:

- total bundle > 5 MB
- one generated TS file > 1.5 MB
- sourceRefs are empty
