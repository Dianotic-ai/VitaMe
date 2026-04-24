---
title: "Medical Review Workflow"
description: "VitaMe 禁忌规则、DemoBanner、reviewerCredential 和上线门槛的医学审核流程。"
doc_type: "workflow"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "medical-review", "compliance", "rules"]
---

# VitaMe — Medical Review Workflow

## 1. Goal

所有会影响红/黄风险判断的硬编码规则，在对外声称“已审核”前必须经过人工医学或药学审核。

## 2. Rule States

| State | Meaning | UI Requirement |
|---|---|---|
| draft | 工程骨架或研究材料 | 不可对外声称 |
| pending_review | 等待审核 | DemoBanner 必须展示 |
| reviewed | 已审核 | 可展示 reviewer credential |
| rejected | 不通过 | 不得参与判定 |
| needs_revision | 需改写 | 只能用于内部测试 |

## 3. Required Fields

每条禁忌规则必须包含：

- `id`
- `substanceA`
- `substanceB`
- `severity`
- `reasonCode`
- `sourceRef`
- `pharmacistReviewed`
- `reviewedAt`
- `reviewerName`
- `reviewerCredential`

## 4. Review Steps

1. 工程从研究文档或数据烘焙方案生成规则草案。
2. Reviewer 检查 severity、reason、证据和适用边界。
3. Reviewer 明确通过、拒绝或要求修订。
4. 通过后补齐 reviewer fields。
5. 测试矩阵加入对应样例。
6. Demo / production 根据审核状态决定是否展示 DemoBanner。

## 5. Launch Gate

上线前必须满足：

- 所有 red 规则 reviewed，或明确展示未审核边界。
- 所有 public demo case 的规则状态可追溯。
- 禁忌规则 sourceRef 非空。
- `implementation-map.md` 不存在未解释的医学风险 mismatch。

## 6. Current State

当前代码中 50 条硬编码规则以 `pharmacistReviewed: false` 起步。对外 Demo 必须展示未审核提示，除非审核状态被更新。
