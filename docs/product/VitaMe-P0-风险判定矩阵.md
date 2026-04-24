---
title: "VitaMe P0 风险判定矩阵"
description: "定义红黄灰绿的判定标准、证据层级、合并规则、默认 CTA 和边界处理。"
doc_type: "decision_matrix"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["product", "risk", "decision-matrix", "p0", "judgment"]
source_docs:
  - "docs/product/VitaMe-P0-统一执行总纲.md"
  - "docs/product/VitaMe-P0-用户上下文分类法.md"
  - "docs/product/VitaMe-补剂安全翻译Agent-P0-PRD.md"
  - "docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md"
  - "docs/superpowers/specs/2026-04-18-vitame-compliance-design.md"
purpose: "作为 Safety Judgment / Translation / Compliance / QA 共同依赖的判定基线。"
---

# VitaMe — P0 风险判定矩阵

> 日期：2026-04-20  
> 状态：Draft  
> 目标：把红黄灰绿从“理念”变成“规则”。

---

## 1. 基本原则

1. **先判断风险，再做翻译**
2. **高风险优先确定性规则**
3. **证据不足时要诚实落灰**
4. **未发现已知高风险，不等于绝对安全**
5. **结果必须带 level、reasonCode、evidence、cta**

---

## 2. 输出对象

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
```

```ts
type JudgmentResult = {
  overallLevel: "red" | "yellow" | "gray" | "green";
  risks: Risk[];
  partialData: boolean;
  partialReason?: string | null;
};
```

---

## 3. 四级定义

## 3.1 红色（Red）

### 定义

存在**明确已知高风险**，继续服用或在缺乏专业确认下购买，可能带来显著安全问题。

### 典型触发

- 明确的药物-补剂禁忌或强交互
- 特殊人群强禁忌（如孕期禁用类）
- 明确病史禁忌（如某些肾病 / 出血风险 / 严重肝病）
- 已命中硬编码规则库中的强拦截规则

### 默认 CTA

`stop_and_consult`

### 默认话术边界

- 可以说：**不建议自行继续 / 建议先咨询医生或药师**
- 不可以说：**你已经出问题 / 你患有某病 / 这是医疗结论**

---

## 3.2 黄色（Yellow）

### 定义

存在**已知注意事项或中等风险**，不一定绝对禁用，但需要注意剂量、时序、适用人群或与其他项目同服的问题。

### 典型触发

- 可能影响吸收、刺激性、耐受性
- 与现有用药或病史存在注意点，但非强禁忌
- 同类补剂叠加造成“可能过量 / 重复摄入”
- 与空腹 / 饭后 / 同服时机有关

### 默认 CTA

`proceed_with_caution` 或 `consult_if_needed`

---

## 3.3 灰色（Gray）

### 定义

当前证据不足、规则未覆盖或关键上下文缺失，无法给出可靠结论。

### 典型触发

- ingredient / drug 无法标准化
- 数据源未覆盖该产品或成分
- 用户拒绝提供关键上下文
- 文献证据稀薄且方向不一致
- 某条风险理论上可能存在，但当前无法形成可靠判断

### 默认 CTA

`recheck_with_more_context`

### 核心边界

灰色不是“安全”，而是**“我现在不能负责任地说安全”**。

---

## 3.4 绿色（Green）

### 定义

在 **P0 已覆盖的数据源与规则范围内**，未发现明确高风险或强注意事项。

### 适用前提

- ingredient 已识别
- 关键上下文已满足最低判断要求
- 未命中已知红黄规则

### 默认 CTA

`basic_ok`

### 结果页必须补一句

**当前未发现已知高风险，仍建议按标签和专业建议使用。**

---

## 4. 证据层级

### 4.1 结论强度（用户可见）

| 结论强度 | 说明 | UI 建议 |
|----------|------|---------|
| High | 硬编码规则或多源一致支持 | 直出，不弱化 |
| Medium | 数据库或成熟规则支持，但上下文仍可能影响 | 出结果并提示条件 |
| Low | 依据有限，解释需保守 | 更偏提醒 |
| Unknown | 仅知道“当前不能可靠判断” | 落灰 |

### 4.2 依据类型（用户可见）

| evidenceType | 含义 |
|--------------|------|
| `hardcoded_rule` | 经审核冻结的强规则 |
| `database` | 结构化数据库命中 |
| `literature` | 文献或次级资料支持 |
| `limited` | 有零散信息但不足以形成稳结论 |
| `none` | 当前没有可靠覆盖 |

---

## 5. 判定维度

P0 的风险维度统一收口为 6 类：

1. `drug_interaction` — 药物交互
2. `condition_contra` — 病史/体质禁忌
3. `population_caution` — 特殊人群注意
4. `dose_caution` — 剂量或叠加注意
5. `form_difference` — 成分形式差异导致的安全或耐受差异
6. `coverage_gap` — 数据覆盖缺口 / 无法判断

---

## 6. level 判定规则

## 6.1 单条 Risk 生成规则

| 条件 | 单条 level |
|------|------------|
| 命中强禁忌 / 高风险规则 | red |
| 命中已知注意事项 / 条件性风险 | yellow |
| 命中形式差异但主要影响耐受、吸收或适配 | yellow |
| 无法识别 / 关键信息缺失 / 数据无覆盖 | gray |
| 已覆盖且未命中已知风险 | green |

## 6.2 overallLevel 合并规则

按最高风险优先：

**red > yellow > gray > green**

### 额外规则

1. 只要存在任一 `red`，`overallLevel = red`
2. 不存在 red，但存在 yellow，`overallLevel = yellow`
3. 只有 gray 和 green 并存时，`overallLevel = gray`
4. 全部 green 才能 overall green
5. 若 `partialData = true` 且核心判断依赖字段缺失，则 green 不可直接输出，至少降为 gray

---

## 7. partialData 规则

### `partialData = true` 的典型情况

- 产品名识别到了，但主要成分未识别清
- 用户说“在吃降压药”，但未能识别是哪种药
- 需要知道是否孕期 / 哺乳，但用户跳过
- 该产品只有营销名，没有足够成分信息

### 降级原则

- 若缺失信息会显著改变结论：降灰
- 若缺失信息不影响已命中的红色规则：仍可保留红色
- 若缺失信息只会影响黄色细节：可先给黄色并提示补充复查

---

## 8. CTA 映射规则

| overallLevel | 默认 CTA | 页面主按钮 |
|--------------|----------|------------|
| red | `stop_and_consult` | 咨询医生/药师前先别继续 |
| yellow | `proceed_with_caution` / `consult_if_needed` | 看注意事项 / 保存并复查 |
| gray | `recheck_with_more_context` | 补充信息后再查 |
| green | `basic_ok` | 保存本次结果 |

### CTA 设计原则

- CTA 是下一步动作，不是夸大恐吓
- 不出现“立即治疗”“必须服药”等医疗导向用语
- 红色也不直接等于“已经出事”，只等于“不建议自行继续”

---

## 9. 示例矩阵

| 示例 | 条件 | 期望 level | 理由 |
|------|------|-------------|------|
| 鱼油 + 华法林 | 明确高风险交互 | red | 属于强交互 |
| 氧化镁 + 胃肠敏感 | 形式差异导致耐受风险 | yellow | 不是绝对禁用，但需注意 |
| 某海外小众草本，无规则无数据库 | 覆盖缺口 | gray | 不能装懂 |
| 常规镁补充，未命中交互 / 病史规则 | 当前范围内无已知风险 | green | 仍要保留边界句 |

---

## 10. P0 的 reasonCode 管理规则

### 原则

- `reasonCode` 数量可控，优先覆盖高频风险
- 不允许 LLM 现场发明新的核心 reasonCode
- 高频 code 必须有模板翻译兜底

### 推荐首批范围

- `DRUG_INTERACTION_MAJOR`
- `DRUG_INTERACTION_CAUTION`
- `CONDITION_KIDNEY_STONE_CAUTION`
- `CONDITION_GASTRIC_IRRITATION_CAUTION`
- `POPULATION_PREGNANCY_AVOID`
- `FORM_OXIDE_VS_GLYCINATE_TOLERANCE`
- `DOSE_DUPLICATE_INTAKE_CAUTION`
- `INSUFFICIENT_DATA_PRODUCT`
- `INSUFFICIENT_CONTEXT_MEDICATION`
- `NO_KNOWN_RISK_IN_CURRENT_SCOPE`

---

## 11. 常见误判与防呆

### 误判 1：未命中规则就输出绿

禁止。必须确认：

- ingredient 已识别
- 关键上下文满足最低要求
- 当前不是覆盖缺口

否则应该灰。

### 误判 2：只因“用户有病史”就全红

禁止。病史必须与 ingredient 有具体关系，不能泛化恐吓。

### 误判 3：把“形式差异”一律视为科普项

不对。当形式差异会改变刺激性、吸收性、耐受性时，应进入黄色。

### 误判 4：灰色文案写成“应该没事”

禁止。灰色只能表达“当前无法可靠判断”。

---

## 12. 一句话结论

**红黄灰绿不是页面装饰，而是产品可信度的骨架；其中最关键的一条是：不知道，就老老实实说不知道。**
