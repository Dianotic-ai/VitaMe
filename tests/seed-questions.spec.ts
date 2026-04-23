// file: tests/seed-questions.spec.ts — 100 seed questions L2 merge gate
//
// 来源：docs/小红书需求调研/Demo种子问题清单-100条.md
// 用途：CLAUDE.md §13.3 + §14 — merge gate（可执行 case 100% 必须 pass）
// 测试范围：L2 SafetyJudgment（直接调用 judge()），不经 L0 LLM（确定性、可复现）
//   - L0 解析质量由 scripts/smokeIntent.ts 在真实 LLM 下手工验证
//   - L3 翻译质量由 tests/unit/safetyTranslation/* 单测覆盖
//   - 合规过滤（"治"字眼、CTA 强提示等）由 tests/compliance-audit.spec.ts 覆盖
//
// 100 条 case 的 skip 分类：
//   - kind: 'covered'        → 当前 L1 有规则，跑断言
//   - kind: 'fallback'        → 兜底 green/gray，跑断言
//   - kind: 'missing-l1-rule' → 期望 red/yellow 但 L1 没对应规则；skip
//   - kind: 'missing-l1-substance' → 期望规则需要的 substance 还没建模；skip
//   - kind: 'non-l2-form'     → 形式选择/标签翻译，FR-4/FR-5 不在 L2 范畴；skip
//   - kind: 'non-l2-decision' → 决策辅助/宣称识别/合规过滤，不在 L2 范畴；skip
//
// 加 L1 规则后把对应 case 的 kind 从 missing-* 改成 covered 即可激活（无需重写 case 主体）。

import { describe, it, expect, afterAll } from 'vitest';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';
import type { LookupRequest } from '@/lib/types/adapter';
import type { RiskLevel } from '@/lib/types/risk';

type CaseKind =
  | 'covered'
  | 'fallback'
  | 'missing-l1-rule'
  | 'missing-l1-substance'
  | 'non-l2-form'
  | 'non-l2-decision';

interface SeedCase {
  id: string;
  desc: string;
  kind: CaseKind;
  /** 可执行 case 必填；skip case 可省略 */
  request?: LookupRequest;
  /** 可执行 case 必填 */
  expectedOverall?: RiskLevel;
  /** 至少要命中的 reasonCode 片段（部分匹配） */
  expectedReasonCodes?: string[];
  /** v2.8 §10.2：期望某 ingredient 落 green no_known_risk */
  expectedGreenNoKnownRisk?: string[];
  /** v2.8 §10.2：期望某 ingredient 落 gray no_data */
  expectedGrayNoData?: string[];
  /** skip case 必填：原因 */
  skipReason?: string;
}

// ============================================================================
// 100 SEED CASES
// ============================================================================

const SEED_CASES: SeedCase[] = [
  // ---- A 药物 × 补剂冲突 (10) ----
  {
    id: 'Q1',
    desc: 'Eva（SSRI）+ 鱼油 + 维 D + 镁 + 益生菌 + 维 B + 维 C',
    kind: 'covered',
    request: {
      ingredients: ['fish-oil', 'vitamin-b6', 'vitamin-d', 'magnesium', 'probiotic', 'vitamin-b-complex', 'vitamin-c'],
      medications: ['ssri-use'],
      conditions: [],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['serotonergic_synergy_high_dose', 'b6_high_dose_neuro_risk'],
  },
  {
    id: 'Q2',
    desc: '降压药（氨氯地平）+ 鱼油',
    kind: 'covered',
    request: { ingredients: ['fish-oil'], medications: ['amlodipine'], conditions: [] },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['bp_lowering_additive'],
  },
  {
    id: 'Q3',
    desc: '他汀 + 辅酶 Q10（statin slug 未建模 → 兜底 green）',
    kind: 'fallback',
    request: { ingredients: ['coenzyme-q10'], medications: [], conditions: [] },
    expectedOverall: 'green',
    expectedGreenNoKnownRisk: ['coenzyme-q10'],
  },
  {
    id: 'Q4',
    desc: '华法林 + 辅酶 Q10（红线 demo 头牌）',
    kind: 'covered',
    request: { ingredients: ['coenzyme-q10'], medications: ['warfarin'], conditions: [] },
    expectedOverall: 'red',
    expectedReasonCodes: ['vitamin_k_like_effect'],
  },
  {
    id: 'Q5',
    desc: '甲亢 + 甲巯咪唑 + 补碘',
    kind: 'missing-l1-rule',
    skipReason: 'L1 仅有 iodine|thyroid-disorder=yellow，缺甲亢专项 red 规则；甲巯咪唑 drug slug 未建模',
  },
  {
    id: 'Q6',
    desc: '左氧氟沙星（喹诺酮）+ 钙镁锌',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺喹诺酮 drugClass slug + 多金属离子螯合规则',
  },
  {
    id: 'Q7',
    desc: '艾司唑仑（苯二氮䓬）+ 褪黑素',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 melatonin ingredient + benzodiazepine drugClass',
  },
  {
    id: 'Q8',
    desc: '避孕药 + 圣约翰草（CYP3A4 诱导，红）',
    kind: 'covered',
    request: {
      ingredients: ['st-johns-wort'],
      medications: ['oral-contraceptive'],
      conditions: [],
    },
    expectedOverall: 'red',
    expectedReasonCodes: ['cyp3a4_induction_contraceptive_failure'],
  },
  {
    id: 'Q9',
    desc: '布洛芬（NSAIDs）+ 高剂量维 E',
    kind: 'missing-l1-rule',
    skipReason: 'vitamin-e × NSAIDs 出血风险规则未建',
  },
  {
    id: 'Q10',
    desc: '左甲状腺素（优甲乐）+ 钙片',
    kind: 'covered',
    request: { ingredients: ['calcium'], medications: ['levothyroxine'], conditions: [] },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['reduced_absorption_levothyroxine'],
  },

  // ---- B 病史 × 补剂冲突 (10) ----
  {
    id: 'Q11',
    desc: '老人肝炎 + apoe4 + 鱼油',
    kind: 'covered',
    request: {
      ingredients: ['fish-oil'],
      medications: [],
      conditions: ['active-hepatitis'],
      genes: ['apoe4'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['hepatic_monitoring_needed', 'form_selection_gene_context'],
  },
  {
    id: 'Q12',
    desc: '肾结石 + 维 D + 钙 + 维 C',
    kind: 'covered',
    request: {
      ingredients: ['vitamin-d', 'calcium', 'vitamin-c'],
      medications: [],
      conditions: ['kidney-stone-history'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['stone_risk_hypercalciuria', 'stone_risk_total_calcium_load', 'oxalate_stone_risk'],
  },
  {
    id: 'Q13',
    desc: '胃溃疡 + 镁',
    kind: 'covered',
    request: { ingredients: ['magnesium'], medications: [], conditions: ['gastric-ulcer'] },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['poor_absorption_osmotic_diarrhea'],
  },
  {
    id: 'Q14',
    desc: '高血压 + 糖尿病 + 二甲双胍 + 降压药 + 铬 + 肉桂',
    kind: 'covered',
    request: {
      ingredients: ['chromium', 'cinnamon'],
      medications: ['metformin', 'amlodipine', 'diabetes-medications', 'antihypertensive-stack'],
      conditions: [],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['glucose_lowering_additive'],
  },
  {
    id: 'Q15',
    desc: '甲减 + 优甲乐 + 钙片',
    kind: 'covered',
    request: {
      ingredients: ['calcium'],
      medications: ['levothyroxine'],
      conditions: ['thyroid-disorder'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['reduced_absorption_levothyroxine'],
  },
  {
    id: 'Q16',
    desc: '桥本甲状腺炎 + 硒酵母（推荐）',
    kind: 'missing-l1-rule',
    skipReason: 'L1 无"selenium × hashimoto green positive recommendation"正向规则',
  },
  {
    id: 'Q17',
    desc: '痛风 + 烟酸',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 niacin ingredient + gout condition slug',
  },
  {
    id: 'Q18',
    desc: '缺铁性贫血 + 维 C 协同补铁',
    kind: 'missing-l1-rule',
    skipReason: 'L1 无"vitamin-c + iron green synergistic"正向规则',
  },
  {
    id: 'Q19',
    desc: '乳糖不耐受 + 含乳糖益生菌',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 lactose-intolerance condition + 赋形剂判定层',
  },
  {
    id: 'Q20',
    desc: '脂肪肝 + 水飞蓟（推荐）',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 milk-thistle ingredient + nafld condition',
  },

  // ---- C 多补剂组合 × 时间 (10) ----
  {
    id: 'Q21',
    desc: '7 种补剂 + 无禁忌上下文 → 全部 green no_known_risk',
    kind: 'fallback',
    request: {
      ingredients: ['fish-oil', 'vitamin-d', 'magnesium', 'vitamin-b-complex', 'vitamin-c'],
      medications: [],
      conditions: [],
    },
    expectedOverall: 'green',
    expectedGreenNoKnownRisk: ['fish-oil', 'vitamin-d', 'magnesium', 'vitamin-b-complex', 'vitamin-c'],
  },
  {
    id: 'Q22',
    desc: '6 种补剂分次 vs 一把全吃',
    kind: 'non-l2-decision',
    skipReason: '决策辅助（FR-4 时间分配建议），不属 L2 judgment',
  },
  {
    id: 'Q23',
    desc: '一起补 vs 先补一种再加（决策辅助）',
    kind: 'non-l2-decision',
    skipReason: '决策辅助场景，不属 L2 judgment',
  },
  {
    id: 'Q24',
    desc: '钙 + 镁同服（误解澄清）',
    kind: 'covered',
    request: {
      ingredients: ['calcium'],
      medications: [],
      conditions: [],
      timings: ['magnesium-highdose-window'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['high_mineral_load_split_dose'],
  },
  {
    id: 'Q25',
    desc: '铁 + 钙同窗（吸收干扰）',
    kind: 'covered',
    request: {
      ingredients: ['calcium'],
      medications: [],
      conditions: [],
      timings: ['iron-window-overlap'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['mineral_competition_absorption'],
  },
  {
    id: 'Q26',
    desc: '锌 vs 铜配比（长期高剂量）',
    kind: 'covered',
    request: {
      ingredients: ['zinc'],
      medications: [],
      conditions: [],
      strategies: ['long-term-high-dose'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['zinc_long_term_requires_reassessment'],
  },
  {
    id: 'Q27',
    desc: '维 D + K2 协同',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 vitamin-k2 ingredient（仅 vitamin-k）+ 缺 synergy 正向规则',
  },
  {
    id: 'Q28',
    desc: '益生菌 vs 抗生素时序',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 antibiotic drugClass + 益生菌时序规则',
  },
  {
    id: 'Q29',
    desc: '铁剂隔天空腹 vs 每天饭后',
    kind: 'covered',
    request: {
      ingredients: ['iron'],
      medications: [],
      conditions: [],
      strategies: ['long-term-high-dose'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['iron_long_term_requires_reassessment'],
  },
  {
    id: 'Q30',
    desc: '运动前后蛋白粉/BCAA/肌酸',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 protein-powder / bcaa / creatine ingredients',
  },

  // ---- D 食物饮品 × 吸收 (10) ----
  {
    id: 'Q31',
    desc: '咖啡同窗 × 铁/钙/B 族吸收',
    kind: 'covered',
    request: {
      ingredients: ['iron', 'calcium', 'vitamin-b-complex'],
      medications: [],
      conditions: [],
      timings: ['coffee-window'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: [
      'coffee_reduces_iron_absorption',
      'coffee_reduces_calcium_absorption',
      'coffee_reduces_b_absorption_context',
    ],
  },
  {
    id: 'Q32',
    desc: '钙片 + 牛奶（高单剂量）',
    kind: 'covered',
    request: {
      ingredients: ['calcium'],
      medications: [],
      conditions: [],
      strategies: ['single-dose-over-500mg'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['single_dose_absorption_drop'],
  },
  {
    id: 'Q33',
    desc: '绿茶 + 铁',
    kind: 'covered',
    request: {
      ingredients: ['iron'],
      medications: [],
      conditions: [],
      timings: ['green-tea-window'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['tea_polyphenol_reduces_iron'],
  },
  {
    id: 'Q34',
    desc: '鱼油饭前 vs 饭后',
    kind: 'covered',
    request: {
      ingredients: ['fish-oil'],
      medications: [],
      conditions: [],
      timings: ['no-fat-meal'],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['reduced_absorption_fat_soluble_context'],
  },
  {
    id: 'Q35',
    desc: '益生菌热水冲（活菌失效）',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 hot-water-prep timing slug + 活性失效规则（属冲调指南，FR-4 翻译层更合适）',
  },
  {
    id: 'Q36',
    desc: '酒精 + 褪黑素',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 melatonin ingredient + alcohol substance',
  },
  {
    id: 'Q37',
    desc: '豆浆/燕麦奶送服补剂',
    kind: 'non-l2-decision',
    skipReason: '送服载体差异（植酸 vs 中性），属 FR-4 翻译层',
  },
  {
    id: 'Q38',
    desc: '维 C + 海鲜（砒霜谣言澄清）',
    kind: 'non-l2-decision',
    skipReason: '谣言澄清属 FR-4 翻译 + compliance 反误导，不属 L2 风险判定',
  },
  {
    id: 'Q39',
    desc: '葡萄柚汁 × CYP3A4',
    kind: 'missing-l1-substance',
    skipReason: 'L1 缺 grapefruit-juice timing + CYP3A4 修饰机制',
  },
  {
    id: 'Q40',
    desc: '红枣枸杞 vs 维 C/铁补剂',
    kind: 'non-l2-decision',
    skipReason: '食补 vs 补剂量化对比，属 FR-4 翻译层',
  },

  // ---- E 成分形式选择 (10) ----  全部 N/A（FR-4 形式翻译）
  { id: 'Q41', desc: '镁形式：甘氨酸/苏糖酸/氧化/柠檬酸', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q42', desc: '鱼油 EPA:DHA 比例', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q43', desc: '维 D2 vs D3', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q44', desc: 'B 族活性型 vs 普通型', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q45', desc: '碳酸钙 vs 柠檬酸钙 vs 海藻钙', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q46', desc: '锌的 3 种形式', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q47', desc: '胶原蛋白 I/II/III 型', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q48', desc: 'Q10 泛醌 vs 泛醇', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译' },
  { id: 'Q49', desc: '天然 vs 合成维 E（d- vs dl-）', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译 + FR-5 标签' },
  { id: 'Q50', desc: '姜黄素 + 胡椒碱协同', kind: 'non-l2-form', skipReason: 'FR-4 形式翻译（协同机制）' },

  // ---- F 儿童专属 (10) ----  L1 缺婴幼儿/儿童 specialGroup
  { id: 'Q51', desc: '2 岁宝宝维 D 滴剂剂量', kind: 'missing-l1-substance', skipReason: 'L1 缺 pediatric/infant specialGroup + 剂量上限规则' },
  { id: 'Q52', desc: '儿童维生素软糖过量风险', kind: 'missing-l1-substance', skipReason: 'L1 缺 pediatric specialGroup' },
  {
    id: 'Q53',
    desc: '6 个月婴儿维 A 滴剂（婴幼儿急性中毒，红）',
    kind: 'covered',
    request: {
      ingredients: ['vitamin-a'],
      medications: [],
      conditions: [],
      specialGroups: ['infant'],
    },
    expectedOverall: 'red',
    expectedReasonCodes: ['infant_vitamina_overdose_risk'],
  },
  { id: 'Q54', desc: '挑食孩子 + 钙片（决策辅助）', kind: 'non-l2-decision', skipReason: '焦虑修正 + 决策辅助' },
  { id: 'Q55', desc: '儿童阿莫西林 + 益生菌', kind: 'missing-l1-substance', skipReason: 'L1 缺 antibiotic drugClass + pediatric specialGroup' },
  { id: 'Q56', desc: '13 岁初潮 + 补铁（决策）', kind: 'non-l2-decision', skipReason: '"先查再补"决策辅助' },
  { id: 'Q57', desc: '儿童 DHA 必要性', kind: 'non-l2-decision', skipReason: '决策辅助（pediatric DHA 必要性判断）' },
  { id: 'Q58', desc: '宝宝湿疹 + 益生菌', kind: 'missing-l1-substance', skipReason: 'L1 缺 pediatric-eczema condition + 菌株证据' },
  { id: 'Q59', desc: '感冒 + 锌含片（24h 内）', kind: 'missing-l1-substance', skipReason: 'L1 缺 cold-onset timing + 锌含片剂型' },
  { id: 'Q60', desc: '青春期痤疮 + 锌', kind: 'missing-l1-substance', skipReason: 'L1 缺 acne condition' },

  // ---- G 老人专属 (10) ----
  {
    id: 'Q61',
    desc: '爸爸三药（降压+降糖+他汀）+ 鱼油',
    kind: 'covered',
    request: {
      ingredients: ['fish-oil'],
      medications: ['amlodipine', 'antihypertensive-stack', 'diabetes-medications'],
      conditions: [],
    },
    expectedOverall: 'yellow',
    expectedReasonCodes: ['bp_lowering_additive'],
  },
  { id: 'Q62', desc: '吞咽困难 + 鱼油胶囊掰开', kind: 'non-l2-decision', skipReason: '剂型选择建议（FR-4），不属 L2' },
  { id: 'Q63', desc: '80 岁消瘦 + 蛋白粉/钙/维 D', kind: 'missing-l1-substance', skipReason: 'L1 缺 sarcopenia/frailty condition + protein-powder ingredient' },
  { id: 'Q64', desc: 'NMN 抗衰', kind: 'missing-l1-substance', skipReason: 'L1 缺 nmn ingredient + 长期安全性数据' },
  {
    id: 'Q65',
    desc: '肾功能下降（eGFR 50）+ 镁（高镁血症，红）',
    kind: 'covered',
    request: {
      ingredients: ['magnesium'],
      medications: [],
      conditions: ['kidney-impairment'],
    },
    expectedOverall: 'red',
    expectedReasonCodes: ['magnesium_accumulation_renal_impairment'],
  },
  { id: 'Q66', desc: '骨松双磷酸盐 + 钙时序', kind: 'missing-l1-substance', skipReason: 'L1 缺 bisphosphonate drugClass + 时序规则' },
  {
    id: 'Q67',
    desc: '银杏叶 + 华法林（出血风险，红）',
    kind: 'covered',
    request: {
      ingredients: ['ginkgo'],
      medications: ['warfarin'],
      conditions: [],
    },
    expectedOverall: 'red',
    expectedReasonCodes: ['bleeding_risk_anticoagulant_synergy'],
  },
  { id: 'Q68', desc: '老年便秘：镁 vs 益生菌', kind: 'non-l2-decision', skipReason: '症状导向决策' },
  { id: 'Q69', desc: '糖尿病 + α-硫辛酸', kind: 'missing-l1-substance', skipReason: 'L1 缺 alpha-lipoic-acid ingredient' },
  { id: 'Q70', desc: '老人腿抽筋：钙 vs 镁', kind: 'non-l2-decision', skipReason: '症状归因决策' },

  // ---- H 孕产期 × 女性周期 (10) ----
  { id: 'Q71', desc: '备孕叶酸时窗', kind: 'non-l2-decision', skipReason: '强推荐+时窗指引（FR-4 决策辅助）' },
  {
    id: 'Q72',
    desc: '孕 32 周继续叶酸（灰）',
    kind: 'fallback',
    request: { ingredients: ['folate'], medications: [], conditions: [], specialGroups: ['pregnancy'] },
    expectedOverall: 'green',
    expectedGreenNoKnownRisk: ['folate'],
  },
  { id: 'Q73', desc: '孕期蔓越莓胶囊', kind: 'missing-l1-substance', skipReason: 'L1 缺 cranberry ingredient' },
  {
    id: 'Q74',
    desc: '哺乳期鱼油（绿，DHA 推荐）',
    kind: 'fallback',
    request: { ingredients: ['fish-oil'], medications: [], conditions: [] },
    expectedOverall: 'green',
    expectedGreenNoKnownRisk: ['fish-oil'],
  },
  { id: 'Q75', desc: '多囊 + 肌醇', kind: 'missing-l1-substance', skipReason: 'L1 缺 inositol ingredient + pcos condition' },
  { id: 'Q76', desc: '经量大 + 补铁（决策）', kind: 'non-l2-decision', skipReason: '"先查后补"决策辅助' },
  { id: 'Q77', desc: '更年期 + 黑升麻', kind: 'missing-l1-substance', skipReason: 'L1 缺 black-cohosh ingredient + menopause specialGroup' },
  {
    id: 'Q78',
    desc: '孕期 + 高剂量维 A（红）',
    kind: 'covered',
    request: {
      ingredients: ['vitamin-a'],
      medications: [],
      conditions: [],
      specialGroups: ['pregnancy'],
    },
    expectedOverall: 'red',
    expectedReasonCodes: ['retinol_pregnancy_teratogenicity'],
  },
  {
    id: 'Q79',
    desc: '哺乳期妈妈贫血 + 补铁',
    kind: 'fallback',
    request: { ingredients: ['iron'], medications: [], conditions: [] },
    expectedOverall: 'green',
    expectedGreenNoKnownRisk: ['iron'],
  },
  { id: 'Q80', desc: '产后脱发 + 铁/维 D/生物素', kind: 'non-l2-decision', skipReason: '"先排查再补"决策辅助 + 多因归因' },

  // ---- I 心理社交决策 (10) ----  约束：只回答安全侧
  { id: 'Q81', desc: '博主推胶原肽"一周见效"', kind: 'non-l2-decision', skipReason: '宣称识别 + 期望管理（FR-4 翻译 + compliance）' },
  { id: 'Q82', desc: '婆婆送人参', kind: 'missing-l1-substance', skipReason: 'L1 缺 ginseng ingredient' },
  { id: 'Q83', desc: '闺蜜推减脂胶囊', kind: 'missing-l1-substance', skipReason: 'L1 缺 weight-loss compounds + 违规成分识别' },
  { id: 'Q84', desc: '麦角硫因跟风', kind: 'non-l2-decision', skipReason: '证据等级宣称识别' },
  { id: 'Q85', desc: '过期 3 个月鱼油', kind: 'missing-l1-substance', skipReason: 'L1 缺 expired strategy（属储存/质量层）' },
  { id: 'Q86', desc: '看 100 篇笔记决策瘫痪', kind: 'non-l2-decision', skipReason: 'FR-1 决策入口（首页 Hero 引导）' },
  { id: 'Q87', desc: '生酮 + 膳食纤维（无效追问）', kind: 'non-l2-decision', skipReason: '目标定义 + 追问' },
  { id: 'Q88', desc: '妈妈微商养生茶"治"三高（红）', kind: 'non-l2-decision', skipReason: '宣称识别（compliance 红线 §11.2 banned word "治"），不属 L2' },
  { id: 'Q89', desc: '健身教练推预锻炼粉', kind: 'missing-l1-substance', skipReason: 'L1 缺 caffeine 高剂量 ingredient + 兴奋剂复合识别' },
  { id: 'Q90', desc: '日本抗糖丸跟风', kind: 'non-l2-decision', skipReason: '抗糖概念澄清 + 期望管理' },

  // ---- J 品牌 × 标签阅读 (10) ----  全部 N/A（FR-4/FR-5 标签翻译）
  { id: 'Q91', desc: 'IU vs mcg 单位换算', kind: 'non-l2-form', skipReason: 'FR-5 单位翻译' },
  { id: 'Q92', desc: '%DV 含义（Daily Value）', kind: 'non-l2-form', skipReason: 'FR-5 标签读法' },
  { id: 'Q93', desc: '明胶素食/宗教适用性', kind: 'non-l2-form', skipReason: 'FR-4 赋形剂' },
  { id: 'Q94', desc: '跨境购无蓝帽', kind: 'non-l2-form', skipReason: 'FR-5 合规识别' },
  { id: 'Q95', desc: 'calcium carbonate 成分识别', kind: 'non-l2-form', skipReason: 'FR-4 成分名翻译' },
  { id: 'Q96', desc: '鱼油总量 vs EPA+DHA 纯度', kind: 'non-l2-form', skipReason: 'FR-4 + FR-5 含量陷阱' },
  { id: 'Q97', desc: '代购 GNC 真伪辨识', kind: 'non-l2-form', skipReason: 'FR-5 真伪' },
  { id: 'Q98', desc: '二氧化钛赋形剂安全性', kind: 'non-l2-form', skipReason: 'FR-4 风险沟通' },
  { id: 'Q99', desc: '活性叶酸 vs 普通叶酸标签', kind: 'non-l2-form', skipReason: 'FR-4 形式 + FR-5 标签' },
  { id: 'Q100', desc: '"天然"营销话术识别', kind: 'non-l2-form', skipReason: 'FR-4 宣称识别 + FR-5 标签' },
];

// ============================================================================
// Coverage stats (printed at end via afterAll)
// ============================================================================

interface KindStats {
  total: number;
  byKind: Record<CaseKind, number>;
  runnable: number;
  skipped: number;
}

function summarize(): KindStats {
  const byKind = {
    covered: 0,
    fallback: 0,
    'missing-l1-rule': 0,
    'missing-l1-substance': 0,
    'non-l2-form': 0,
    'non-l2-decision': 0,
  } as Record<CaseKind, number>;
  for (const c of SEED_CASES) byKind[c.kind]++;
  const runnable = byKind.covered + byKind.fallback;
  return {
    total: SEED_CASES.length,
    byKind,
    runnable,
    skipped: SEED_CASES.length - runnable,
  };
}

// ============================================================================
// Suite
// ============================================================================

describe('seed-questions × L2 SafetyJudgment（CLAUDE.md §14 merge gate · 100 条）', () => {
  for (const c of SEED_CASES) {
    const isRunnable = c.kind === 'covered' || c.kind === 'fallback';
    const fn = isRunnable ? it : it.skip;
    const title = isRunnable
      ? `${c.id} [${c.kind}] — ${c.desc}`
      : `${c.id} [${c.kind}] — ${c.desc}（${c.skipReason ?? '无原因'}）`;

    fn(title, async () => {
      // 类型守卫：可执行 case 必有 request + expectedOverall
      if (!c.request || !c.expectedOverall) {
        throw new Error(`${c.id} runnable case 缺 request/expectedOverall`);
      }

      const res = await judge(`seed-${c.id.toLowerCase()}`, c.request);

      expect(res.overallLevel, `${c.id} overallLevel mismatch`).toBe(c.expectedOverall);

      if (c.expectedReasonCodes) {
        const codes = new Set(res.risks.map((r) => r.reasonCode));
        for (const expected of c.expectedReasonCodes) {
          expect(
            codes.has(expected),
            `${c.id} 期望命中 reasonCode=${expected}，实际命中：${[...codes].join(', ')}`,
          ).toBe(true);
        }
      }

      if (c.expectedGreenNoKnownRisk) {
        for (const ing of c.expectedGreenNoKnownRisk) {
          const r = res.risks.find((x) => x.ingredient === ing);
          expect(r, `${c.id} 期望 ingredient=${ing} 出现在 risks 内`).toBeDefined();
          expect(r?.level, `${c.id} ingredient=${ing} 应为 green`).toBe('green');
          expect(r?.reasonCode, `${c.id} ingredient=${ing} 应为 no_known_risk`).toBe('no_known_risk');
        }
      }

      if (c.expectedGrayNoData) {
        for (const ing of c.expectedGrayNoData) {
          const r = res.risks.find((x) => x.ingredient === ing);
          expect(r, `${c.id} 期望 ingredient=${ing} 出现在 risks 内`).toBeDefined();
          expect(r?.level, `${c.id} ingredient=${ing} 应为 gray`).toBe('gray');
          expect(r?.reasonCode, `${c.id} ingredient=${ing} 应为 no_data`).toBe('no_data');
        }
      }
    });
  }

  it('覆盖率自检：可执行 case ≥ 17 条 / 红 ≥ 1 / 黄 ≥ 10 / 绿 ≥ 4', () => {
    const runnable = SEED_CASES.filter((c) => c.kind === 'covered' || c.kind === 'fallback');
    expect(runnable.length).toBeGreaterThanOrEqual(17);
    expect(runnable.filter((c) => c.expectedOverall === 'red').length).toBeGreaterThanOrEqual(1);
    expect(runnable.filter((c) => c.expectedOverall === 'yellow').length).toBeGreaterThanOrEqual(10);
    expect(runnable.filter((c) => c.expectedOverall === 'green').length).toBeGreaterThanOrEqual(4);
  });

  afterAll(() => {
    const s = summarize();
    // eslint-disable-next-line no-console
    console.log(
      [
        '',
        '─── seed-questions 100 coverage report ───',
        `total           : ${s.total}`,
        `runnable        : ${s.runnable}`,
        `skipped         : ${s.skipped}`,
        '',
        'by kind:',
        `  covered                : ${s.byKind.covered}    （L1 已有规则）`,
        `  fallback               : ${s.byKind.fallback}    （走 green/gray 兜底）`,
        `  missing-l1-rule        : ${s.byKind['missing-l1-rule']}    （已有 substance，缺规则）`,
        `  missing-l1-substance   : ${s.byKind['missing-l1-substance']}    （缺 ingredient/condition slug）`,
        `  non-l2-form            : ${s.byKind['non-l2-form']}    （FR-4/5 形式或标签翻译）`,
        `  non-l2-decision        : ${s.byKind['non-l2-decision']}    （决策辅助 / 宣称识别）`,
        '─────────────────────────────────────────',
        '',
      ].join('\n'),
    );
  });
});
