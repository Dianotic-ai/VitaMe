---
title: "VitaMe P0 Design — Query Intake (L0)"
description: "L0 意图识别层：自然语言 query → LLM parseIntent → 确定性 grounding → slot resolver → clarify-style follow-up → 出 LookupRequest 给 L2。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-22"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "query-intake", "intent-recognition", "ocr", "multimodal"]
---

# VitaMe P0 Design — Query Intake (L0)

> **D5 重写背景（v2 → v3，2026-04-22）**：v1/v2 的 InputNormalizer + 关键词 `includes()` 字典查询在自然语言 query 上完全失效。实测 "感冒期间可以吃维生素 AD 软胶囊吗" / "我妈最近老觉得累，听说辅酶 Q10 能补一下" 等真实输入全部返回"证据不足"。
>
> 问题根因：把"识别用户在问什么"和"判断风险"塞在了同一层。
>
> v3 把 L0 拆成独立层（CLAUDE.md §3.1 / §10.0），由「LLM parseIntent + 确定性 grounding + 业务 slotResolver + 混合 clarify」四个子模块组成。LLM 只做 NER + question-phrasing，**不**判风险（合规红线 §11.5 / §11.13）。

---

## Architecture

L0 在前端 H5 与 L2 SafetyJudgment 之间，承担"听懂人话 → 给出 slug"的全部职能。

```
[ 用户自然语言 query / 上传瓶子图 ]
              │
              ▼
┌─────────────────────────────────────────┐
│ L0 — Query Intake & Intent              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ a. parseIntent (LLM, Zod 校验)  │   │
│  │   in : { rawQuery, history? }   │   │
│  │   out: IntentResult             │   │
│  └────────────────┬────────────────┘   │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │ b. groundMentions (deterministic)│   │
│  │   alias 表 + L1 fuzzy           │   │
│  │   out: GroundedMentions         │   │
│  └────────────────┬────────────────┘   │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │ c. slotResolver (rules)         │   │
│  │   缺关键 slot? → 触发 clarify   │   │
│  └────────────────┬────────────────┘   │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │ d. clarify-style follow-up      │   │
│  │   business decides WHAT/WHEN    │   │
│  │   LLM decides HOW (一句话)      │   │
│  └────────────────┬────────────────┘   │
└────────────────────┼────────────────────┘
                     ▼
        IntentResult + LookupRequest（slug 化）
                     │
                     ▼
              L2 SafetyJudgment
```

**关键工程约束**：

- **L0 LLM 调用允许，输出必须 Zod 校验**（CLAUDE.md §11.6）。校验失败回 `parseIntentFallback`：一句"我没听懂，能换个说法吗？"+ 引导按钮，**不**透出 raw LLM 文本。
- **LLM 不判风险**（CLAUDE.md §11.13）。L0 输出 schema 不含 `level / risk / safe / dangerous` 字段；含则 reject。
- **grounding 是确定性的**：LLM 抽出的 mention 是中文短语（"鱼油" / "华法林" / "孕期"），由 `src/lib/api/slugMappings.ts` + L1 fuzzy 翻成 slug。grounding 失败 → clarify 询问，**不**塞 L2。
- **clarify 是混合的**：业务规则决定问什么、问几次（≤2 轮，避免无限对话），LLM 只决定措辞。问句和选项都通过 Zod schema。
- **症状型 query 例外**（§11.14）：`intent === 'symptom_goal_query'` 时允许返"针对该症状的候选成分"，但每条带 `sourceRefs` + 引导用户对单个候选做二次安全核查。

---

## Components

### a. parseIntent — `src/lib/capabilities/queryIntake/parseIntent.ts`

LLM 调用，**唯一**入口走 `src/lib/adapters/llm/`（CLAUDE.md §6.1 单 LLMClient）。

**输入**：

```ts
interface ParseIntentInput {
  rawQuery: string;          // 用户原始输入
  imageOcrText?: string;     // 拍照路径下 ocrAdapter 输出的纯文本
  history?: ClarifyTurn[];   // 多轮 clarify 历史
}
```

**输出 Zod schema**（`src/lib/types/intent.ts`）：

```ts
export const IntentTypeEnum = z.enum([
  'product_safety_check',     // "Swisse 葡萄籽现在能吃吗？"
  'photo_label_parse',        // 拍了张瓶子图（前端识别后归此类）
  'symptom_goal_query',       // "我最近老觉得累"
  'ingredient_translation',   // "EPA 是什么？"
  'contraindication_followup',// "刚才说的 Q10 + 华法林，那如果只吃半量呢？"
  'profile_update',           // "我现在不吃 SSRI 了"
  'unclear',                  // 兜底
]);

export const IntentResultSchema = z.object({
  intent: IntentTypeEnum,
  productMentions: z.array(z.string()).max(10),       // "Swisse 葡萄籽" / "Doctor's Best Magnesium 200mg"
  ingredientMentions: z.array(z.string()).max(10),    // "鱼油" / "辅酶 Q10"
  medicationMentions: z.array(z.string()).max(10),    // "华法林" / "降压药"
  conditionMentions: z.array(z.string()).max(10),     // "胃溃疡" / "肝炎"
  specialGroupMentions: z.array(z.string()).max(5),   // "孕期"
  symptomMentions: z.array(z.string()).max(5),        // "疲劳" / "失眠"（仅 symptom_goal_query 用）
  missingSlots: z.array(z.enum([
    'product_or_ingredient',  // 没说在问哪个东西
    'medication_context',     // 高风险类问题但没说在吃什么药
    'special_group',          // 缺孕期/婴幼儿等关键人群信息
    'symptom_specificity',    // symptom 型但太笼统
  ])),
  clarifyingQuestion: z.object({
    question: z.string().min(4).max(40),  // ≤40 字，遵循 DESIGN.md 移动端
    choices: z.array(z.string()).min(2).max(4),  // 2-4 个选项 + UI 自动加 "其他"
  }).nullable(),
  // 严禁字段（出现即 Zod reject）
}).strict();  // .strict() 锁死，LLM 多吐 level/safe/risk 字段会被拒
```

**Prompt 模板**（保存在 `src/lib/capabilities/queryIntake/prompts/parseIntent.zh.md`）：

```
你是 VitaMe 的查询解析器。你的任务是把用户的自然语言查询，
解析成结构化字段，供后续判断引擎使用。

---
你必须遵守的约束：
1. 你只做识别，不做判断。绝不输出 "安全/不安全/红/黄/绿" 等任何风险字段。
2. mention 用用户原话或最自然的中文短语（"鱼油"，不是 "fish oil"；
   "华法林"，不是 "warfarin"）。slug 转换由下游做。
3. clarifyingQuestion 只在 missingSlots 非空且关键时给出；问句 ≤40 字，
   选项 2-4 个；不要列穷举（"其他" 由 UI 自动追加）。
4. 不认识的成分名直接放进 ingredientMentions，不要丢，不要猜近似品牌。

---
输入：{{rawQuery}}
（多轮上下文：{{history}}）

输出 JSON（严格符合 schema）：
{ "intent": ..., "productMentions": [...], ..., "clarifyingQuestion": null }
```

**错误处理**：

- LLM timeout（30s）→ 返 `IntentResult { intent: 'unclear', clarifyingQuestion: parseIntentFallback() }`
- Zod 校验失败 → 同上
- LLM 输出含 `level / safe / dangerous / risk_level` 等违规字段 → reject + audit log + 同上回落

### b. groundMentions — `src/lib/capabilities/queryIntake/groundMentions.ts`

**纯函数，无 LLM**。用 `src/lib/api/slugMappings.ts` 的 alias 表 + L1 fuzzy 把 mention → slug。

**输入**：`IntentResult`（来自 parseIntent）

**输出**：

```ts
interface GroundedMentions {
  ingredientSlugs: string[];          // ['fish-oil', 'coenzyme-q10']
  medicationSlugs: string[];          // ['warfarin']
  conditionSlugs: string[];           // ['gastric-ulcer']
  specialGroupSlugs: string[];        // ['pregnancy']
  ungroundedMentions: Array<{
    raw: string;
    kind: 'ingredient' | 'medication' | 'condition' | 'specialGroup';
    candidates: string[];             // L1 fuzzy 找到的近似 slug，UI 给候选选
  }>;
}
```

**fuzzy 规则**（用现有 `slugMappings.ts` 不够时降级走）：

1. 精确 match alias 表 → 命中 slug
2. 去标点 + 小写 + 简体化后再 match
3. L1 ingredient 字典 `ingredients.ts` 的 `nameZh / nameEn / aliases` 字段 levenshtein ≤2
4. 仍未命中 → `ungroundedMentions`

### c. slotResolver — `src/lib/capabilities/queryIntake/slotResolver.ts`

**纯函数，无 LLM**。基于 intent + grounded 结果，决定要不要 clarify。

```ts
interface SlotDecision {
  shouldClarify: boolean;
  clarifyTopic: 'medication_context' | 'special_group' | 'product_disambiguation' | 'symptom_specificity' | null;
  clarifyChoices: string[];   // 业务规则给候选，LLM 把它们包装成自然问句
  passThrough: LookupRequest | null;  // 不需要 clarify 时直接给 L2
}
```

**决策规则**（P0 写死）：

| Intent | 触发 clarify 的条件 | clarifyTopic | choices 来源 |
|---|---|---|---|
| `product_safety_check` | productMentions 非空 + ingredientMentions 空 → 用户给了商品名但没成分 | `product_disambiguation` | 固定 3 选："拍照配料表 / 手动输入主要成分 / 我不确定" |
| `product_safety_check` | ingredientSlugs 非空 + medicationSlugs / conditionSlugs / specialGroupSlugs 全空 + 高风险 ingredient（warfarin-relevant 列表） | `medication_context` | 来自 `MEDICATION_OPTION_MAP` keys |
| `symptom_goal_query` | symptomMentions 太笼统（"不舒服" / "累"） | `symptom_specificity` | 业务给 4 个常见细分（睡眠 / 精力 / 消化 / 免疫） |
| `unclear` | always | `product_disambiguation` | "你想查的是某个补剂的安全性 / 某个症状能补什么 / 都不是" |

P0 上限 **2 轮 clarify**，超出仍未明朗 → 走 `intent: 'unclear'` 兜底文案。

### d. clarify-style follow-up — `src/lib/capabilities/queryIntake/clarify.ts`

**混合**：business 决定 WHAT/WHEN，LLM 决定 HOW。

如果 slotResolver 给了 `clarifyTopic` 和 `clarifyChoices`，clarify 调用 LLM 包装成自然问句：

```
你是 VitaMe 的友好引导助手。把下面的"主题 + 候选答案"包装成
一句简洁的中文问句（≤25 字）+ 4 个 button label（每个 ≤8 字）。

主题：{{topic}}（如 "用户当前是否在用某些药"）
候选：{{choices}}

输出 JSON：{ "question": "...", "buttonLabels": ["...", "...", ...] }
```

**严禁** LLM 自由发挥添加 choice，schema 锁 `buttonLabels.length === clarifyChoices.length`，不一致 reject + 走模板。

### e. parseIntentFallback — `src/lib/capabilities/queryIntake/fallbacks.ts`

LLM 链路任何异常的兜底文案。3 条固定文案：

1. 完全没听懂："我没听懂你的问题，能换个说法吗？比如『我妈在吃华法林，能吃辅酶 Q10 吗？』"
2. 缺商品名："你想查哪个补剂或成分？可以输入名字，也可以拍照配料表。"
3. 缺关键上下文："为了给出准确判断，能告诉我你目前在吃哪些药吗？（没在吃也告诉我一声）"

### f. P0 4-handler 实现矩阵

7 个 intent，P0 实现 4 个 handler；其余 3 个落到「礼貌告知」fallback：

| Intent | P0 handler | 行为 |
|---|---|---|
| `product_safety_check` | ✅ 主流程 | 拼 LookupRequest → L2 → L3 |
| `symptom_goal_query` | ✅ B-full（v2.8 决策） | 查 `symptom-ingredients.ts` → 候选清单 → 引导对单个候选做二次安全核查 |
| `ingredient_translation` | ✅ 简化版 | 查 L1 `ingredients.ts` 直接吐"是什么、常见形式、参考摄入"，不走 L2 |
| `unclear` | ✅ fallback | parseIntentFallback 文案 1 |
| `photo_label_parse` | ⏳ 走 OCR 链路（已有 `ocrAdapter`） | 同 product_safety_check |
| `contraindication_followup` | ❌ P0 不实现 | 礼貌告知"P0 暂不支持多轮深问，可以重新发起一次完整查询" |
| `profile_update` | ❌ P0 不实现 | 礼貌告知"P0 暂不支持档案改动，可以在档案页手动改" |

---

## Data Flow

**主路径 — 自然语言文本入口**：

1. 前端 `POST /api/query/parse` `{ rawQuery: string, history?: ClarifyTurn[] }`
2. `parseIntent(rawQuery)` → `IntentResult`（LLM + Zod 校验）
3. `groundMentions(IntentResult)` → `GroundedMentions`
4. `slotResolver(IntentResult, GroundedMentions)` → `SlotDecision`
5. **分叉**：
   - `shouldClarify = true` → `clarify(topic, choices)` 包装成自然问句 → 响应 `{ status: 'clarify_needed', question, choices, sessionId }`
   - `shouldClarify = false` → 响应 `{ status: 'ready', lookupRequest, intentSummary, sessionId }`
6. 前端拿到 `lookupRequest` → `POST /api/judgment` 走 L2

**clarify 多轮**：

- 用户答完 → `POST /api/query/parse` 带 `history: [...prevTurns, {topic, userChoice}]`
- 重跑 step 2-5；P0 最多 2 轮，超出强制走 fallback

**症状型 query 子流程**（B-full）：

- step 5 之后若 `intent === 'symptom_goal_query'` 且 grounded → 查 `symptom-ingredients.ts` → 响应 `{ status: 'symptom_candidates', candidates: [{ingredientSlug, evidence, sourceRefs, brief}], sessionId }`
- 用户点某个候选 → 自动以该 ingredient 发起 `product_safety_check` 子查询，进 step 1 重新走

**OCR 路径**（沿用 v2，挂在 `parseIntent` 前）：

1. `POST /api/query/parse` 带 `imageBase64`
2. `ocrAdapter` → 拿 `{ brand, ingredients }` 文本
3. 把 OCR 文本 + 用户原 query 拼成 `parseIntent` 的输入
4. 走主路径 step 2-6

---

## Error Handling

- **parseIntent LLM timeout / 5xx**：30s 内未返 → 走 `parseIntentFallback` 文案 1。审计日志记 `intent_llm_timeout`。
- **parseIntent Zod 校验失败**：同上。Audit `intent_zod_fail` + raw response hash（不存原文）。
- **parseIntent 输出含违规字段（level / safe / dangerous / risk_level / "你应该" / "建议吃"）**：reject + audit `intent_llm_overreach` + 走 fallback。这是 §11.5 + §11.13 红线。
- **groundMentions 全部 unground**（用户输入完全是噪音）→ 走 fallback 文案 1。
- **clarify 已 2 轮仍 unclear**：强制走 fallback 文案 1，附"重新开始"按钮。
- **症状候选数 > 5**：UI 截断到 top 5（`evidenceCount` 排序），多余进"看更多"。
- **症状候选数 == 0**（症状未在 `symptom-ingredients.ts`）：礼貌告知"这个症状超出我们目前的覆盖，建议先就医"，**不**让 LLM 自由发挥推荐。
- **OCR confidence < 0.7**：沿用 v2，回手动输入 tab，CLAUDE.md §9.3 pit 6 红线。
- **OCR + 用户文本都给了**：以 OCR 为主、用户文本作为补充上下文（用户可能在文本里说"我妈正在吃华法林"）。
- **隐私（CLAUDE.md §11.8）**：rawQuery + history 不落盘，仅 sessionId 30 分钟 TTL；audit log 只存 hash。

---

## Testing

强 TDD（CLAUDE.md §13.1 v2.8 新增）。每个子模块至少 1 个 spec：

### 场景 1 — 自然语言 query 命中主路径（之前 v2 翻车的场景）

> 输入："感冒期间可以吃维生素 AD 软胶囊吗？"

- WHEN `parseIntent("感冒期间可以吃维生素 AD 软胶囊吗？")`
- THEN 返回 `{ intent: 'product_safety_check', productMentions: ['维生素 AD 软胶囊'], ingredientMentions: ['维生素 A','维生素 D'], conditionMentions: ['感冒'], ... }`
- AND `groundMentions` 把 ingredientMentions 翻成 `['vitamin-a','vitamin-d']`
- AND `slotResolver` 检查到 conditionSlugs 空（"感冒" 没收录） + ingredientSlugs 命中 → `shouldClarify: false, passThrough: LookupRequest { ingredients: ['vitamin-a','vitamin-d'] }`
- AND 进 L2，返回 `vitamin-a` 在 L1 收录 + 无禁忌命中 → green（v2.8 §10.2 新语义）
- AND **不再返回"证据不足"**

### 场景 2 — 症状型 query（B-full）

> 输入："我最近老觉得累，听说辅酶 Q10 能补一下"

- WHEN `parseIntent(...)`
- THEN `intent: 'symptom_goal_query'`, `symptomMentions: ['疲劳']`, `ingredientMentions: ['辅酶 Q10']`
- AND 走症状候选子流程，返回 `coenzyme-q10` 命中 + 其他可能候选（B12 / 镁 / ...）
- AND 用户点 `coenzyme-q10` → 自动起 `product_safety_check` 子查询

### 场景 3 — clarify 触发（缺药物上下文）

> 输入："辅酶 Q10 现在能吃吗？"

- WHEN parseIntent → `intent: 'product_safety_check'`, ingredientMentions: ['辅酶 Q10'], 其他全空
- AND ground 后 `ingredientSlugs: ['coenzyme-q10']`, medicationSlugs: []
- AND slotResolver 触发 `clarifyTopic: 'medication_context'` （Q10 在高风险列表，因为 vk_like × warfarin）
- AND clarify 包装成 "你目前在吃什么药？" + 4 选（华法林 / SSRI / 降压 / 都没在吃）
- AND 用户点"都没在吃" → 第二轮 parseIntent 拿到 history → passThrough → L2 → green

### 场景 4 — LLM 越权违规

- WHEN LLM 返回 `{ intent: 'product_safety_check', ingredientMentions: ['鱼油'], level: 'green', safe: true }`
- THEN Zod `.strict()` reject（level / safe 不在 schema）
- AND audit log 写 `intent_llm_overreach`
- AND 走 fallback 文案 1

### 场景 5 — grounding 失败 → 选候选

> 输入："Doctor's Best 镁片"

- WHEN parseIntent → `productMentions: ["Doctor's Best 镁片"], ingredientMentions: ['镁']`
- AND groundMentions 把 "镁" → `magnesium`，product 暂无 slug → ungrounded
- AND slotResolver: `passThrough: LookupRequest { ingredients: ['magnesium'] }`（product 没 slug 不阻塞，提示用户"我们查的是镁的安全性，不分形式"）

### 场景 6 — 完全噪音

> 输入："asdfasdfasdf"

- WHEN parseIntent → `intent: 'unclear', clarifyingQuestion: parseIntentFallback()`
- AND 响应 `status: 'clarify_needed'`，question 来自 fallback 文案 1

### 场景 7 — OCR 路径

> 用户拍 Now Foods Magnesium Glycinate 200mg

- WHEN ocrAdapter 返回 `{ brand: 'Now Foods', ingredients: [{name_en: 'Magnesium Glycinate'}], confidence: 0.92 }`
- AND 拼 imageOcrText 进 parseIntent
- AND parseIntent 把 OCR 抽出来的英文成分回译成 "甘氨酸镁" mention → ground 到 `magnesium`
- AND 走主路径 step 5+

---

## v2 → v3 迁移说明

| v2 组件 | v3 处置 |
|---|---|
| `InputNormalizer` | **删**。它的"分隔符拆分 + DSLD 字典映射"职能被 `parseIntent` LLM + `groundMentions` 替代 |
| `ProductMatcher` | **降级为 groundMentions 内部一个 fuzzy 步骤**，不再独立 |
| `IntakeOrchestrator`（"按 ingredient 查 4 道预设题"） | **删**。改为 `slotResolver` 业务规则按需 clarify，最多 2 轮，不强制 4 题 |
| `ContextCollector`（拼答案） | **删**。clarify 答案直接进 `history`，由 parseIntent 二轮重新解析 |
| `QuerySession` | **保留**。仍是 sessionId TTL 管理 |
| `OcrAdapter` | **保留**。挂在 parseIntent 前作输入预处理 |
| `slugMappings.ts`（v2.7 落地的关键词表） | **保留为 groundMentions 的 alias 表**，不再独立做主入口 |

**前端影响**：
- `/intake` 页（4 道固定问答）→ **改为 clarify 气泡式问答**（DESIGN.md §4.7 v2.8 新增）
- `/query` 页输入框保留，placeholder 改为引导自然语言（"问我吧，比如：我妈在吃华法林，能吃辅酶 Q10 吗？"）
