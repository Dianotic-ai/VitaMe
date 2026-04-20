下面按你锁定的口径展开，且我按**真实类型契约**来写，不沿用旧草稿：

* `Ingredient` 必须有 `forms[]`、`contraindicationIds`、且 `sourceRefs` 不能为空；
* `Contraindication` 是 `Interaction` 子集，只能 `red|yellow`，并带 `pharmacistReviewed / reviewedAt / reviewerName`；
* 硬编码 vs SUPP.AI 冲突时，要落到 `Risk.secondaryEvidence[] + conflictingSources[]`；
* `SourceRef.source` 只能用小写连字符的 12 个枚举。   

下面方案也严格以 20 条种子题为边界：Q1–Q20 的色级分布、场景重心、以及 Q4/Q5/Q6/Q16/Q20 这些高 Demo 价值题，都是这次烘焙范围的主约束。

---

## §1. 成分清单（30 个 `Ingredient.id`）

口径先锁死：

* **判定主语优先**：`magnesium`、`vitamin-d`、`fish-oil` 这种做 `Ingredient.id`
* **form 不升格成 id**：D3、EPA-rich、glycinate 都进 `forms[]`
* **但为了 Q10/Q11/Q19/Q20 的“堆栈/长期服用/起始补法”解释层**，保留一组“低频但仍在 20 题覆盖内”的基础营养素 id，用于 OCR/L3 翻译与产品映射，不额外扩到种子题外

### 1.1 30 个核心 id 总表

| #  | `Ingredient.id`             |           中文 | 覆盖种子题                | `forms 候选`                                                                                                    | NIH Fact Sheet | LPI monograph |
| -- | --------------------------- | -----------: | -------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- | ------------- |
| 1  | `fish-oil`                  | 鱼油 / Omega-3 | Q1 Q2 Q5 Q10 Q17 Q19 | `[triglyceride, ethyl-ester, re-esterified-triglyceride, phospholipid, epa-dominant, dha-dominant, balanced]` | Yes            | Yes           |
| 2  | `vitamin-d`                 |         维生素D | Q1 Q6 Q10 Q18 Q19    | `[d2, d3]`                                                                                                    | Yes            | Yes           |
| 3  | `calcium`                   |            钙 | Q6 Q9 Q11 Q13 Q14    | `[carbonate, citrate, malate]`                                                                                | Yes            | Yes           |
| 4  | `vitamin-c`                 |         维生素C | Q1 Q6 Q10            | `[ascorbic-acid, sodium-ascorbate, calcium-ascorbate, liposomal]`                                             | Yes            | Yes           |
| 5  | `magnesium`                 |            镁 | Q1 Q7 Q10 Q16        | `[oxide, citrate, glycinate, threonate]`                                                                      | Yes            | Yes           |
| 6  | `coenzyme-q10`              |        辅酶Q10 | Q3 Q4                | `[ubiquinone, ubiquinol]`                                                                                     | No             | Yes           |
| 7  | `probiotic`                 |          益生菌 | Q1 Q10 Q19           | `[lactobacillus, bifidobacterium, saccharomyces-boulardii]`                                                   | No             | No            |
| 8  | `vitamin-b-complex`         |         维B复合 | Q1 Q10 Q11 Q13       | `[balanced-b-complex, high-b6, high-b12]`                                                                     | No             | No            |
| 9  | `vitamin-b6`                |        维生素B6 | Q1 Q13               | `[pyridoxine-hcl, p-5-p]`                                                                                     | Yes            | Yes           |
| 10 | `chromium`                  |            铬 | Q8                   | `[picolinate, chloride, nicotinate]`                                                                          | Yes            | Yes           |
| 11 | `cinnamon`                  |           肉桂 | Q8                   | `[cassia, ceylon, extract]`                                                                                   | No             | No            |
| 12 | `iron`                      |            铁 | Q15 Q19              | `[ferrous-bisglycinate, ferrous-sulfate, ferrous-fumarate]`                                                   | Yes            | Yes           |
| 13 | `zinc`                      |            锌 | Q19                  | `[gluconate, picolinate, citrate]`                                                                            | Yes            | Yes           |
| 14 | `vitamin-b12`               |       维生素B12 | Q10 Q19 Q20          | `[cyanocobalamin, methylcobalamin, adenosylcobalamin]`                                                        | Yes            | Yes           |
| 15 | `folate`                    |           叶酸 | Q18 Q19 Q20          | `[folic-acid, methylfolate]`                                                                                  | Yes            | Yes           |
| 16 | `biotin`                    |          生物素 | Q10 Q19 Q20          | `[d-biotin]`                                                                                                  | Yes            | Yes           |
| 17 | `thiamin`                   |        维生素B1 | Q10 Q13 Q20          | `[thiamine-hcl, benfotiamine]`                                                                                | Yes            | Yes           |
| 18 | `riboflavin`                |        维生素B2 | Q10 Q13 Q20          | `[riboflavin, riboflavin-5-phosphate]`                                                                        | Yes            | Yes           |
| 19 | `niacin`                    |        维生素B3 | Q10 Q13 Q19 Q20      | `[niacinamide, nicotinic-acid, inositol-hexanicotinate]`                                                      | Yes            | Yes           |
| 20 | `pantothenic-acid`          |        维生素B5 | Q10 Q20              | `[calcium-pantothenate, pantethine]`                                                                          | Yes            | Yes           |
| 21 | `vitamin-a`                 |         维生素A | Q18 Q19              | `[retinyl-acetate, retinyl-palmitate, beta-carotene]`                                                         | Yes            | Yes           |
| 22 | `vitamin-e`                 |         维生素E | Q19                  | `[d-alpha-tocopherol, dl-alpha-tocopherol, mixed-tocopherols]`                                                | Yes            | Yes           |
| 23 | `vitamin-k`                 |         维生素K | Q4 Q19               | `[k1, mk-4, mk-7]`                                                                                            | Yes            | Yes           |
| 24 | `selenium`                  |            硒 | Q19 Q20              | `[selenomethionine, sodium-selenite]`                                                                         | Yes            | Yes           |
| 25 | `iodine`                    |            碘 | Q9 Q18 Q20           | `[potassium-iodide, kelp]`                                                                                    | Yes            | Yes           |
| 26 | `copper`                    |            铜 | Q19 Q20              | `[gluconate, bisglycinate]`                                                                                   | Yes            | Yes           |
| 27 | `manganese`                 |            锰 | Q19 Q20              | `[gluconate, sulfate, citrate]`                                                                               | Yes            | Yes           |
| 28 | `choline`                   |           胆碱 | Q18 Q20              | `[bitartrate, phosphatidylcholine, alpha-gpc]`                                                                | Yes            | Yes           |
| 29 | `vitamin-b1-b2-b3-stack`    |      维B基础能量组 | Q10 Q11 Q20          | `[balanced-energy-stack]`                                                                                     | No             | No            |
| 30 | `multivitamin-mineral-base` |      多维矿基础底座 | Q11 Q19 Q20          | `[general-adult, women, senior]`                                                                              | No             | No            |

### 1.2 说明

1. **真正要进 L2 判定核心的只有前 13 个 + `vitamin-k`**。后面的条目主要服务：

   * Q10/Q11/Q19/Q20 的时间表、长期服用、起始补法；
   * OCR 后品牌产品向基础营养素映射；
   * `bakePubchem.ts` 按 `forms 候选` 拉 `pubchemCid`，满足你追加的 CID 需求。
2. `IngredientForm.pubchemCid` 是类型契约里明确预留的，`bakePubchem.ts` 正是给这个字段填值。
3. NIH ODS 目前对镁、钙、铁、维D、Omega-3 等都有 Health Professional Fact Sheet；LPI 的 MIC 目前对多种维生素、矿物质及 CoQ10 等 dietary factor 都有单独页面。PubChem 提供标准 PUG REST 接口，DSLD 现有 v9 API。([膳食补充剂办公室][1])

---

## §2. 禁忌清单（50 条 `Contraindication`）

### 2.1 先锁实现边界

* 这 50 条都是**人工硬编码**，不是 LLM 推导。
* 类型上它们必须是 `Contraindication extends Interaction`，因此只能落到 `red|yellow`，并带 `pharmacistReviewed` 等字段。
* 若运行时某条硬编码与 SUPP.AI 冲突，例如 hardcoded=`red`、SUPP.AI=`yellow`：

  * 主 Risk 保留硬编码；
  * SUPP.AI 落 `secondaryEvidence[]`；
  * 冲突源写入 `conflictingSources[]`；
    这正好对应 `Risk` 真实契约。

### 2.2 50 条规则表

> 表里“外部证据 URL”我用**来源页名**表示；工程实现时，写入 `sourceRef.url` 即可。
> 另外，Q13/Q14/Q15 这类“咖啡/绿茶/牛奶”不是典型病史，但可以编码成 `condition` 风格上下文 slug，例如 `coffee-window`、`green-tea-window`，不需要改类型。

| #  | `id`                                        | substanceA        | substanceB                | sev    | reasonCode                                | reason                      | 种子题     | 外部证据页                 | 药剂师审核要点                        |
| -- | ------------------------------------------- | ----------------- | ------------------------- | ------ | ----------------------------------------- | --------------------------- | ------- | --------------------- | ------------------------------ |
| 1  | `vm-rule-fishoil-ssri-highdose`             | fish-oil          | ssri-use                  | yellow | `serotonergic_synergy_high_dose`          | 高剂量鱼油与 SSRI 并用需警惕出血/5-HT 协同 | Q1      | ODS Omega-3 + SUPP.AI | 先核 doseThreshold 是否仅在 >3g/天触发  |
| 2  | `vm-rule-b6-ssri-highdose`                  | vitamin-b6        | ssri-use                  | yellow | `b6_high_dose_neuro_risk`                 | 高剂量 B6 不建议与 SSRI 长期混用       | Q1      | NIH B6                | 核长期剂量阈值是否写死 50mg/天             |
| 3  | `vm-rule-fishoil-amlodipine`                | fish-oil          | amlodipine                | yellow | `bp_lowering_additive`                    | 与降压药同用可能叠加降压                | Q2      | ODS Omega-3           | 首周监测血压频率怎么写                    |
| 4  | `vm-rule-fishoil-antihypertensive-stack`    | fish-oil          | antihypertensive-stack    | yellow | `bp_lowering_additive_polypharmacy`       | 多种降压药并用时更需监测                | Q2      | ODS Omega-3           | 适用药物集合要收敛                      |
| 5  | `vm-rule-coq10-warfarin`                    | coenzyme-q10      | warfarin                  | red    | `vitamin_k_like_effect`                   | 可能降低华法林抗凝效果                 | Q4      | LPI CoQ10             | 是否要求 INR 监测提示                  |
| 6  | `vm-rule-fishoil-warfarin`                  | fish-oil          | warfarin                  | yellow | `bleeding_risk_anticoagulant`             | 抗凝药并用需警惕出血风险                | Q4 Q10  | ODS Omega-3           | 是否上调为 red，不建议；我这里保留 yellow     |
| 7  | `vm-rule-vitamink-warfarin`                 | vitamin-k         | warfarin                  | yellow | `antagonize_warfarin`                     | 维K相关补充会影响 INR 稳定性           | Q4 Q19  | NIH vitamin K         | K1/MK-7 是否分开提醒                 |
| 8  | `vm-rule-fishoil-active-hepatitis`          | fish-oil          | active-hepatitis          | yellow | `hepatic_monitoring_needed`               | 肝炎活动期需先看 AST/ALT 与凝血功能      | Q5      | ODS Omega-3           | 是否要求“先复查肝功再补”                  |
| 9  | `vm-rule-fishoil-coagulopathy`              | fish-oil          | coagulation-abnormality   | yellow | `bleeding_risk_liver_context`             | 凝血异常背景下鱼油需谨慎                | Q5      | ODS Omega-3           | PT/INR 提示是否写入                  |
| 10 | `vm-rule-fishoil-apoe4-dhaheavy`            | fish-oil          | apoe4                     | yellow | `form_selection_gene_context`             | APOE4 背景下优先避免盲目高 DHA 配方     | Q5 Q17  | ODS Omega-3           | 这是“形式限制”不是绝对禁用                 |
| 11 | `vm-rule-vitd-kidneystone`                  | vitamin-d         | kidney-stone-history      | yellow | `stone_risk_hypercalciuria`               | 促钙吸收，结石体质需控剂量               | Q6      | ODS Vitamin D         | 是否附 25(OH)D 复查提示               |
| 12 | `vm-rule-calcium-kidneystone`               | calcium           | kidney-stone-history      | yellow | `stone_risk_total_calcium_load`           | 结石体质避免额外高钙负荷                | Q6      | ODS Calcium           | 食补优先是否写入                       |
| 13 | `vm-rule-vitc-kidneystone-highdose`         | vitamin-c         | kidney-stone-history      | yellow | `oxalate_stone_risk`                      | 高剂量维C增加草酸盐负担                | Q6      | NIH Vitamin C         | 阈值锁 500mg/天还是 1g/天             |
| 14 | `vm-rule-magnesium-oxide-gastriculcer`      | magnesium         | gastric-ulcer             | yellow | `poor_absorption_osmotic_diarrhea`        | 氧化镁刺激性强、易腹泻                 | Q7      | ODS Magnesium         | 必须限定 form=oxide                |
| 15 | `vm-rule-magnesium-oxide-gi-sensitive`      | magnesium         | gastric-sensitivity       | yellow | `gi_irritation_form_specific`             | 胃肠敏感人群不优先氧化镁                | Q7 Q16  | ODS Magnesium         | 是否建议换 glycinate/threonate      |
| 16 | `vm-rule-magnesium-citrate-diarrhea-prone`  | magnesium         | diarrhea-prone            | yellow | `osmotic_laxation_form_specific`          | 柠檬酸镁偏通便，腹泻体质慎用              | Q7 Q16  | ODS Magnesium         | 便秘人群是否转为正向推荐                   |
| 17 | `vm-rule-chromium-metformin`                | chromium          | metformin                 | yellow | `glucose_lowering_additive`               | 与降糖药叠加需防低血糖                 | Q8      | NIH Chromium          | 起始剂量与监测频率                      |
| 18 | `vm-rule-cinnamon-metformin`                | cinnamon          | metformin                 | yellow | `glucose_lowering_additive`               | 肉桂与二甲双胍叠加需监测血糖              | Q8      | 综述/手工规则               | 肉桂来源差异是否区分                     |
| 19 | `vm-rule-chromium-diabetes-medications`     | chromium          | diabetes-medications      | yellow | `glucose_lowering_additive_polypharmacy`  | 适用于其它降糖药并用                  | Q8      | NIH Chromium          | 药物集合白名单                        |
| 20 | `vm-rule-cinnamon-diabetes-medications`     | cinnamon          | diabetes-medications      | yellow | `glucose_lowering_additive_polypharmacy`  | 与降糖药叠加有低血糖可能                | Q8      | 手工规则                  | Cassia/Ceylon 是否区分             |
| 21 | `vm-rule-calcium-levothyroxine`             | calcium           | levothyroxine             | yellow | `reduced_absorption_levothyroxine`        | 钙会影响优甲乐吸收                   | Q9      | ODS Calcium           | 强制写间隔 4 小时                     |
| 22 | `vm-rule-iron-levothyroxine`                | iron              | levothyroxine             | yellow | `reduced_absorption_levothyroxine`        | 铁剂也会影响优甲乐吸收                 | Q9      | ODS Iron              | 规则虽非题干主诉，但应一并加                 |
| 23 | `vm-rule-vitd-pregnancy`                    | vitamin-d         | pregnancy                 | yellow | `pregnancy_requires_medical_confirmation` | 孕期维D需按检测与产科建议调整             | Q18     | ODS Vitamin D         | 强免责文案必须联动                      |
| 24 | `vm-rule-vitamina-pregnancy-highdose`       | vitamin-a         | pregnancy                 | red    | `retinol_pregnancy_teratogenicity`        | 高剂量预成型维A孕期禁自行补              | Q18 Q19 | NIH Vitamin A         | 只针对 retinol，不要误伤 beta-carotene |
| 25 | `vm-rule-iodine-thyroid-disorder`           | iodine            | thyroid-disorder          | yellow | `thyroid_axis_caution`                    | 甲状腺疾病背景下高碘补充需谨慎             | Q9 Q20  | NIH Iodine            | 甲减/甲亢是否分开                      |
| 26 | `vm-rule-fishoil-empty-no-fat-meal`         | fish-oil          | no-fat-meal               | yellow | `reduced_absorption_fat_soluble_context`  | 空腹/无脂餐同服影响吸收与耐受             | Q10 Q17 | ODS Omega-3           | 这条偏 timing，不要写成禁用              |
| 27 | `vm-rule-vitd-no-fat-meal`                  | vitamin-d         | no-fat-meal               | yellow | `reduced_absorption_fat_soluble_context`  | 无脂餐下维D吸收不稳                  | Q10     | ODS Vitamin D         | 结果页应给随餐提示                      |
| 28 | `vm-rule-magnesium-morning-sedation-goal`   | magnesium         | daytime-use-for-sleep     | yellow | `timing_goal_mismatch`                    | 助眠目标下不建议放早晨主剂量              | Q10 Q16 | ODS Magnesium         | 这是场景化 yellow，不是禁忌              |
| 29 | `vm-rule-bcomplex-night-use`                | vitamin-b-complex | bedtime-use               | yellow | `timing_goal_mismatch`                    | 晚间大剂量 B 复合不利于睡眠             | Q10 Q11 | NIH B vitamins        | 是否仅提示“可改早晨”                    |
| 30 | `vm-rule-calcium-high-single-dose`          | calcium           | single-dose-over-500mg    | yellow | `single_dose_absorption_drop`             | 单次高钙负荷吸收率下降                 | Q11 Q14 | ODS Calcium           | 这是吸收问题，不是安全问题；但保留 yellow       |
| 31 | `vm-rule-iron-coffee-window`                | iron              | coffee-window             | yellow | `coffee_reduces_iron_absorption`          | 咖啡显著影响铁吸收                   | Q13 Q15 | ODS Iron              | 间隔 1–2h 写死                     |
| 32 | `vm-rule-calcium-coffee-window`             | calcium           | coffee-window             | yellow | `coffee_reduces_calcium_absorption`       | 咖啡与钙同窗影响吸收                  | Q13     | ODS Calcium           | 强度不宜写太重                        |
| 33 | `vm-rule-bcomplex-coffee-window`            | vitamin-b-complex | coffee-window             | yellow | `coffee_reduces_b_absorption_context`     | 咖啡下 B 族体验较差                 | Q13     | 营养学规则                 | 作为体验性 yellow，措辞保守              |
| 34 | `vm-rule-iron-green-tea-window`             | iron              | green-tea-window          | yellow | `tea_polyphenol_reduces_iron`             | 绿茶影响非血红素铁吸收                 | Q15     | ODS Iron              | 2h 间隔是否固定                      |
| 35 | `vm-rule-iron-longterm-highdose`            | iron              | long-term-high-dose       | yellow | `iron_long_term_requires_reassessment`    | 高剂量铁不宜长期自行补                 | Q19     | ODS Iron              | 是否写 3–6 月复评                    |
| 36 | `vm-rule-zinc-longterm-highdose`            | zinc              | long-term-high-dose       | yellow | `zinc_long_term_requires_reassessment`    | 高剂量锌长期用需评估铜缺乏风险             | Q19     | NIH Zinc              | 阈值锁 40mg/天                     |
| 37 | `vm-rule-vitd-longterm-highdose`            | vitamin-d         | long-term-high-dose       | yellow | `fat_soluble_accumulation_risk`           | 维D长期高剂量需复评                  | Q19     | ODS Vitamin D         | 是否配 Ca/25OHD 复查                |
| 38 | `vm-rule-vitamina-longterm-highdose`        | vitamin-a         | long-term-high-dose       | red    | `fat_soluble_accumulation_high_risk`      | 预成型维A长期高剂量风险高               | Q19     | NIH Vitamin A         | 红色是否仅限 retinol                 |
| 39 | `vm-rule-vitamine-longterm-highdose`        | vitamin-e         | long-term-high-dose       | yellow | `fat_soluble_accumulation_risk`           | 高剂量维E长期使用需评估                | Q19     | NIH Vitamin E         | 若合并抗凝药需更谨慎                     |
| 40 | `vm-rule-selenium-longterm-highdose`        | selenium          | long-term-high-dose       | yellow | `selenium_excess_reassessment`            | 硒长期高剂量需复评                   | Q19     | NIH Selenium          | 指甲/胃肠副作用提示                     |
| 41 | `vm-rule-iodine-pregnancy-highdose`         | iodine            | pregnancy                 | yellow | `iodine_pregnancy_requires_confirmation`  | 孕期高碘不建议自行加量                 | Q18 Q20 | NIH Iodine            | 产科确认文案                         |
| 42 | `vm-rule-choline-pregnancy-self-escalation` | choline           | pregnancy                 | yellow | `pregnancy_self_escalation_caution`       | 胆碱可补，但不建议自行高量叠加             | Q18 Q20 | NIH Choline           | 与产科叶酸方案协调                      |
| 43 | `vm-rule-b12-selfstart-polystack`           | vitamin-b12       | polystack-self-start      | yellow | `stack_complexity_first_one_only`         | “全都要吃”场景不建议一上来高堆栈           | Q20     | 决策辅助规则                | 这条是入口治理规则                      |
| 44 | `vm-rule-folate-selfstart-polystack`        | folate            | polystack-self-start      | yellow | `stack_complexity_first_one_only`         | 起始应先看目标与既有用药                | Q20     | 决策辅助规则                | 尤其女性/备孕与非备孕分开                  |
| 45 | `vm-rule-magnesium-selfstart-polystack`     | magnesium         | polystack-self-start      | yellow | `stack_complexity_first_one_only`         | 先按单一目标起步更稳                  | Q20     | 决策辅助规则                | 可作为 Q20 起始推荐                   |
| 46 | `vm-rule-probiotic-selfstart-polystack`     | probiotic         | polystack-self-start      | yellow | `stack_complexity_first_one_only`         | 益生菌也不建议与 5+ 新补剂同启           | Q20     | 决策辅助规则                | 是否给 2–4 周观察建议                  |
| 47 | `vm-rule-vitc-selfstart-polystack`          | vitamin-c         | polystack-self-start      | yellow | `stack_complexity_first_one_only`         | 入门补充不要多剂并起                  | Q20     | 决策辅助规则                | 保持轻量措辞                         |
| 48 | `vm-rule-zinc-iron-same-window`             | zinc              | iron-window-overlap       | yellow | `mineral_competition_absorption`          | 铁锌同窗影响吸收体验                  | Q11 Q19 | NIH Iron/Zinc         | 是否写分次更优                        |
| 49 | `vm-rule-calcium-iron-same-window`          | calcium           | iron-window-overlap       | yellow | `mineral_competition_absorption`          | 钙铁同窗不优先                     | Q11 Q15 | ODS Calcium/Iron      | 与早餐/咖啡场景组合                     |
| 50 | `vm-rule-calcium-magnesium-highdose-window` | calcium           | magnesium-highdose-window | yellow | `high_mineral_load_split_dose`            | 高剂量矿物堆叠建议拆分                 | Q11     | ODS Calcium/Magnesium | “拆分服用”而非“禁用”                   |

### 2.3 这 50 条怎样对应 20 题

* **直接命中型**：Q1/Q2/Q4/Q5/Q6/Q7/Q8/Q9/Q18
* **时间表/长期用量治理型**：Q10/Q11/Q13/Q15/Q19/Q20
* **翻译层配套型**：Q16/Q17 主要靠 `forms[]` 和 `formComparison`，只保留少量 L2 yellow 作为边界提醒。

---

## §3. SUPP.AI 过滤规则 + severity 映射

SUPP.AI 当前公开页给出的规模是 **2,044 supplements、2,866 drugs、59,096 interactions**，主页提供公开数据下载（38.4MB）和免费 API；API 文档也给出了 `agent/search`、`agent/<CUI>/interactions`、`interaction/<IID>` 等端点。([SUPP.AI][2])

### 3.1 Top 50 supplement whitelist（给 `bakeSuppai.ts`）

> 前 30 个与 §1 的 `Ingredient.id` 对齐；后 20 个是为了把 SUPP.AI 过滤后条数稳住在 ~1500，不用于 P0 主讲故事。

```txt
fish-oil
vitamin-d
calcium
vitamin-c
magnesium
coenzyme-q10
probiotic
vitamin-b-complex
vitamin-b6
chromium
cinnamon
iron
zinc
vitamin-b12
folate
biotin
thiamin
riboflavin
niacin
pantothenic-acid
vitamin-a
vitamin-e
vitamin-k
selenium
iodine
copper
manganese
choline
garlic
ginkgo
ginseng
turmeric
melatonin
glucosamine
collagen
nac
alpha-lipoic-acid
lutein
lycopene
vitamin-b1-b2-b3-stack
multivitamin-mineral-base
potassium
omega-3-krill-oil
algal-oil
berberine
ashwagandha
milk-thistle
resveratrol
curcumin-phytosome
```

### 3.2 Top 100 drug whitelist（中英对照）

| 类别         | 10 个药物                                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 抗凝/抗血小板    | 华法林 Warfarin；阿哌沙班 Apixaban；利伐沙班 Rivaroxaban；达比加群 Dabigatran；氯吡格雷 Clopidogrel；阿司匹林 Aspirin；替格瑞洛 Ticagrelor；依诺肝素 Enoxaparin；肝素 Heparin；艾多沙班 Edoxaban                                             |
| 降压 1       | 氨氯地平 Amlodipine；缬沙坦 Valsartan；氯沙坦 Losartan；厄贝沙坦 Irbesartan；培哚普利 Perindopril；赖诺普利 Lisinopril；氢氯噻嗪 Hydrochlorothiazide；呋塞米 Furosemide；美托洛尔 Metoprolol；比索洛尔 Bisoprolol                            |
| 降压 2 / 心血管 | 硝苯地平 Nifedipine；卡维地洛 Carvedilol；坎地沙坦 Candesartan；替米沙坦 Telmisartan；地尔硫卓 Diltiazem；维拉帕米 Verapamil；螺内酯 Spironolactone；地高辛 Digoxin；异山梨酯硝酸酯 Isosorbide mononitrate；阿托伐他汀 Atorvastatin               |
| 调脂         | 瑞舒伐他汀 Rosuvastatin；辛伐他汀 Simvastatin；普伐他汀 Pravastatin；依折麦布 Ezetimibe；非诺贝特 Fenofibrate；依洛尤单抗 Evolocumab；匹伐他汀 Pitavastatin；氟伐他汀 Fluvastatin；洛伐他汀 Lovastatin；贝特类 Gemfibrozil                       |
| 降糖 1       | 二甲双胍 Metformin；格列美脲 Glimepiride；格列齐特 Gliclazide；格列本脲 Glyburide；西格列汀 Sitagliptin；利格列汀 Linagliptin；达格列净 Dapagliflozin；恩格列净 Empagliflozin；阿卡波糖 Acarbose；吡格列酮 Pioglitazone                         |
| 降糖 2       | 甘精胰岛素 Insulin glargine；门冬胰岛素 Insulin aspart；赖脯胰岛素 Insulin lispro；德谷胰岛素 Insulin degludec；度拉糖肽 Dulaglutide；司美格鲁肽 Semaglutide；利拉鲁肽 Liraglutide；米格列奈 Mitiglinide；瑞格列奈 Repaglinide；那格列奈 Nateglinide |
| 精神科 1      | 舍曲林 Sertraline；艾司西酞普兰 Escitalopram；氟西汀 Fluoxetine；帕罗西汀 Paroxetine；西酞普兰 Citalopram；文拉法辛 Venlafaxine；度洛西汀 Duloxetine；安非他酮 Bupropion；米氮平 Mirtazapine；曲唑酮 Trazodone                                |
| 精神科 2 / 睡眠 | 喹硫平 Quetiapine；奥氮平 Olanzapine；利培酮 Risperidone；阿立哌唑 Aripiprazole；劳拉西泮 Lorazepam；阿普唑仑 Alprazolam；氯硝西泮 Clonazepam；唑吡坦 Zolpidem；右佐匹克隆 Eszopiclone；苯海索 Trihexyphenidyl                              |
| 胃/甲状腺/激素   | 左甲状腺素 Levothyroxine；奥美拉唑 Omeprazole；泮托拉唑 Pantoprazole；埃索美拉唑 Esomeprazole；法莫替丁 Famotidine；泼尼松 Prednisone；甲泼尼龙 Methylprednisolone；他克莫司 Tacrolimus；环孢素 Cyclosporine；甲氨蝶呤 Methotrexate             |
| 其他高频       | 他莫昔芬 Tamoxifen；来曲唑 Letrozole；芬太尼 Fentanyl；曲马多 Tramadol；布洛芬 Ibuprofen；对乙酰氨基酚 Acetaminophen；左氧氟沙星 Levofloxacin；多西环素 Doxycycline；复方新诺明 TMP-SMX；莫西沙星 Moxifloxacin                                  |

### 3.3 筛选规则

```txt
保留条件 =
  supplement ∈ Top50 whitelist
  AND drug ∈ Top100 whitelist
  AND interaction has >=1 evidence sentence
  AND paper.retraction != true
  AND paper.year >= 1995
```

### 3.4 筛后预估条数

| 阶段                     |            预估条数 |
| ---------------------- | --------------: |
| SUPP.AI 全量 interaction |          59,096 |
| 只保留 supplement∈Top50   |    ~5,000–7,000 |
| 再保留 drug∈Top100        |    ~1,200–1,800 |
| 去掉证据弱 / 撤稿 / 命名无法标准化   | **目标 1,500 左右** |

### 3.5 evidence → severity 映射表（锁版）

#### 决策树

```txt
if hardcoded hit:
  use hardcoded severity as main Risk
  if suppai also hit and differs:
    append suppai as secondaryEvidence[]
    append "suppai" into conflictingSources[]

else if evidence contains explicit avoid / contraindicated / do not use / major bleeding / INR instability:
  severity = red

else if evidence contains caution / monitor / may increase / may decrease / dose-dependent / moderate:
  severity = yellow

else if evidence is mixed / insufficient / unclear / only preclinical:
  severity = gray

else:
  severity = green
```

#### 映射表

| SUPP.AI 信号                                         | 映射       |
| -------------------------------------------------- | -------- |
| `contraindicated` / `avoid` / 明确严重 adverse outcome | `red`    |
| `monitor` / `caution` / `moderate` / 剂量依赖          | `yellow` |
| 只有零散句子、无临床指向、证据相互矛盾                                | `gray`   |
| 查到该对、但未见明确风险                                       | `green`  |

这张表的核心不是“学术最优”，而是**P0 合规最稳**：只要进 `red/yellow`，都必须能落回固定模板和证据链；而 hardcoded 冲突永远优先，符合你追加的红线。`Risk` 也已经给了 `secondaryEvidence[]` 和 `conflictingSources[]` 两个落点。

---

## §4. 8 个 bake 脚本伪代码

下面这 8 个脚本的输入 URL 和接入方式，对应的是当前可公开访问的官方页面 / API：NIH ODS Fact Sheets、LPI MIC、PubChem PUG REST、DSLD API v9、SUPP.AI 数据集与 API、TGA ARTG 搜索页、Japan CAA 机能性表示食品搜索页，以及中国营养学会 2023 DRI 发布页。([膳食补充剂办公室][1])

### 4.1 `bakeNihFactSheets.ts`

| 项      | 内容                                                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 输入 URL | `https://ods.od.nih.gov/factsheets/{Slug}-HealthProfessional/`                                                                                                                                                           |
| 下载方式   | `curl` 批量抓 HTML                                                                                                                                                                                                          |
| 预估大小   | 30 页 × 80–250KB = ~4MB HTML                                                                                                                                                                                              |
| 转换步骤   | 1) `cheerio.load(html)`；2) 抽固定 section：Introduction / Recommended Intakes / Sources / Health / Interactions / Safety；3) 用 slug→id 映射表只处理 30 个核心 id；4) 关键数值抽 `RDA/AI/UL`；5) 交给 Minimax 做**翻译**，不让它发明事实；6) Zod 校验后落中间 JSON |
| 输出字段   | `nameEn` `nameZh` `aliases` `dri.us` `mechanism` `healthEffects[]` `sourceRefs[]`                                                                                                                                        |
| 留空字段   | `forms[].pubchemCid // TODO by bakePubchem`；`dri.cn // TODO by bakeCnDri`；`contraindicationIds // TODO by bakeHardcodedLinker`                                                                                           |
| 末尾估值   | `console.log('size:', '~180KB', 'entries:', 30)`                                                                                                                                                                         |

```ts
for (const item of CORE_30) {
  const slug = NIH_SLUG_MAP[item.id];
  const html = await fetch(`https://ods.od.nih.gov/factsheets/${slug}-HealthProfessional/`).then(r => r.text());
  const doc = load(html);
  const sections = extractNihSections(doc);
  const structured = await minimaxTranslateToSchema(sections, NIH_ZOD);
  upsertIngredient(item.id, structured, makeSourceRef('nih-ods', slug));
}
```

### 4.2 `bakeLpi.ts`

| 项      | 内容                                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入 URL | `https://lpi.oregonstate.edu/mic/...`（维矿类）+ `https://lpi.oregonstate.edu/mic/dietary-factors/...`（CoQ10 等）                                      |
| 下载方式   | `curl` / 手工 URL map                                                                                                                             |
| 预估大小   | 20–25 页 × 100–300KB = ~5MB HTML                                                                                                                 |
| 转换步骤   | 1) 只抓第 1 节所列 `LPI=yes` 的 id；2) 解析 Biological Activities / Disease Prevention / Safety；3) Minimax 只翻 mechanism 和 health effects 摘要；4) 与 NIH 结果合并 |
| 输出字段   | `healthEffects[]` `evidenceLevel` `mechanism` `sourceRefs[]`（增量）                                                                                |
| 留空字段   | `dri` 不覆盖；`forms` 不覆盖                                                                                                                           |
| 末尾估值   | `console.log('size:', '+70KB', 'entries:', 22)`                                                                                                 |

```ts
for (const item of LPI_ENABLED) {
  const url = LPI_URL_MAP[item.id];
  const html = await fetch(url).then(r => r.text());
  const blocks = extractLpiBlocks(load(html));
  const delta = await minimaxTranslateToSchema(blocks, LPI_ZOD);
  mergeIngredient(item.id, delta, makeSourceRef('lpi', item.id, url));
}
```

### 4.3 `bakeCnDri.ts`

| 项      | 内容                                                                |
| ------ | ----------------------------------------------------------------- |
| 输入 URL | 中国营养学会 2023 DRI 发布页 + 团队已购买/手录的数值表                                |
| 下载方式   | 手工录入 CSV / JSON                                                   |
| 预估大小   | `cn-dri-manual.json` < 10KB                                       |
| 转换步骤   | 1) 手录 30 个 id 的 `rdi/ul/unit`；2) 跑 Zod；3) 合并进 `ingredient.dri.cn` |
| 输出字段   | `dri.cn` `sourceRefs[]`                                           |
| 留空字段   | 无                                                                 |
| 末尾估值   | `console.log('size:', '+8KB', 'entries:', 30)`                    |

```ts
const cn = z.array(CN_DRI_ROW).parse(readJson('raw/cn-dri-manual.json'));
for (const row of cn) {
  patchIngredient(row.id, { dri: { cn: row.cn }}, makeSourceRef('cn-dri', row.id));
}
```

### 4.4 `bakePubchem.ts`

| 项      | 内容                                                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 输入 URL | PubChem PUG REST                                                                                                                                                   |
| 下载方式   | `curl` / fetch JSON                                                                                                                                                |
| 预估大小   | 30 ids × 2–7 forms = ~90 lookups，总响应 < 1MB                                                                                                                         |
| 转换步骤   | 1) 读取 §1 的 `forms 候选`；2) 对每个 form 调 `compound/name/{name}/cids/JSON`；3) 取主 CID；4) 可选拉 `Title / Synonyms` 校验；5) 填 `IngredientForm.pubchemCid` 与 form 级 `sourceRefs` |
| 输出字段   | `forms[].pubchemCid` `forms[].sourceRefs[]`                                                                                                                        |
| 留空字段   | `absorptionRate` 不从 PubChem 来，保持手工值                                                                                                                                |
| 末尾估值   | `console.log('size:', '+15KB', 'entries:', 30, 'forms:', 92)`                                                                                                      |

```ts
for (const ing of CORE_30) {
  for (const form of ing.formCandidates) {
    const cid = await getPubchemCid(formToSearchName(ing.id, form));
    patchFormCid(ing.id, form, cid, makeSourceRef('pubchem', `${ing.id}:${form}`));
  }
}
```

### 4.5 `bakeDsld.ts`

| 项      | 内容                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入 URL | DSLD API v9：`/v9/browse-products`、`/v9/label/{id}`、`/v9/search-filter-histogram`                                                                                    |
| 下载方式   | API 分页抓取                                                                                                                                                            |
| 预估大小   | 只扫 ingredient label 字段，原始 JSON 200–400MB（临时）                                                                                                                        |
| 转换步骤   | 1) 分页扫产品；2) 只取 label ingredient text；3) 归一化大小写/括号/“as ...”；4) 统计频次；5) 取 Top 500 名称；6) 用 §1 的 30 个 id 规则优先映射；7) 产出 `standardName + aliases[] + probableIngredientId` |
| 输出字段   | `dsld-ingredients.ts`：只做字典，不做产品库                                                                                                                                    |
| 留空字段   | 不产 `Product[]`                                                                                                                                                      |
| 末尾估值   | `console.log('size:', '~50KB', 'entries:', 500)`                                                                                                                    |

```ts
for await (const page of iterateDsldProducts()) {
  for (const label of page.items) {
    for (const rawIng of extractLabelIngredients(label)) {
      freq[norm(rawIng)]++;
    }
  }
}
const top500 = rank(freq).slice(0, 500);
writeDsldDictionary(mapToAliases(top500));
```

### 4.6 `bakeSuppai.ts`

| 项      | 内容                                                                                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入 URL | SUPP.AI 首页数据下载链接（38.4MB tar.gz）+ API 文档                                                                                                                                                   |
| 下载方式   | `curl` 下载数据包；必要时 API 补查 agent slug/synonym                                                                                                                                                |
| 预估大小   | 38.4MB 原包，解包后 CSV/JSON 约 80–120MB                                                                                                                                                         |
| 转换步骤   | 1) 解包；2) 建 supplement/drug CUI→slug map；3) 只保留 Top50 supplement + Top100 drug；4) 合并 synonyms；5) 按 §3 severity 规则映射；6) 每条 interaction 提取首要证据 paper/year/PMID；7) 写 `suppai-interactions.ts` |
| 输出字段   | `Interaction[]`：`id` `substanceA/B` `severity` `reasonCode` `reason` `doseThreshold?` `sourceRef`                                                                                         |
| 留空字段   | 不填 `secondaryEvidence`，那是 runtime merge 的职责                                                                                                                                               |
| 末尾估值   | `console.log('size:', '~350KB', 'entries:', 1500)`                                                                                                                                        |

```ts
const agents = loadSuppaiAgents();
const rows = loadSuppaiInteractions();
const filtered = rows
  .filter(r => SUPP_TOP50.has(mapSupp(r.supplement)) && DRUG_TOP100.has(mapDrug(r.drug)))
  .filter(r => r.evidence?.length)
  .map(toInteractionByMappingRules);
writeTs('suppai-interactions.ts', filtered);
```

### 4.7 `bakeTga.ts`

| 项      | 内容                                                                                                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入 URL | TGA ARTG 搜索页 / ARTG visualisation tool                                                                                                                                                                     |
| 下载方式   | 手工搜索 + 结构化抄录 / 极简抓取                                                                                                                                                                                        |
| 预估大小   | 200 条产品 × 2–4KB = ~500KB raw JSON                                                                                                                                                                          |
| 转换步骤   | 1) 搜 sponsor: Swisse / Blackmores / Bio Island / Ostelin；2) 只保留与你 30 id 有交集的产品；3) 提取 `ARTG id / name / sponsor / ingredient text`；4) ingredient text 走 DSLD 字典和 OCR normalizer 同一套标准化；5) 产出 AU `Product[]` |
| 输出字段   | `sku` `brand` `nameOriginal` `country='AU'` `ingredients[]` `sourceRef`                                                                                                                                    |
| 留空字段   | `upc // TODO`；`nameZh` 允许空                                                                                                                                                                                 |
| 末尾估值   | `console.log('size:', '~220KB', 'entries:', 180)`                                                                                                                                                          |

```ts
for (const brand of ['Swisse','Blackmores','Bio Island','Ostelin']) {
  const hits = searchArtgBySponsor(brand);
  for (const hit of hits.slice(0, 50)) {
    const p = normalizeArtgHit(hit);
    if (hasCoreIngredient(p, CORE_30)) out.push(p);
  }
}
```

### 4.8 `bakeKinoseihyouji.ts`

| 项      | 内容                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| 输入 URL | Japan CAA 机能性表示食品搜索页                                                                                                      |
| 下载方式   | 搜索页手工导出 / 极简抓取                                                                                                            |
| 预估大小   | 150 条记录 × 2–3KB = ~350KB                                                                                                  |
| 转换步骤   | 1) 用 DHC / FANCL / Orihiro / Kobayashi 检索；2) 只取与你 30 id 有交集的维矿/鱼油/辅酶Q10/益生菌产品；3) 提取届出编号、商品名、功能性关与成分；4) 用 JP→EN alias 表标准化 |
| 输出字段   | `sku` `brand` `nameOriginal` `country='JP'` `ingredients[]` `sourceRef`                                                   |
| 留空字段   | `upc` 通常空；`dose` 若官方公表页没有明确量，则 `// TODO manual fill` 不入库                                                                  |
| 末尾估值   | `console.log('size:', '~160KB', 'entries:', 120)`                                                                         |

```ts
for (const brand of ['DHC','FANCL','Orihiro','Kobayashi']) {
  const rows = searchJpKinosei(brand);
  for (const row of rows) {
    const p = normalizeKinoseiRow(row);
    if (hasCoreIngredient(p, CORE_30)) out.push(p);
  }
}
```

---

## §5. Minimax Prompt 模板 + Demo Banner UI hook

这里有两个硬约束必须一起满足：

1. **LLM 只翻译，不造事实**。
2. **不能改类型**，所以 Demo Banner 不能新增 API 字段。
   现有 `TranslationResult` 只有 `criticalWarning?` 和 `disclaimer` 两个顶层合规落点。

### 5.1 NIH / LPI 翻译 Prompt

```text
角色：
你是 VitaMe 的“补剂资料翻译器”，不是医生，不做诊断，不做处方，不做风险推理。
你的任务是把 NIH / LPI 官方资料翻译成结构化中文字段，供离线知识库烘焙使用。

输入：
- source_name
- source_url
- ingredient_id
- raw_sections = {
  introduction,
  recommended_intakes,
  interactions_with_medications,
  safety,
  biological_activities
}

输出 JSON（必须严格符合此 schema）：
{
  "nameZh": "string",
  "aliases": ["string"],
  "mechanism": "string",
  "healthEffects": ["string"],
  "evidenceLevel": "strong|moderate|limited|insufficient",
  "driHints": {
    "rdi": "number|null",
    "ul": "number|null",
    "unit": "mg|mcg|IU|g|null"
  },
  "notes": ["string"]
}

硬规则：
- 只能翻译和归纳输入文本，不得补充输入中没有的事实
- 不得输出任何诊断、处方、疗效承诺
- 若数值不确定，返回 null
- 若 section 缺失，不要猜
- 输出必须是纯 JSON，不要带 markdown

禁词：
治疗、治愈、处方、药效、根治、诊断
```

### 5.2 OCR Prompt（输出 `OcrExtractionResult` 形态）

`query.ts` 里 OCR 契约已经锁死为：`brand? / productName? / countryGuess? / ingredients[] / confidence / unreadableParts[]`。

```text
你是补剂标签 OCR 提取器。
只提取 Supplement Facts / 成分表 中能直接看到的信息。

输出 JSON：
{
  "brand": "string|undefined",
  "productName": "string|undefined",
  "countryGuess": "US|AU|JP|CN|UNKNOWN",
  "ingredients": [
    {
      "nameEn": "string",
      "amount": 123,
      "unit": "mg|mcg|IU|g|undefined",
      "form": "string|undefined"
    }
  ],
  "confidence": 0.0,
  "unreadableParts": ["string"]
}

规则：
- 不猜剂量
- 不猜 form，除非标签明确写出 glycinate / citrate / D3 / MK-7 / EPA / DHA 等
- 不输出营销文案
- 看不清就把 confidence 降低并写入 unreadableParts
```

### 5.3 失败重试策略

| 场景        | 第 1 次失败      | 第 2 次           | 第 3 次              |
| --------- | ------------ | --------------- | ------------------ |
| JSON 解析失败 | 重试一次         | `temperature=0` | `TemplateFallback` |
| Zod 校验失败  | 降字段要求        | 强制最小 schema     | `TemplateFallback` |
| OCR 识别混乱  | 压图再试         | 提示手动补正          | 切文字输入              |
| 翻译输出带禁词   | Guardrail 替换 | 再跑一次低温          | `TemplateFallback` |

### 5.4 Demo Banner UI hook（不改类型）

你要求的 Demo Banner：

> **本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。**

因为**不能加新字段**，我建议这样做：

#### 前端计算式 hook（推荐）

```ts
const hasUnreviewedHardcoded = translatedRisks.some((r) => {
  if (r.evidence.sourceType !== 'hardcoded') return false;
  const rule = CONTRAINDICATION_BY_REASON_CODE[r.reasonCode];
  return rule?.pharmacistReviewed === false;
});

const showDemoBanner = process.env.NEXT_PUBLIC_DEMO_MODE === '1' && hasUnreviewedHardcoded;
```

* `pharmacistReviewed` 来自 `Contraindication` 类型本身。
* 不需要改 `TranslationResult` 契约。

#### 兜底方案：复用 `criticalWarning`

若你坚持后端统一注入，就复用已有 `criticalWarning.text`：

```ts
if (demoMode && hasUnreviewedHardcoded) {
  criticalWarning = {
    show: true,
    text: "本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。"
  };
}
```

这样仍不需要改类型，只是把 Demo Banner 当作顶栏 warning 的一种来源。

---

## §6. 风险矩阵

| 脚本                  | 失败场景                        | 信号                        | 降级                                                    |
| ------------------- | --------------------------- | ------------------------- | ----------------------------------------------------- |
| `bakeNihFactSheets` | 页面结构改版，section 抓不到          | section 缺失 >30%           | 退到人工 slug map + 只抓推荐摄入量与药物交互两段                        |
| `bakeNihFactSheets` | Minimax 翻译漂移                | Zod fail >10%             | 改为只产英文原文摘要，中文走 TemplateFallback                       |
| `bakeNihFactSheets` | 单页 URL 变动                   | 404                       | 用官方 Fact Sheets 搜索页重新映射 slug                          |
| `bakeLpi`           | LPI 页面结构不统一                 | `extractLpiBlocks()` 命中率低 | 只保留 `mechanism` 与 `healthEffects` 两字段                 |
| `bakeLpi`           | 冷门成分无 monograph             | 404/空页                    | 该 id 保持 `LPI=no`，只用 NIH                               |
| `bakeLpi`           | 翻译耗时过长                      | 单批 >20s                   | 分批 5 页 + 本地缓存                                         |
| `bakeCnDri`         | 公开网页无完整数值                   | 缺表                        | 退到手工录入 30 个核心值                                        |
| `bakeCnDri`         | 单位口径混乱                      | mg/mcg/IU 混用              | 强制 schema 校验 unit                                     |
| `bakeCnDri`         | 手录出错                        | 同一成分双录不一致                 | 双人复核或 CSV diff                                        |
| `bakePubchem`       | form 名称搜不到 CID              | 404 / 空 cids              | 用同义词重试：如 magnesium bisglycinate → magnesium glycinate |
| `bakePubchem`       | 命中多个 CID                    | cids>1                    | 取 exact title 最接近者，其余写人工核对列表                          |
| `bakePubchem`       | API 限流                      | 503/timeout               | 加 sleep + 本地 cache.json                               |
| `bakeDsld`          | API 分页太慢                    | 全量 >2h                    | 只扫目标品牌 + Top supplement categories                    |
| `bakeDsld`          | ingredient text 脏数据太多       | alias 爆炸                  | 只保留出现频次≥3 的名称                                         |
| `bakeDsld`          | Top500 覆盖不足                 | 命中率 <85%                  | 补手工 alias 100 条                                       |
| `bakeSuppai`        | 数据包格式改版                     | 解包失败 / 字段名变化              | 退到 API 按 whitelist 拉核心对                               |
| `bakeSuppai`        | 筛后 <500 条                   | `count<500`               | 放宽药物白名单到 150                                          |
| `bakeSuppai`        | 筛后 >3000 条                  | `count>3000`              | 仅保留 human/clinical + non-retracted                    |
| `bakeTga`           | ARTG 搜索页抓取不稳                | HTML 结构变动                 | 改为手工 sponsor 搜索 + 抄录 Top 50                           |
| `bakeTga`           | Complementary medicine 成分不全 | ingredient text 空         | 不入库，列人工补录                                             |
| `bakeTga`           | 结果太多超时                      | sponsor 命中 >1000          | 只收和 30 ids 有交集的 product                               |
| `bakeKinoseihyouji` | 搜索页字段改版                     | brand/ingredient 列缺失      | 退到人工筛 DHC/FANCL/Orihiro/Kobayashi                     |
| `bakeKinoseihyouji` | 日文名归一失败                     | alias miss >20%           | 手工维护 JP alias map                                     |
| `bakeKinoseihyouji` | 剂量缺失                        | amount null 比例高           | 允许只做 product→ingredient 映射，不填 dose                    |

---

## 自查：5 天内，1 个工程能不能烘完？

**结论：能烘完“30 成分 + 50 禁忌 + SUPP.AI 1500 条”这一核心包；但如果把 TGA / 日本 / 蓝帽子也一起做到完整可演示，会超预算。**

### 能在 5 天内完成的

* `ingredients.ts`：30 个 id + forms + NIH/LPI/CN/PubChem 合并
* `contraindications.ts`：50 条硬编码规则
* `suppai-interactions.ts`：~1500 条过滤产物
* `dsld-ingredients.ts`：Top500 字典

### 会超预算的

* `bakeTga.ts`
* `bakeKinoseihyouji.ts`
* `china-products.ts`（蓝帽子手录）

### 原因

不是技术难，而是**产品 SKU 端的人工筛选和命名归一**更耗时。
所以 5 天版建议你把烘焙优先级锁成：

1. `bakeNihFactSheets`
2. `bakeLpi`
3. `bakeCnDri`
4. `bakePubchem`
5. `bakeSuppai`
6. `contraindications.ts`
7. `bakeDsld`

把 `bakeTga / bakeKinoseihyouji` 放到第 6–7 天补，不阻塞核心 Demo。

如果你要，我下一步可以直接把这份方案继续压成**工程执行版清单**：
按“Day1-Day5 + 每个脚本输入/输出文件名 + Zod schema 草稿 + 体积预算”写成 Claude Code 可执行任务单。

[1]: https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/?os=0slw57psd "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/?os=0slw57psd"
[2]: https://supp.ai/ "https://supp.ai/"
