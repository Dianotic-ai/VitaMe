// file: tests/unit/queryIntake/groundMentions.spec.ts — L0 groundMentions TDD
//
// 对齐 docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md §b（grounding rules）
// + CLAUDE.md §10.0 / §13.1（L0 强 TDD）
//
// groundMentions 是 L0 的纯确定性子模块：把 parseIntent 抽出来的中文 mention
// 翻成 contraindications.ts / suppai-interactions.ts 用的 slug。
// 无 LLM、无 IO、同步函数。
//
// 已知 slug 数据现状（D5）：
//   - cn-dri-values.ts: 23 条 ingredient（biotin / calcium / magnesium / ...）
//   - lpi-values.ts:    30 条（含 'coq10'，注意 lpi 用 coq10、其余表用 coenzyme-q10）
//   - pubchem-cids.ts:  含 fish-oil / coenzyme-q10
//   - INGREDIENT_QUERY_MAP: 中文 keyword（鱼油 / 辅酶 q10 / 镁 / ...） → slug[]
//   - MEDICATION_OPTION_MAP: '华法林 / 抗凝药' / 'SSRI / 抗抑郁药' / ...
//   - CONDITION_OPTION_MAP: 胃溃疡 / 胃肠敏感 / 高血压(=[]) / ...
//   - SPECIAL_GROUP_OPTION_MAP: 孕期 / 哺乳期(=[]) / ...

import { describe, it, expect } from 'vitest';
import { groundMentions } from '@/lib/capabilities/queryIntake/groundMentions';
import type { IntentResult } from '@/lib/types/intent';

/** 帮助：构造一个最小的合规 IntentResult（其余字段空数组）。 */
function makeIntent(overrides: Partial<IntentResult>): IntentResult {
  return {
    intent: 'product_safety_check',
    productMentions: [],
    ingredientMentions: [],
    medicationMentions: [],
    conditionMentions: [],
    specialGroupMentions: [],
    symptomMentions: [],
    missingSlots: [],
    clarifyingQuestion: null,
    ...overrides,
  };
}

describe('groundMentions — alias 表 + L1 fuzzy 把 mention 翻成 slug', () => {
  it('1. 基础 happy path：鱼油 + 辅酶 Q10 + 华法林 + 胃溃疡 → 全部 grounded', () => {
    const intent = makeIntent({
      ingredientMentions: ['鱼油', '辅酶 Q10'],
      medicationMentions: ['华法林'],
      conditionMentions: ['胃溃疡'],
    });
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual(expect.arrayContaining(['fish-oil', 'coenzyme-q10']));
    expect(out.ingredientSlugs).toHaveLength(2);
    expect(out.medicationSlugs).toEqual(['warfarin']);
    expect(out.conditionSlugs).toEqual(['gastric-ulcer']);
    expect(out.specialGroupSlugs).toEqual([]);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it("2. 场景 5（design spec）：product 没 slug 但 ingredient 有 → product 不进 ungrounded（P0 不 ground product）", () => {
    const intent = makeIntent({
      productMentions: ["Doctor's Best 镁片"],
      ingredientMentions: ['镁'],
    });
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual(['magnesium']);
    expect(out.ungroundedMentions).toEqual([]); // product 不在 P0 grounding 范围
  });

  it('3. mention 已经是 slug：fish-oil → 直接 grounded（L1 fuzzy 命中 PubChem）', () => {
    const intent = makeIntent({ ingredientMentions: ['fish-oil'] });
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual(['fish-oil']);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('4. 未识别成分：黄金燕窝肽 → ingredientSlugs 空 + 进 ungroundedMentions(kind=ingredient, candidates=[])', () => {
    const intent = makeIntent({ ingredientMentions: ['黄金燕窝肽'] });
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual([]);
    expect(out.ungroundedMentions).toEqual([
      { raw: '黄金燕窝肽', kind: 'ingredient', candidates: [] },
    ]);
  });

  it('5. 大小写不敏感：Fish Oil / COQ10 → 应 ground', () => {
    const intent = makeIntent({ ingredientMentions: ['Fish Oil', 'COQ10'] });
    const out = groundMentions(intent);
    // 'Fish Oil' → INGREDIENT_QUERY_MAP['fish oil'] = 'fish-oil'
    // 'COQ10'   → 包含 'q10'（INGREDIENT_QUERY_MAP['q10'] = 'coenzyme-q10'）
    //             或 'coq10'（lpi 直接 slug 命中也可）
    expect(out.ingredientSlugs).toEqual(expect.arrayContaining(['fish-oil']));
    // COQ10 至少要 ground 出一种 q10 形式的 slug
    const hasSomeQ10 = out.ingredientSlugs.some(
      (s) => s === 'coenzyme-q10' || s === 'coq10',
    );
    expect(hasSomeQ10).toBe(true);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('6. 多个 mention 翻成同一个 slug：鱼油 + omega-3 + fish-oil → dedupe 到 1 个 fish-oil', () => {
    const intent = makeIntent({
      ingredientMentions: ['鱼油', 'omega-3', 'fish-oil'],
    });
    const out = groundMentions(intent);
    // 三个 mention 都应翻成 fish-oil（slugMappings: 鱼油/omega/epa/dha → fish-oil；fish-oil 本身 L1 命中）
    expect(out.ingredientSlugs).toEqual(['fish-oil']);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('7. 空 IntentResult：所有 mention 为空 → 所有 slug 为空 + ungroundedMentions=[]', () => {
    const intent = makeIntent({});
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual([]);
    expect(out.medicationSlugs).toEqual([]);
    expect(out.conditionSlugs).toEqual([]);
    expect(out.specialGroupSlugs).toEqual([]);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('8. condition 映射到空数组：高血压 → 识别但不出 slug，不进 ungrounded', () => {
    // CONDITION_OPTION_MAP['高血压'] = []  ⇒ "我们认得这个词，但目前没有禁忌规则"
    // 不能视为 ungrounded（那是 candidates 待选），也不出 slug。
    const intent = makeIntent({ conditionMentions: ['高血压'] });
    const out = groundMentions(intent);
    expect(out.conditionSlugs).toEqual([]);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('9. specialGroup 已知：孕期 → ["pregnancy"]', () => {
    const intent = makeIntent({ specialGroupMentions: ['孕期'] });
    const out = groundMentions(intent);
    expect(out.specialGroupSlugs).toEqual(['pregnancy']);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it("10. medication 含分隔符的 key：'华法林' → 匹配 '华法林 / 抗凝药' → ['warfarin']", () => {
    // MEDICATION_OPTION_MAP 的 key 是组合标签（'华法林 / 抗凝药'），
    // LLM 抽出来通常只是其中一段（'华法林'）；substring 匹配应能命中。
    const intent = makeIntent({ medicationMentions: ['华法林'] });
    const out = groundMentions(intent);
    expect(out.medicationSlugs).toEqual(['warfarin']);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('11. 未识别 medication：奇怪的中文药名 → ungrounded(kind=medication)', () => {
    const intent = makeIntent({ medicationMentions: ['某神秘药'] });
    const out = groundMentions(intent);
    expect(out.medicationSlugs).toEqual([]);
    expect(out.ungroundedMentions).toEqual([
      { raw: '某神秘药', kind: 'medication', candidates: [] },
    ]);
  });

  it("12. condition substring 匹配：'肝病' → 应命中 '肝病 / 脂肪肝' → ['active-hepatitis']", () => {
    const intent = makeIntent({ conditionMentions: ['肝病'] });
    const out = groundMentions(intent);
    expect(out.conditionSlugs).toEqual(['active-hepatitis']);
    expect(out.ungroundedMentions).toEqual([]);
  });

  it('13. 多种类混合：ingredient + medication + condition + specialGroup 同时给', () => {
    const intent = makeIntent({
      ingredientMentions: ['维生素 D'],
      medicationMentions: ['华法林'],
      conditionMentions: ['胃溃疡'],
      specialGroupMentions: ['孕期'],
    });
    const out = groundMentions(intent);
    expect(out.ingredientSlugs).toEqual(['vitamin-d']);
    expect(out.medicationSlugs).toEqual(['warfarin']);
    expect(out.conditionSlugs).toEqual(['gastric-ulcer']);
    expect(out.specialGroupSlugs).toEqual(['pregnancy']);
    expect(out.ungroundedMentions).toEqual([]);
  });
});
