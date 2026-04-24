---
title: "VitaMe P0 用户上下文分类法"
description: "定义 P0 查询阶段允许采集哪些上下文、如何分类、什么情况下问、什么情况下不问。"
doc_type: "taxonomy"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["product", "taxonomy", "context", "p0", "intake"]
source_docs:
  - "docs/product/VitaMe-P0-统一执行总纲.md"
  - "docs/product/VitaMe-补剂安全翻译Agent-P0-PRD.md"
  - "docs/product/VitaMe-补剂安全翻译Agent-User-Journey.md"
  - "docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md"
purpose: "为 Query Intake 和 UI 提供统一上下文字段字典、提问策略、跳问规则和 P0 边界。"
---

# VitaMe — P0 用户上下文分类法

> 日期：2026-04-20  
> 状态：Draft  
> 目标：把“只问 2–4 个必要问题”从原则变成可执行规则。

---

## 1. 这份文档解决什么问题

当前文档已经明确：

- 只能问最少必要问题
- 不能把体验做成开放式问诊
- 查询必须优先完成一次具体决策

但如果没有统一分类法，工程会出现 4 个问题：

1. 同一输入每次追问不一致
2. 高风险场景漏问关键字段
3. 低风险场景问太多，打断体验
4. 前端字段、后端字段、档案字段三套命名漂移

因此，本文件是 **Query Intake 的上游契约**。

---

## 2. P0 的上下文设计原则

1. **只采集会改变风险判断的信息**
2. **优先问可枚举、可结构化、可保存的信息**
3. **能复用档案就不重复问**
4. **不问开放式症状，不进入诊断链路**
5. **缺信息时允许降级为灰色，不为凑完整而过问**

---

## 3. P0 的四类上下文

### A. 必要上下文（Core Context）

没有它就无法做有意义判断，或大概率会误判。

- 当前在用药物 `medications`
- 已知病史 / 风险标签 `conditions`
- 特殊人群属性 `specialGroups`
- 当前查询项 `ingredients / product`

### B. 条件触发上下文（Conditional Context）

仅在命中某类 ingredient / risk pattern 时才问。

- 剂量区间 `doseBand`
- 服用目的 `usageGoal`
- 服用时间 / 是否空腹 `timing`
- 是否已经在吃同类补剂 `existingSupplements`

### C. 可选上下文（Optional Context）

记录了更好，但不是首轮判断前置条件。

- 过敏 `allergies`
- 年龄段 `ageBand`
- Person 标签 `self / mom / dad / other`
- 最近一次相关判断时间 `lastCheckedAt`

### D. 明确禁问（Forbidden in P0）

- 开放式症状描述
- 近期详细体检结果
- 诊断过程相关问题
- 生活方式、饮食、睡眠完整画像
- 情绪、压力、精神状态
- 基因检测详情

---

## 4. 统一数据对象

## 4.1 QuerySession.context

```ts
type QueryContext = {
  medications: MedicationEntry[];
  conditions: ConditionTag[];
  allergies: AllergyTag[];
  specialGroups: SpecialGroupTag[];
  doseBand?: DoseBand | null;
  timing?: TimingTag | null;
  existingSupplements?: IngredientRef[];
};
```

## 4.2 Person

```ts
type Person = {
  personId: string;
  label: "self" | "mom" | "dad" | "other";
  customLabel?: string;
  conditions: ConditionTag[];
  medications: MedicationEntry[];
  allergies: AllergyTag[];
  specialGroups: SpecialGroupTag[];
  savedQueries: ArchiveEntryRef[];
};
```

### 设计规则

- `QueryContext` 是一次查询的临时工作区
- `Person` 是可沉淀、可复用的长期上下文壳
- `QueryContext` 中允许存在临时字段
- `Person` 中只保留结构化、低歧义字段

---

## 5. 字段优先级与提问策略

| 字段 | 类型 | 是否默认问 | 何时问 | 何时跳过 | 是否保存到 Person |
|------|------|------------|--------|----------|-------------------|
| `ingredients` | array | 是 | 一切查询起点 | 无 | 以 archive entry 保存 |
| `medications` | array | 条件必问 | 命中可能有交互的成分；或用户主动提到“在吃药” | Person 已有且本次未变 | 是 |
| `conditions` | array | 条件必问 | 命中病史相关规则；或用户主动提到结石/胃病/高血压等 | Person 已有且本次未变 | 是 |
| `specialGroups` | array | 条件必问 | 孕期/哺乳/备孕/老年/儿童相关高风险时 | 不适用人群且规则未命中 | 是 |
| `allergies` | array | 可选 | 与常见辅料或海鲜/乳制品来源相关时 | 首轮不影响结果时 | 是 |
| `doseBand` | enum | 条件问 | 风险与高剂量或剂量区间直接相关时 | 当前只能做“成分级初筛”时 | 否 |
| `timing` | enum | 条件问 | 风险与空腹/同服/间隔相关时 | 当前结果已能落红或灰 | 否 |
| `existingSupplements` | array | 条件问 | 用户在“新增一项复查”场景时 | 首次单品查询 | 可由 archive 派生 |
| `usageGoal` | enum | 可选 | 仅用于解释和排序，不影响 level | P0 默认跳过 | 否 |

---

## 6. 标准枚举（P0 版本）

## 6.1 ConditionTag

P0 不追求医学全量，而是先做高价值安全标签。

```ts
type ConditionTag =
  | "kidney_stone_history"
  | "hypertension"
  | "hypotension"
  | "peptic_ulcer_or_gastritis"
  | "liver_disease"
  | "kidney_disease"
  | "thyroid_disorder"
  | "diabetes"
  | "bleeding_risk"
  | "osteoporosis"
  | "gout_or_hyperuricemia"
  | "unknown_other";
```

### 约束

- UI 只展示中文标签，不暴露英文 code
- 用户自由输入先映射，映射失败再落 `unknown_other`
- `unknown_other` 不得直接触发红色，只能作为解释补充或转灰

## 6.2 SpecialGroupTag

```ts
type SpecialGroupTag =
  | "pregnant"
  | "trying_to_conceive"
  | "breastfeeding"
  | "child"
  | "older_adult";
```

## 6.3 AllergyTag

```ts
type AllergyTag =
  | "seafood"
  | "dairy"
  | "soy"
  | "gelatin"
  | "unknown_other";
```

## 6.4 MedicationEntry

```ts
type MedicationEntry = {
  rawName: string;
  canonicalName?: string | null;
  code?: string | null;
  confidence: "high" | "medium" | "low";
};
```

### 原则

- 前台允许 `rawName`
- 后台尽量映射到 `canonicalName`
- 映射失败也要保留原始字符串，不可吞掉

---

## 7. 提问路由规则

## 7.1 基础路由

### Route A：低风险单品快速路由

适用：

- 用户只输入一个补剂
- 当前未命中药物交互强规则
- 未命中特殊人群强规则

提问上限：**最多 2 题**

推荐顺序：

1. 你现在有没有长期在吃药？
2. 有没有这些会影响判断的情况：结石 / 胃病 / 高血压 / 甲状腺问题 / 肝肾问题？

### Route B：药物冲突优先路由

适用：

- ingredient 命中已知 interaction list
- 用户输入里直接提到某药物

提问上限：**最多 3 题**

推荐顺序：

1. 你现在在吃哪些药？
2. 这是准备购买，还是已经在吃？
3. 是否属于孕期/哺乳/老年人等特殊人群？

### Route C：人群高风险优先路由

适用：

- 孕期 / 哺乳 / 儿童 / 老年规则直接相关
- 某些脂溶性维生素或草本成分命中强限制

提问上限：**最多 3 题**

推荐顺序：

1. 是否属于以下特殊人群？
2. 是否正在服用相关药物？
3. 是否已有相关基础疾病？

### Route D：档案复查路由

适用：

- 用户从 `/archive` 给某 Person 新增一项
- 已知该 Person 的 `conditions` / `medications` / `specialGroups`

提问上限：**最多 2 题**

推荐顺序：

1. 这次新增的是哪一项？
2. 若命中剂量/时序相关规则，再补问一题

---

## 8. 何时必须跳问

### 档案已知 → 必须跳

如果 `personRef` 已带入，且字段非空：

- 不重复问 `conditions`
- 不重复问 `medications`
- 不重复问 `specialGroups`

除非用户主动点“修改已知信息”。

### 已能判红 → 优先停止追问

如果已经命中**明确高风险红色规则**，则：

- 立即出结果
- 后续最多只补 1 个解释增强问题
- 不得为了“信息完整”继续追问 4–5 题

### 无码据场景 → 允许转灰，不强凑

当以下情况出现时，可直接转灰：

- ingredient 未能标准化
- 药物未能 canonicalize
- 当前规则与白名单数据均未覆盖
- 用户拒绝继续补充上下文

---

## 9. P0 的“问题模板白名单”

P0 前端可直接调用的问题模板必须来自固定白名单，而不是 LLM 即兴生成。

### 白名单模板

1. **你现在有没有长期在吃药？**
2. **有没有这些会影响判断的情况？**
3. **是否属于孕期、哺乳期、备孕、儿童或老年人？**
4. **这是准备买，还是已经在吃？**
5. **你现在吃的这类补剂，大概属于低剂量还是高剂量？**
6. **这类补剂你通常是空腹吃，还是饭后吃？**
7. **家里这个人之前已经在吃哪些补剂？**

### P0 不允许的提问样式

- “最近哪里不舒服？”
- “你把全部体检指标发我看看”
- “你主要想改善什么症状？”
- “最近睡眠、饮食、压力如何？”
- “请详细描述你的身体状况”

---

## 10. 上下文缺失时的降级策略

| 缺失项 | 处理方式 | 是否阻断 |
|--------|----------|----------|
| `medications` 不明 | 允许先给初筛结果；若该成分药物交互敏感，则提示“若在用药，请补充后复查” | 不阻断 |
| `conditions` 不明 | 允许先给初筛结果；若命中病史规则则转灰或补问 | 不阻断 |
| `specialGroups` 不明 | 若命中相关人群高风险时，补问优先级升高 | 可条件阻断 |
| `doseBand` 不明 | 结果可先落黄或灰，并说明“剂量会改变判断” | 不阻断 |
| ingredient 无法识别 | 直接转灰，提示手动输入标准成分 | 阻断 |

---

## 11. 存储规则

### 保存到 Person 的字段

- `conditions`
- `medications`
- `allergies`
- `specialGroups`

### 不保存到 Person 的字段

- `doseBand`
- `timing`
- `usageGoal`

原因：

这些字段更像“这一次”的判断上下文，而不是稳定的人物画像。

---

## 12. 典型例子

### 例 1：首次单品查询

用户输入：`Doctor's Best Magnesium`

系统路由：

1. 识别 `Magnesium`
2. 问：长期在吃药吗？
3. 问：有没有胃病 / 结石 / 肾病等？
4. 输出结果

### 例 2：给妈妈新增一项

用户进入 `mom` 档案，已有：

- `hypertension`
- `medications = [amlodipine]`

新增：`Fish Oil`

系统路由：

1. 不再问高血压和在用药
2. 直接跑复查
3. 若命中 bleeding / antihypertensive caution，再决定是否补问剂量

---

## 13. 一句话结论

**P0 的正确做法不是“多问一点更聪明”，而是“只问会改变判定的字段，其他统统别问”。**
