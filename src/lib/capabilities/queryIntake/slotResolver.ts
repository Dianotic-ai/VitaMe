// file: src/lib/capabilities/queryIntake/slotResolver.ts — L0 slot 决策（纯确定性，无 LLM/IO）
//
// 角色：拿 parseIntent 的 IntentResult + groundMentions 的 GroundedMentions，
//       决定要不要再问用户一句（clarify），还是直接送 L2 SafetyJudgment（passThrough）。
//
// 依据：
//   - design spec docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md §c
//   - CLAUDE.md §10.0（L0 rules：禁判风险）
//   - CLAUDE.md §13.1（L0 强 TDD，先 spec 后实现）
//
// 决策规则（按顺序，first match 即返回）：
//   1. product_safety_check + 给了商品名但没成分 → product_disambiguation 固定 3 选
//   2. product_safety_check + 高风险 ingredient + medication/condition/specialGroup 全空
//      → medication_context（来自 MEDICATION_OPTION_MAP keys）
//   3. symptom_goal_query + 症状词都在笼统列表 → symptom_specificity 4 选
//   4. unclear → 总是 product_disambiguation 兜底 3 选
//   5. 否则 → passThrough，不 clarify

import type {
  IntentResult,
  GroundedMentions,
  SlotDecision,
} from '@/lib/types/intent';
import type { LookupRequest } from '@/lib/types/adapter';
import { MEDICATION_OPTION_MAP } from '@/lib/api/slugMappings';

// ──────────────────────────────────────────────────────────────────────────
// 高风险 ingredient 列表（P0 hardcoded）
// 触发 medication_context 的条件之一：这些成分缺 medication 上下文必须问。
// 主要风险来源：vk_like × warfarin（出血/抗凝相互作用）。
// 设计 spec §c 决策表 + §Testing 场景 3。
// ──────────────────────────────────────────────────────────────────────────
const HIGH_RISK_INGREDIENTS: ReadonlySet<string> = new Set([
  'coenzyme-q10', // vk_like × warfarin（场景 3）
  'fish-oil', // 出血风险 × warfarin
  'vitamin-k', // 直接 warfarin 拮抗
  'vitamin-e', // 出血风险
  'ginkgo', // 出血风险（前向兼容；P0 KB 可能未收录）
]);

// ──────────────────────────────────────────────────────────────────────────
// 笼统症状词（P0 hardcoded）
// 这些词出现时单独不足以推荐成分，必须 clarify 缩小到具体维度。
// 设计 spec §c 决策表 + §Testing 场景"我妈最近老觉得累"。
// ──────────────────────────────────────────────────────────────────────────
const VAGUE_SYMPTOM_TERMS: ReadonlySet<string> = new Set([
  '不舒服',
  '累',
  '疲劳',
  '没精神',
  '不好',
  '难受',
]);

// ──────────────────────────────────────────────────────────────────────────
// 固定 clarifyChoices 集合
// 设计 spec §c 决策表的"choices 来源"列。
// ──────────────────────────────────────────────────────────────────────────
const PRODUCT_DISAMBIGUATION_CHOICES = [
  '拍照配料表',
  '手动输入主要成分',
  '我不确定',
] as const;

const SYMPTOM_SPECIFICITY_CHOICES = ['睡眠', '精力', '消化', '免疫'] as const;

const UNCLEAR_FALLBACK_CHOICES = [
  '某个补剂的安全性',
  '某个症状能补什么',
  '都不是',
] as const;

// ──────────────────────────────────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────────────────────────────────

function hasHighRiskIngredient(slugs: readonly string[]): boolean {
  return slugs.some((s) => HIGH_RISK_INGREDIENTS.has(s));
}

function isVagueSymptom(mention: string): boolean {
  return VAGUE_SYMPTOM_TERMS.has(mention);
}

function buildPassThrough(grounded: GroundedMentions): LookupRequest {
  return {
    ingredients: grounded.ingredientSlugs,
    medications: grounded.medicationSlugs,
    conditions: grounded.conditionSlugs,
    specialGroups: grounded.specialGroupSlugs,
  };
}

function clarify(
  topic: SlotDecision['clarifyTopic'],
  choices: readonly string[],
): SlotDecision {
  return {
    shouldClarify: true,
    clarifyTopic: topic,
    clarifyChoices: [...choices],
    passThrough: null,
  };
}

function passThrough(grounded: GroundedMentions): SlotDecision {
  return {
    shouldClarify: false,
    clarifyTopic: null,
    clarifyChoices: [],
    passThrough: buildPassThrough(grounded),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 主入口
// ──────────────────────────────────────────────────────────────────────────

/**
 * 决定下一步走 clarify 还是 passThrough。
 * 纯函数，无 LLM、无 IO。
 */
export function slotResolver(
  intent: IntentResult,
  grounded: GroundedMentions,
): SlotDecision {
  // 规则 4（先判 unclear，因为它"always" 触发，避免被后面规则漏掉）
  if (intent.intent === 'unclear') {
    return clarify('product_disambiguation', UNCLEAR_FALLBACK_CHOICES);
  }

  // 规则 1：商品名给了但没说成分 — 必须先消歧
  if (
    intent.intent === 'product_safety_check' &&
    intent.productMentions.length > 0 &&
    intent.ingredientMentions.length === 0
  ) {
    return clarify('product_disambiguation', PRODUCT_DISAMBIGUATION_CHOICES);
  }

  // 规则 2：高风险 ingredient + 完全没 context → 问当前在用什么药
  if (
    intent.intent === 'product_safety_check' &&
    grounded.ingredientSlugs.length > 0 &&
    grounded.medicationSlugs.length === 0 &&
    grounded.conditionSlugs.length === 0 &&
    grounded.specialGroupSlugs.length === 0 &&
    hasHighRiskIngredient(grounded.ingredientSlugs)
  ) {
    return clarify('medication_context', Object.keys(MEDICATION_OPTION_MAP));
  }

  // 规则 3：symptom_goal_query + 全部 mention 都是笼统词
  if (
    intent.intent === 'symptom_goal_query' &&
    intent.symptomMentions.length > 0 &&
    intent.symptomMentions.every(isVagueSymptom)
  ) {
    return clarify('symptom_specificity', SYMPTOM_SPECIFICITY_CHOICES);
  }

  // 规则 5：兜底 passThrough
  return passThrough(grounded);
}
