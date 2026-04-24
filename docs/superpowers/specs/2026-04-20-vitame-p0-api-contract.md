---
title: "VitaMe P0 API Contract"
description: "补剂安全翻译 Agent P0 的接口契约、对象 schema、错误码和状态约束。"
doc_type: "contract"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["engineering", "api", "contract", "p0", "superpowers"]
source_docs:
  - "docs/product/VitaMe-P0-统一执行总纲.md"
  - "docs/product/VitaMe-P0-用户上下文分类法.md"
  - "docs/product/VitaMe-P0-风险判定矩阵.md"
  - "docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md"
  - "docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md"
  - "docs/superpowers/specs/2026-04-18-vitame-safety-translation-design.md"
  - "docs/superpowers/specs/2026-04-18-vitame-archive-recheck-design.md"
  - "docs/superpowers/specs/2026-04-18-vitame-compliance-design.md"
purpose: "作为前后端与 Claude Code 的统一接口合同；若与页面草图冲突，以本文件为准。"
---

# VitaMe P0 API Contract

> 日期：2026-04-20  
> 状态：Draft  
> 目标：让前端、后端、测试、Claude Code 对同一批对象和字段名达成一致。

---

## Architecture

P0 的 API 分为两层：

### A. 外部可调用（前端直接调）

- `POST /api/query`
- `POST /api/query/context`
- `POST /api/archive/save`
- `POST /api/archive/recheck`

### B. 内部编排层（服务器内部调，可先不暴露给前端）

- `POST /api/judgment`
- `POST /api/translation`

> 原则：前端不应自己拼 judgment / translation 链路；由后端 orchestrator 串起来，减少协议漂移。

---

## Components

## 1. Shared Models

### 1.1 IngredientRef

```ts
type IngredientRef = {
  rawName: string;
  canonicalName?: string | null;
  canonicalCn?: string | null;
  form?: string | null;
  amountText?: string | null;
  source: "manual" | "ocr" | "archive";
  confidence: "high" | "medium" | "low";
};
```

### 1.2 MedicationEntry

```ts
type MedicationEntry = {
  rawName: string;
  canonicalName?: string | null;
  code?: string | null;
  confidence: "high" | "medium" | "low";
};
```

### 1.3 QueryContext

```ts
type QueryContext = {
  medications: MedicationEntry[];
  conditions: string[];
  allergies: string[];
  specialGroups: string[];
  doseBand?: "unknown" | "low" | "medium" | "high" | null;
  timing?: "unknown" | "empty_stomach" | "with_food" | "before_sleep" | "other" | null;
  existingSupplements?: IngredientRef[];
};
```

### 1.4 PersonRef

```ts
type PersonRef = {
  personId?: string;
  label?: "self" | "mom" | "dad" | "other";
  customLabel?: string;
};
```

### 1.5 QuerySession

```ts
type QuerySession = {
  sessionId: string;
  status: "collecting_context" | "ready_for_judgment" | "completed" | "expired";
  queryMode: "manual" | "ocr";
  queryKind: "product" | "ingredient" | "recheck";
  rawInput: string;
  ingredients: IngredientRef[];
  context: QueryContext;
  person?: PersonRef | null;
  askedQuestions: string[];
  missingRequiredFields: string[];
  createdAt: string;
  expiresAt: string;
};
```

### 1.6 Risk / JudgmentResult / TranslatedRisk

```ts
type Risk = {
  level: "red" | "yellow" | "gray" | "green";
  dimension: "drug_interaction" | "condition_contra" | "population_caution" | "dose_caution" | "form_difference" | "coverage_gap";
  // 溯源（与 Ingredient.id / 药物词表 / 病史 code 一致）
  ingredient: string;
  condition?: string;
  medication?: string;
  reasonCode: string;
  title: string;
  summary: string;
  evidenceStrength: "high" | "medium" | "low" | "unknown";
  evidenceType: "hardcoded_rule" | "database" | "literature" | "limited" | "none";
  sourceRefs: string[];
  cta: "stop_and_consult" | "consult_if_needed" | "recheck_with_more_context" | "proceed_with_caution" | "basic_ok";
};

type JudgmentResult = {
  overallLevel: "red" | "yellow" | "gray" | "green";
  risks: Risk[];
  partialData: boolean;
  partialReason?: string | null;
};

type TranslatedRisk = Risk & {
  translation: string;
  avoidance: string;
};

// Disclaimer 改为顶层一份，挂在 TranslationResult 上（合规红线：不重复贴到每条 Risk）
type TranslationResult = {
  sessionId: string;
  overallLevel: "red" | "yellow" | "gray" | "green";
  translatedRisks: TranslatedRisk[];
  disclaimer: string;   // 合规顶层一份，前端兜底必渲染
  criticalWarning?: { show: true; text: string };
};
```

### 1.7 Archive Models

```ts
type Person = {
  personId: string;
  label: "self" | "mom" | "dad" | "other";
  customLabel?: string;
  conditions: string[];
  medications: MedicationEntry[];
  allergies: string[];
  specialGroups: string[];
  savedQueries: string[];
  createdAt: string;
  updatedAt: string;
};

type ArchiveEntry = {
  archiveEntryId: string;
  personId: string;
  sessionId: string;
  querySummary: string;
  ingredients: IngredientRef[];
  overallLevel: "red" | "yellow" | "gray" | "green";
  risks: TranslatedRisk[];
  createdAt: string;
};
```

---

## 2. Endpoint Contracts

## 2.1 `POST /api/query`

### 用途

创建新的 `QuerySession`，并完成：

- 手动输入归一化
- OCR 结果归一化
- 初步 ingredient 标准化
- 从 `personRef` 回填已有 context
- 生成下一步追问计划

### Request

```json
{
  "queryMode": "manual",
  "rawInput": "Doctor's Best Magnesium",
  "imageBase64": null,
  "personRef": {
    "personId": "person_mom_001"
  }
}
```

### Response

```json
{
  "ok": true,
  "session": {
    "sessionId": "qs_123",
    "status": "collecting_context",
    "queryMode": "manual",
    "queryKind": "product",
    "rawInput": "Doctor's Best Magnesium",
    "ingredients": [
      {
        "rawName": "Magnesium",
        "canonicalName": "magnesium",
        "canonicalCn": "镁",
        "source": "manual",
        "confidence": "medium"
      }
    ],
    "context": {
      "medications": [],
      "conditions": ["hypertension"],
      "allergies": [],
      "specialGroups": ["older_adult"]
    },
    "person": {
      "personId": "person_mom_001",
      "label": "mom"
    },
    "askedQuestions": [],
    "missingRequiredFields": ["medications"],
    "createdAt": "2026-04-20T10:00:00Z",
    "expiresAt": "2026-04-20T10:30:00Z"
  },
  "nextQuestions": [
    {
      "questionId": "q_medications",
      "type": "multi_select_or_text",
      "title": "你现在有没有长期在吃药？",
      "required": true
    }
  ]
}
```

### 约束

- `queryMode = ocr` 时，`imageBase64` 必填
- `rawInput` 和 `imageBase64` 至少有一个
- OCR 失败时仍返回 `ok: true` + `fallbackToManual: true`，不要直接 500

---

## 2.2 `POST /api/query/context`

### 用途

向已有 `QuerySession` 追加上下文；若达到最低判断条件，则直接返回最终结果。

### Request

```json
{
  "sessionId": "qs_123",
  "answers": {
    "medications": [
      { "rawName": "Amlodipine", "confidence": "medium" }
    ],
    "conditions": ["hypertension"]
  }
}
```

### Response A：仍需追问

```json
{
  "ok": true,
  "session": {
    "sessionId": "qs_123",
    "status": "collecting_context",
    "missingRequiredFields": ["specialGroups"]
  },
  "nextQuestions": [
    {
      "questionId": "q_special_groups",
      "type": "single_select",
      "title": "是否属于孕期、哺乳期、备孕、儿童或老年人？",
      "required": false
    }
  ]
}
```

### Response B：达到判断条件，直接给最终结果

```json
{
  "ok": true,
  "session": {
    "sessionId": "qs_123",
    "status": "completed"
  },
  "result": {
    "sessionId": "qs_123",
    "overallLevel": "yellow",
    "partialData": false,
    "translatedRisks": [
      {
        "level": "yellow",
        "dimension": "drug_interaction",
        "ingredient": "magnesium",
        "medication": "amlodipine",
        "reasonCode": "DRUG_INTERACTION_CAUTION",
        "title": "当前用药下需注意",
        "summary": "可能影响当前用药体验",
        "evidenceStrength": "medium",
        "evidenceType": "database",
        "sourceRefs": ["suppai:123"],
        "cta": "consult_if_needed",
        "translation": "这不是绝对不能吃，但在你现在的用药情况下需要多留心。",
        "avoidance": "先保存这次结果；若准备长期服用，建议咨询医生或药师确认。"
      }
    ],
    "disclaimer": "VitaMe 提供补剂安全信息和决策辅助，不提供诊断或处方建议。"
  }
}
```

### 约束

- `sessionId` 必须存在且未过期
- 每次提交只允许追加字段，不允许前端覆盖服务端已 canonicalize 的结构字段，除非显式 `replace = true`
- 服务端负责决定是否继续追问，不由前端自行判断

---

## 2.3 `POST /api/judgment`（内部）

### 用途

把 `QuerySession` 转成 `JudgmentResult`

### Request

```json
{
  "sessionId": "qs_123"
}
```

### Response

```json
{
  "ok": true,
  "judgment": {
    "overallLevel": "gray",
    "partialData": true,
    "partialReason": "missing_medication_name",
    "risks": [
      {
        "level": "gray",
        "dimension": "coverage_gap",
        "ingredient": "magnesium",
        "reasonCode": "INSUFFICIENT_CONTEXT_MEDICATION",
        "title": "缺少关键用药信息",
        "summary": "当前无法可靠判断与在用药是否冲突",
        "evidenceStrength": "unknown",
        "evidenceType": "limited",
        "sourceRefs": [],
        "cta": "recheck_with_more_context"
      }
    ]
  }
}
```

---

## 2.4 `POST /api/translation`（内部）

### 用途

将 `JudgmentResult.risks` 转为 `TranslatedRisk[]`

### Request

```json
{
  "sessionId": "qs_123",
  "judgment": {
    "overallLevel": "red",
    "partialData": false,
    "risks": [
      {
        "level": "red",
        "dimension": "drug_interaction",
        "ingredient": "fish_oil",
        "medication": "warfarin",
        "reasonCode": "DRUG_INTERACTION_MAJOR",
        "title": "存在明确高风险交互",
        "summary": "当前成分与在用药存在已知高风险",
        "evidenceStrength": "high",
        "evidenceType": "hardcoded_rule",
        "sourceRefs": ["rule:warfarin_fish_oil"],
        "cta": "stop_and_consult"
      }
    ]
  }
}
```

### Response

```json
{
  "ok": true,
  "sessionId": "qs_123",
  "overallLevel": "red",
  "translatedRisks": [
    {
      "level": "red",
      "dimension": "drug_interaction",
      "ingredient": "fish_oil",
      "medication": "warfarin",
      "reasonCode": "DRUG_INTERACTION_MAJOR",
      "title": "存在明确高风险交互",
      "summary": "当前成分与在用药存在已知高风险",
      "evidenceStrength": "high",
      "evidenceType": "hardcoded_rule",
      "sourceRefs": ["rule:warfarin_fish_oil"],
      "cta": "stop_and_consult",
      "translation": "你现在吃的药和这类补剂放在一起，风险已经不是“多注意”级别。",
      "avoidance": "先不要自行继续，建议把这次结果带给医生或药师确认。"
    }
  ],
  "disclaimer": "VitaMe 提供补剂安全信息和决策辅助，不提供诊断或处方建议。"
}
```

### 约束

- 不允许新增或修改 `level`
- 不允许新增核心 `reasonCode`
- 违规时走模板 fallback
- 合规红线：Disclaimer 挂在 TranslationResult 顶层，不重复贴到每条 Risk

---

## 2.5 `POST /api/archive/save`

### 用途

将本次完成结果保存到指定 `Person`

### Request

```json
{
  "sessionId": "qs_123",
  "personId": "person_mom_001",
  "newPerson": null
}
```

或

```json
{
  "sessionId": "qs_123",
  "personId": null,
  "newPerson": {
    "label": "other",
    "customLabel": "爷爷"
  }
}
```

### Response

```json
{
  "ok": true,
  "archiveEntryId": "ae_001",
  "personSummary": {
    "personId": "person_mom_001",
    "label": "mom",
    "savedQueriesCount": 3
  }
}
```

### 约束

- 仅允许保存 `status = completed` 的 session
- `personId` 与 `newPerson` 二选一
- 服务端负责把当前 `session.context` 的可沉淀字段合并进 `Person`

---

## 2.6 `POST /api/archive/recheck`

### 用途

给已存在的 `Person` 新增一项，并在既有 context 上复查

### Request

```json
{
  "personId": "person_mom_001",
  "rawInput": "Fish Oil",
  "queryMode": "manual"
}
```

### Response

```json
{
  "ok": true,
  "session": {
    "sessionId": "qs_recheck_001",
    "status": "completed",
    "queryKind": "recheck"
  },
  "result": {
    "sessionId": "qs_recheck_001",
    "overallLevel": "yellow",
    "partialData": false,
    "translatedRisks": [],
    "newRisks": [],
    "unchangedRisks": [],
    "disclaimer": "VitaMe 提供补剂安全信息和决策辅助，不提供诊断或处方建议。"
  }
}
```

### 约束

- 从 archive 触发时，默认复用该 Person 已有的 `conditions / medications / allergies / specialGroups`
- 若仅因剂量或时序仍不确定，可继续返回 `nextQuestions`

---

## Data Flow

### 首次查询

1. 前端调 `POST /api/query`
2. 服务端返回 `session + nextQuestions`
3. 前端依次提交 `POST /api/query/context`
4. 服务端满足条件后，内部串行：
   - `/api/judgment`
   - `/api/translation`
   - Compliance middleware
5. 返回最终 `result`

### 档案复查

1. 前端从某 `Person` 发起 `POST /api/archive/recheck`
2. 服务端自动回填既有 context
3. 若还需少量新问题，则返回 `nextQuestions`
4. 否则直接回结果
5. 用户可再 `save` 成为新 archive entry

---

## Error Handling

## 1. 统一错误格式

```json
{
  "ok": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "当前查询已过期，请重新开始。",
    "retryable": true
  }
}
```

## 2. 错误码表

| code | 含义 | retryable |
|------|------|-----------|
| `INVALID_REQUEST` | 请求缺字段或字段格式错误 | false |
| `OCR_FAILED_FALLBACK_AVAILABLE` | OCR 失败，但可切手动输入 | true |
| `INGREDIENT_NOT_RECOGNIZED` | 无法识别成分 | true |
| `SESSION_NOT_FOUND` | sessionId 不存在 | false |
| `SESSION_EXPIRED` | 查询已过期 | true |
| `JUDGMENT_NOT_READY` | 仍缺关键上下文 | true |
| `LLM_TRANSLATION_FAILED` | 翻译失败，将走模板 fallback | true |
| `ARCHIVE_SAVE_FAILED` | 存档失败 | true |
| `LOCAL_STORAGE_QUOTA` | 本地存储空间不足 | true |

### 约束

- `OCR_FAILED_FALLBACK_AVAILABLE` 建议前端仍当成功态处理，并展示手动输入入口
- `LLM_TRANSLATION_FAILED` 不应让用户看到 500；应自动 fallback 成模板解释
- 任何 `completed` 结果页都必须含免责声明

---

## Testing

### Contract 测试最低要求

1. 前端请求与后端 schema 一致
2. 每个 endpoint 至少有：
   - 1 个 happy path
   - 1 个 partialData path
   - 1 个 error path
3. `level` 字段只能取 `red/yellow/gray/green`
4. `cta` 只能从白名单枚举中产生
5. `translation` 层不得修改 judgment 的 `level`
6. `archive/save` 后再次 `recheck` 能读到已保存 context

---

## 一句话结论

**P0 最大的返工来源不是模型不够聪明，而是对象名、字段名、状态名到处飘；所以接口合同必须先冻住。**
