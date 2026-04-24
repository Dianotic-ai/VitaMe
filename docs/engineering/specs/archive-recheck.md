---
title: "Archive and Recheck"
description: "VitaMe 保存和复查能力的 planned spec；当前代码未实现对应 API route。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "archive", "recheck", "planned", "p1"]
source_docs:
  - "docs/product/PRD.md"
  - "docs/product/用户旅程.md"
  - "docs/engineering/specs/api-contract.md"
  - "docs/engineering/specs/implementation-map.md"
---

# VitaMe — Archive and Recheck

## 1. Status

Archive / Recheck 是 P0 产品链路的目标能力，但当前代码中未发现对应 API route。本文是 planned spec，不得被读成 implemented。

当前实现状态以 `docs/engineering/specs/implementation-map.md` 为准。

## 2. Product Purpose

保存不是后台管理动作，而是让下一次复查更轻：

- 首次 Verify 后保存结果和上下文。
- 下次新增补剂、药物或病史时复用已有 context。
- 用户能看到新增项带来的风险变化。

## 3. Planned Data Objects

```ts
type PersonContext = {
  personId: string;
  label: "self" | "mom" | "dad" | "other";
  conditions: string[];
  medications: string[];
  specialGroups: string[];
  savedQueryIds: string[];
};

type ArchiveEntry = {
  archiveEntryId: string;
  personId: string;
  sessionId: string;
  querySummary: string;
  overallLevel: "red" | "yellow" | "gray" | "green";
  createdAt: string;
};
```

## 4. Planned APIs

- `POST /api/archive/save`
- `POST /api/archive/recheck`

Both are planned only. Do not call from UI until routes exist.

## 5. Recheck Behavior

Recheck should return:

- `newRisks`
- `changedRisks`
- `unchangedRisks`
- `missingContext`

If stored context is incomplete, result must not silently turn green. Missing context should produce gray or a clarify prompt.

## 6. Acceptance

- Saving explains what will be reused next time.
- Recheck does not ask already-known fields again.
- User can delete archive entries.
- Sensitive health context is not sent to LLM unless privacy settings allow it.
