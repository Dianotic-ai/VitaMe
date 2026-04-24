// file: tests/unit/queryIntake/slotResolver.spec.ts — L0 slotResolver TDD
//
// 对齐 design spec docs/engineering/specs/query-intake.md §c
//   + CLAUDE.md §10.0（L0 rules）/ §13.1（强 TDD）
//
// 覆盖：
//   - 决策表 4 条规则（product_disambiguation × 2 / medication_context / symptom_specificity / unclear）
//   - passThrough 构造（grounded.* slugs → LookupRequest）
//   - 高风险 ingredient 触发 medication_context（vk_like × warfarin 风险）
//   - 笼统症状词触发 symptom_specificity
//   - 已提供 context 不再触发 medication_context
//   - 设计 spec §Testing 场景 3 + 场景 5 必覆盖

import { describe, it, expect } from 'vitest';
import { slotResolver } from '@/lib/capabilities/queryIntake/slotResolver';
import { MEDICATION_OPTION_MAP } from '@/lib/api/slugMappings';
import type { IntentResult, GroundedMentions } from '@/lib/types/intent';

// ──────────────────────────────────────────────────────────────────────────
// 测试 fixture helpers — 构造最小可用的 IntentResult / GroundedMentions
// ──────────────────────────────────────────────────────────────────────────

function makeIntent(overrides: Partial<IntentResult> = {}): IntentResult {
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

function makeGrounded(overrides: Partial<GroundedMentions> = {}): GroundedMentions {
  return {
    ingredientSlugs: [],
    medicationSlugs: [],
    conditionSlugs: [],
    specialGroupSlugs: [],
    ungroundedMentions: [],
    ...overrides,
  };
}

describe('slotResolver — 决策规则与 passThrough 构造', () => {
  it('happy path: 已 ground 的 ingredient + 上下文充分 → passThrough，不 clarify', () => {
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['维生素 D'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['vitamin-d'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.clarifyTopic).toBeNull();
    expect(decision.clarifyChoices).toEqual([]);
    expect(decision.passThrough).not.toBeNull();
    expect(decision.passThrough?.ingredients).toEqual(['vitamin-d']);
    expect(decision.passThrough?.medications).toEqual([]);
    expect(decision.passThrough?.conditions).toEqual([]);
    expect(decision.passThrough?.specialGroups).toEqual([]);
  });

  it('场景 3 — Q10 单独出现（高风险）→ 触发 medication_context clarify', () => {
    // design spec §Testing 场景 3：辅酶 Q10 在高风险列表（vk_like × warfarin），
    // 缺 medication 上下文必须问一句。
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['辅酶 Q10'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['coenzyme-q10'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(true);
    expect(decision.clarifyTopic).toBe('medication_context');
    expect(decision.clarifyChoices).toEqual(Object.keys(MEDICATION_OPTION_MAP));
    expect(decision.clarifyChoices).toContain('华法林 / 抗凝药');
    expect(decision.passThrough).toBeNull();
  });

  it('fish-oil 单独出现 → 同样触发 medication_context（出血风险 × 抗凝）', () => {
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['鱼油'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['fish-oil'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(true);
    expect(decision.clarifyTopic).toBe('medication_context');
    expect(decision.clarifyChoices).toEqual(Object.keys(MEDICATION_OPTION_MAP));
    expect(decision.passThrough).toBeNull();
  });

  it('product_safety_check + 商品名但没 ingredientMentions → product_disambiguation 固定 3 选', () => {
    const intent = makeIntent({
      intent: 'product_safety_check',
      productMentions: ['Swisse 葡萄籽'],
      ingredientMentions: [], // 关键：用户给了品牌没说成分
    });
    const grounded = makeGrounded(); // 全空

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(true);
    expect(decision.clarifyTopic).toBe('product_disambiguation');
    expect(decision.clarifyChoices).toEqual([
      '拍照配料表',
      '手动输入主要成分',
      '我不确定',
    ]);
    expect(decision.passThrough).toBeNull();
  });

  it('symptom_goal_query + 笼统症状词 ("累") → symptom_specificity 4 选', () => {
    const intent = makeIntent({
      intent: 'symptom_goal_query',
      symptomMentions: ['累'],
    });
    const grounded = makeGrounded();

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(true);
    expect(decision.clarifyTopic).toBe('symptom_specificity');
    expect(decision.clarifyChoices).toEqual(['睡眠', '精力', '消化', '免疫']);
    expect(decision.passThrough).toBeNull();
  });

  it('symptom_goal_query + 具体症状（不在笼统列表）→ 不 clarify, passThrough', () => {
    // "偏头痛" 是具体症状，不应触发 symptom_specificity
    const intent = makeIntent({
      intent: 'symptom_goal_query',
      symptomMentions: ['偏头痛'],
    });
    const grounded = makeGrounded();

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.clarifyTopic).toBeNull();
    expect(decision.passThrough).not.toBeNull();
  });

  it('intent=unclear → 总是触发 product_disambiguation 兜底 3 选', () => {
    const intent = makeIntent({ intent: 'unclear' });
    const grounded = makeGrounded();

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(true);
    expect(decision.clarifyTopic).toBe('product_disambiguation');
    expect(decision.clarifyChoices).toEqual([
      '某个补剂的安全性',
      '某个症状能补什么',
      '都不是',
    ]);
    expect(decision.passThrough).toBeNull();
  });

  it('Q10 + 已提供 medication 上下文 → 不 clarify（已知在用什么药），passThrough 完整', () => {
    // medication_context 触发条件要求 medicationSlugs/conditionSlugs/specialGroupSlugs 全空
    // 任何一个已提供 → 走 passThrough
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['辅酶 Q10'],
      medicationMentions: ['华法林'],
    });
    const grounded = makeGrounded({
      ingredientSlugs: ['coenzyme-q10'],
      medicationSlugs: ['warfarin'],
    });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.clarifyTopic).toBeNull();
    expect(decision.passThrough?.ingredients).toEqual(['coenzyme-q10']);
    expect(decision.passThrough?.medications).toEqual(['warfarin']);
  });

  it('场景 5 — product 提到但 ingredient 已 ground → 不 clarify, passThrough.ingredients=[magnesium]', () => {
    // design spec §Testing 场景 5：用户输入 "Doctor's Best 镁片"
    // product mention 还在，但 ingredient 已经 ground 到 magnesium
    // product_disambiguation 触发条件要求 ingredientMentions 为空，所以这里不触发
    const intent = makeIntent({
      intent: 'product_safety_check',
      productMentions: ["Doctor's Best 镁片"],
      ingredientMentions: ['镁'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['magnesium'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.passThrough?.ingredients).toEqual(['magnesium']);
  });

  it('symptom_goal_query 具体症状 + ground 出 ingredient → passThrough 带 ingredient', () => {
    // 用户："偏头痛能不能补镁" — 具体症状且 ground 到镁
    const intent = makeIntent({
      intent: 'symptom_goal_query',
      symptomMentions: ['偏头痛'],
      ingredientMentions: ['镁'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['magnesium'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.passThrough?.ingredients).toEqual(['magnesium']);
  });

  it('low-risk ingredient（不在高风险列表）单独 → 不触发 medication_context', () => {
    // 比如 vitamin-d 不在 HIGH_RISK 列表
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['维 D'],
    });
    const grounded = makeGrounded({ ingredientSlugs: ['vitamin-d'] });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.passThrough?.ingredients).toEqual(['vitamin-d']);
  });

  it('高风险 ingredient + 已提供 condition → 不 clarify（context 已存在）', () => {
    // condition 也算 context，不该再问 medication
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['鱼油'],
      conditionMentions: ['胃溃疡'],
    });
    const grounded = makeGrounded({
      ingredientSlugs: ['fish-oil'],
      conditionSlugs: ['gastric-ulcer'],
    });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.passThrough?.conditions).toEqual(['gastric-ulcer']);
  });

  it('高风险 ingredient + specialGroup 已提供 → 不 clarify', () => {
    const intent = makeIntent({
      intent: 'product_safety_check',
      ingredientMentions: ['鱼油'],
      specialGroupMentions: ['孕期'],
    });
    const grounded = makeGrounded({
      ingredientSlugs: ['fish-oil'],
      specialGroupSlugs: ['pregnancy'],
    });

    const decision = slotResolver(intent, grounded);

    expect(decision.shouldClarify).toBe(false);
    expect(decision.passThrough?.specialGroups).toEqual(['pregnancy']);
  });
});
