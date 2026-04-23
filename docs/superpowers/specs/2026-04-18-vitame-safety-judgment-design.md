---
title: "VitaMe P0 Design — Safety Judgment"
description: "补剂安全翻译 Agent 规则引擎 + 3 路 adapter 并发 + 风险合并层的设计(全离线烘焙)。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-22"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "safety-judgment", "adapter"]
---

# VitaMe P0 Design — Safety Judgment

## Architecture

Safety Judgment 是 VitaMe 的**价值核心**。它接收 Query Intake 输出的 `QuerySession`,跑一条**确定性为主、LLM 完全不参与**的 pipeline,输出红黄灰绿结构化结果。

工程实现采用 **3 路并发 Adapter 架构**(4-18 锁定):

```
           JudgmentEngine
        ┌───────┼───────┐
        ▼       ▼       ▼
  hardcoded  suppai  ddinter
   Adapter  Adapter  Adapter
     ↓        ↓        ↓
  rule-    suppai-   ddinter-
  Registry interactions drug-drug
  (50 条)   (~1500 条)   (P0 空/P1 ~500)
        └───────┼───────┘
                ▼
          RiskLevelMerger
                ▼
     { overallLevel, risks, partialData }
```

三路 adapter 遵循统一 `LookupRequest → LookupResponse` 签名,都**读离线烘焙产物**(无运行时外部 API)。高风险判定优先走 hardcoded,这是 PRD §10 "高风险规则优先走确定性逻辑,不交给 LLM 自由发挥"的直接实现,也是 CLAUDE.md 红线"禁忌规则(~50 条)硬编码,不可被 Prompt 覆盖"的工程对应。

判定不输出自然语言解释,解释由下游 SafetyTranslation 生成。Safety Judgment 的输出是稳定的、可单元测试的 JSON:`{ overallLevel, risks: Risk[] }`,每条 Risk 含 `{ level, ingredient, condition?, medication?, reason_code, evidence }`。

**3 路 adapter 的选择理由**:保留架构扩展点 + 满足分层(L2 判断层 = 报警器),即使 P0 DDInter 返回空,架构不崩,P1 填充数据即可激活。Merger 对空结果 no-op。

## Components

- **Adapter interface** (`src/types/adapter.ts`):统一契约 `interface SafetyAdapter { name: string; lookup(req: LookupRequest): Promise<LookupResponse> }`,`LookupResponse = { risks: Risk[], partialData: boolean, source: string }`。3 路 adapter 全部实现此接口。
- **RuleRegistry** (`src/lib/judgment/ruleRegistry.ts`):载入 `src/lib/db/contraindications.ts` 的 **50 条**硬编码规则(D2 决策,不砍,见 CLAUDE.md §15.2)。按 `(substanceA.id, substanceB.id)` 二元组建索引,查询 O(1)。每条规则的 schema 以 `src/lib/types/interaction.ts` 中的 `Contraindication` 为准(D2 从 `Interaction` 扩展,增加合规字段 `pharmacistReviewed` / `reviewedAt` / `reviewerName` / `reviewerCredential`)。

  **8 类 Substance 对照表**(D2 新增,对齐 `SubstanceKind` 枚举,用例示例来自 `gpt烘焙方案.md` §2.2):

  | kind | 示例 slug | 典型场景 |
  |---|---|---|
  | `supplement` | `fish-oil` / `magnesium` / `coenzyme-q10` | 规则左侧默认值(substanceA) |
  | `drug` | `warfarin` / `amlodipine` / `metformin` / `levothyroxine` | 药物单药交互 |
  | `drugClass` | `ssri-use` / `antihypertensive-stack` / `diabetes-medications` | 药物大类聚合交互 |
  | `condition` | `kidney-stone-history` / `gastric-ulcer` / `active-hepatitis` / `diarrhea-prone` | 病史/体质 |
  | `gene` | `apoe4` | 基因倾向(Q5) |
  | `specialGroup` | `pregnancy` | 特殊人群(Q18) |
  | `usageTiming` | `coffee-window` / `no-fat-meal` / `bedtime-use` / `iron-window-overlap` | 时序窗口(Q10 / Q13 / Q15) |
  | `usageStrategy` | `polystack-self-start` / `long-term-high-dose` / `single-dose-over-500mg` | 使用策略(Q11 / Q19 / Q20) |
- **HardcodedAdapter** (`src/lib/adapters/hardcodedAdapter.ts`):包装 RuleRegistry 为 Adapter 接口;`source_type = "hardcoded"`。
- **SuppaiAdapter** (`src/lib/adapters/suppaiAdapter.ts`):**读离线烘焙 Map** `src/lib/db/suppai-interactions.ts`(来自 `scripts/bakeSuppai.ts` 从 5.9w 原始条目筛至 ~1500 核心),按 `(ingredient × medication)` 查 Map。O(1) 查找,无网络调用。`source_type = "database"`, `source_ref = "SUPP.AI:<paper_id>"`。
- **DdinterAdapter** (`src/lib/adapters/ddinterAdapter.ts`):**P0 返回空 Risk[]**(架构保留,满足 3 路接口);P1 落地时读 `src/lib/db/ddinter-drug-drug.ts`,查 `(medication × medication)`。`source_type = "database"`, `source_ref = "DDInter:<id>"`。
- **JudgmentEngine** (`src/lib/capabilities/safetyJudgment/judgmentEngine.ts`):pipeline 总入口。`Promise.all([hardcoded, suppai, ddinter])` 并发 3 路,聚合结果。超时阈值 500ms(离线查找通常 <10ms,这个阈值仅作兜底)。
  - **v2.8 新增**：对未被 adapter 命中的 ingredient，调用 `isInKnowledgeBase(slug)` 查 L1 → 命中走 `buildNoKnownRiskRisk`（green）、不命中走 `buildNoDataRisk`（gray）。
- **KnowledgeBaseLookup**（v2.8 新增）(`src/lib/capabilities/safetyJudgment/knowledgeBaseLookup.ts`):`isInKnowledgeBase(slug: string): boolean`。查 L1 四个数据源（`ingredients.ts / cn-dri-values.ts / lpi-values.ts / pubchem-cids.ts`）做 OR；任一命中 → `true`。**不**做 fuzzy（slug 已是 L0 grounding 后的精确值）。
- **RiskLevelMerger** (`src/lib/judgment/riskLevelMerger.ts`):多条 Risk 合并为 `overallLevel`。优先级 `red > yellow > gray > green`,硬编码 > 外部数据源(同 `(ingredient, medication|condition)` 冲突时)。空 adapter 结果 no-op。

**已砍组件**(4-18 决策):
- ~~CacheLayer~~(offline Map 查找 <10ms,LRU 缓存无意义)
- ~~DsldClient~~(DSLD 从"产品库"改"成分字典",职能移至 InputNormalizer,见 query-intake-design)

## Data Flow

1. `JudgmentEngine.judge(querySession)` 入口
2. 解包 `{ ingredients, medications, conditions, allergies, special_groups, genes? }`
3. 构造 `LookupRequest = { ingredients, medications, conditions, allergies, special_groups }`
4. **并发 3 路** `Promise.all([hardcodedAdapter.lookup(req), suppaiAdapter.lookup(req), ddinterAdapter.lookup(req)])`
5. 各路返回 `LookupResponse`:
   - HardcodedAdapter: `Risk[](source: "hardcoded")` + `source_ref: "VitaMe-rule-<id>"`
   - SuppaiAdapter: `Risk[](source: "database")` + `source_ref: "SUPP.AI:<paper_id>"`
   - DdinterAdapter: `Risk[]`(P0 必为空数组;P1 填充)
6. `allRisks = responses.flatMap(r => r.risks)`
7. `RiskLevelMerger.merge(allRisks)`:
   - 按 `(ingredient, medication|condition)` 键分组
   - 同键多条 → 保留最高 level + 标注 `conflicting_sources` 数组
   - 计算 `overallLevel = max(risks.level)`
8. `partialData = responses.some(r => r.partialData)`
9. 返回 `{ overallLevel, risks, partialData }`

## Error Handling

- **离线 Map 查找异常**(应极少发生,数据烘焙时做过完整性校验):adapter 内部 catch,返回 `{ risks: [], partialData: true, error: "..."  }`,不抛到 JudgmentEngine;audit log 记录供后续修复。
- **硬编码 ↔ 数据库冲突**:硬编码优先保留为主 Risk,数据库结果作为 `risk.secondary_evidence` 放 side-car。冲突会写 audit log(供后续规则调校)。
- **Ingredient 在任何 L1 知识库都查不到**(`ingredients.ts` / `cn-dri-values.ts` / `lpi-values.ts` / `pubchem-cids.ts` 全部 miss):level = `gray`,`reasonCode = "no_data"`,`evidence.sourceType = "none"`;UI 文案"未收录到我们的知识库"（CLAUDE.md §10.2 v2.8 红线）。
- **Ingredient 在 L1 知识库收录 + 三路 adapter 全部 no-hit**(已知成分、当前用户上下文下查不到任何禁忌):level = `green`,`reasonCode = "no_known_risk"`,`evidence.sourceType = "knowledge_base_clear"`;UI 文案"已知成分、当前条件下未见风险"（CLAUDE.md §10.2 v2.8 红线）。**这两条必须严格区分**——把"我没收录"和"经检查没问题"混为一谈，等于把"不知道"包装成"有限证据"卖给用户，是产品事故级 bug。
- **判断顺序**：判断引擎先收齐 3 路 adapter 结果 → 对未命中的 ingredient，**先**查 L1 知识库存不存在 → 存在 → green(no_known_risk)；不存在 → gray(no_data)。
- **多 Ingredient 触发多个 red**:全部列出,`overallLevel = red`,不合并成笼统"多重禁忌"。用户需要看到每一条的具体原因。
- **SUPP.AI Map 未命中 (ingredient × medication) 组合**:**不**单独产 Risk（这是局部 no-hit，不是整体判定）。整体判定走上面"L1 in / L1 out"两条规则。Audit log 标 `suppai_no_hit: true` 供后续调校。
- **DDInter P0 返回空**:`{ risks: [], partialData: false }`(注意不是 partial,而是"该来源 P0 未激活");前端不标注降级,但 audit log 标 `ddinter_active: false`。
- **JudgmentEngine 任一 adapter 500ms 超时**:`Promise.race` 兜底,该 adapter 返回空 + `partialData: true`;其他路正常 merge;前端结果页标注"数据源降级"。
- **hardcodedAdapter 全部失败**(极端异常):整个 pipeline 失败,返回 `503`,前端引导重试;不降级返绿色(合规红线)。

## Testing

场景 1 — Q4 真实场景(高风险家人场景,期望 red):

> "妈妈在吃华法林抗凝,她朋友推荐的辅酶 Q10 能吃吗?"

- WHEN `judge({ ingredients: ["辅酶Q10"], medications: ["华法林"] })`
- THEN `HardcodedAdapter` 命中规则 `coQ10_warfarin` → `{ level: "red", source_ref: "VitaMe-rule-coQ10_warfarin" }`
- AND `SuppaiAdapter` 查 Map 命中 → `{ level: "moderate", source_ref: "SUPP.AI:paper_xxx" }`(补强)
- AND `DdinterAdapter` 返回 `[]`(P0 未激活)
- AND `RiskLevelMerger` 合并:hardcoded `red` > suppai `moderate`,保留 hardcoded 为主 + suppai 进 secondary_evidence
- AND `overallLevel = "red"`
- AND `partialData = false`

场景 2 — Q1 真实评论(湖南 2025-08-07,SSRI + 多补剂):

> "在吃 Eva(抗抑郁药)期间可以吃鱼油+维 D+镁+益生菌+维 B+维 C 吗?会不会肝脏代谢不了?"

- WHEN `judge({ ingredients: ["鱼油","维D","镁","益生菌","维B","维C"], medications: ["舍曲林"] })`
- THEN `HardcodedAdapter` 命中 `fishoil_ssri_high_dose` → `level: "yellow"`,`reason_code: "serotonergic_synergy_high_dose"`
- AND `SuppaiAdapter` 命中 B6 × SSRI → `level: "yellow"`,`reason_code: "high_dose_b6_neuropathy"`
- AND 其他 4 项在 HardcodedAdapter + SuppaiAdapter 均未命中 → `green` 或 `gray`
- AND `overallLevel = "yellow"`
- AND `risks.length >= 2`(逐条列出,不笼统)

场景 3 — Q5 真实评论(湖南 01-04,老人 + 精准医学):

> "家里老人有肝炎+脂肪肝,apoe4 基因,可以吃鱼油吗?"

- WHEN `judge({ ingredients: ["鱼油"], conditions: ["肝炎","脂肪肝"], genes: ["apoe4"] })`
- THEN `HardcodedAdapter` 命中 `fishoil_hepatitis_active` → `level: "yellow"`
- AND 附加 note `apoe4_dha_metabolism_variance` 作为 `risk.secondary_evidence`(非独立 Risk)
- AND `overallLevel = "yellow"`
- AND `partialData = false`

场景 4 — Q7 真实场景(胃溃疡 + 氧化镁,期望 yellow):

> "胃溃疡体质,听说镁能助眠但容易腹泻,吃什么形式的?"

- WHEN `judge({ ingredients: [{name:"镁", form:"氧化镁"}], conditions: ["胃溃疡","胃肠敏感"] })`
- THEN `HardcodedAdapter` 命中规则 `mg_oxide_gi_sensitive` → `level: "yellow"`
- AND `reason_code: "poor_absorption_osmotic_diarrhea"`
- AND 若传入"甘氨酸镁"形式,同一 conditions 下 `level: "green"`(形式差异带来等级变化)

场景 5a — 冷门成分（不在 L1 知识库）→ gray:

- WHEN `judge({ ingredients: ["黄金燕窝肽"], medications: [] })`
- THEN `HardcodedAdapter` 未命中 → `[]`
- AND `SuppaiAdapter` Map 未命中 → `[]`
- AND `DdinterAdapter` 返回 `[]`
- AND L1 lookup（`isInKnowledgeBase("黄金燕窝肽")`）→ `false`
- AND `judgmentEngine.buildNoDataRisk` 产出 `{ level: "gray", reasonCode: "no_data", evidence.sourceType: "none" }`
- AND `overallLevel = "gray"`
- AND UI 文案"未收录到我们的知识库"

场景 5b — 已知成分 + 无禁忌（v2.8 新增）→ green:

- WHEN `judge({ ingredients: ["fish-oil"], medications: [], conditions: [] })`
- AND user 没有任何风险上下文（无药、无慢病、无特殊人群）
- THEN `HardcodedAdapter` 未命中 → `[]`（fish-oil 单独无禁忌）
- AND `SuppaiAdapter` 没有 medication 上下文，Map 未命中 → `[]`
- AND L1 lookup（`isInKnowledgeBase("fish-oil")`）→ `true`（NIH/LPI/CnDri 至少有一处收录）
- AND `judgmentEngine.buildNoKnownRiskRisk` 产出 `{ level: "green", reasonCode: "no_known_risk", evidence.sourceType: "knowledge_base_clear" }`
- AND `overallLevel = "green"`
- AND UI 文案"已知成分、当前条件下未见风险"，附 L1 source ref（"基于 NIH ODS Fact Sheet"）

场景 5c — 已知成分 + 部分上下文 + suppai/hardcoded 无命中 → green:

- WHEN `judge({ ingredients: ["vitamin-d"], conditions: ["high-blood-pressure"], medications: [] })`
- AND HardcodedAdapter 没有 vitamin-d × hypertension 规则 → `[]`
- AND SuppaiAdapter 没 medication context，Map 未命中 → `[]`
- AND L1 lookup vitamin-d → `true`
- AND 同 5b：返 `green`，但 UI 文案附 "你提到了高血压，目前我们没有 vitamin-d × 高血压的禁忌规则；如有疑虑请咨询医生"

场景 6 — DDInter P0 vs P1 行为一致性:

- WHEN P0 阶段 `judge({ ingredients: ["鱼油"], medications: ["华法林","阿司匹林"] })`
- THEN `DdinterAdapter.lookup` 返回 `{ risks: [], partialData: false }`
- AND `HardcodedAdapter` 命中"鱼油+抗凝"规则 → `level: "red"`
- AND `overallLevel = "red"`(不因 DDInter 空而降级)
- AND P1 激活 DDInter 后,同输入应返回相同 `overallLevel` + `risks.length` 增加(新增药×药 Risk)
