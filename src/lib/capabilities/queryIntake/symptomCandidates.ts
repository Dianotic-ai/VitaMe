// file: src/lib/capabilities/queryIntake/symptomCandidates.ts — L0 症状→候选成分查询
//
// CLAUDE.md §11.14 P0 例外：仅在 intent === 'symptom_goal_query' 时由路由调用。
// 输入 IntentResult.symptomMentions（中文，如 ["失眠"]/["我最近老失眠了"]）→ 输出
// 命中的 SymptomIngredientEntry[]（按输入顺序，按 symptomSlug 去重）+ unmatched 原文。
//
// 红线：本文件**不**判风险（§11.13）；返回的 candidate 仅是营养学常识候选，每条带 sourceRefs，
// UI 必须挂 §11.1 disclaimer + 引导用户对单成分跳到 product_safety_check 二次核查。
//
// 匹配策略（确定性，无 LLM）：
//   1. trim 后查 SYMPTOM_INGREDIENTS_BY_ZH 精确表（key = symptomZh ∪ synonyms）
//   2. 失败回落 substring：扫所有 entry，若 input.includes(key) 则命中（key 仍是 zh ∪ synonyms）
//   3. 都没命中 → 进 unmatched

import {
  SYMPTOM_INGREDIENTS,
  SYMPTOM_INGREDIENTS_BY_ZH,
  type SymptomIngredientEntry,
} from '@/lib/db/symptom-ingredients';

export interface SymptomCandidatesResult {
  matched: SymptomIngredientEntry[];
  unmatched: string[];
}

function findBySubstring(mention: string): SymptomIngredientEntry | undefined {
  for (const entry of SYMPTOM_INGREDIENTS) {
    const keys: readonly string[] = [entry.symptomZh, ...entry.synonyms];
    if (keys.some((k) => k.length > 0 && mention.includes(k))) {
      return entry;
    }
  }
  return undefined;
}

export function lookupSymptomCandidates(symptomMentions: readonly string[]): SymptomCandidatesResult {
  const seenSlugs = new Set<string>();
  const matched: SymptomIngredientEntry[] = [];
  const unmatched: string[] = [];

  for (const raw of symptomMentions) {
    const m = raw.trim();
    if (!m) continue;

    let entry = SYMPTOM_INGREDIENTS_BY_ZH.get(m);
    if (!entry) {
      entry = findBySubstring(m);
    }

    if (!entry) {
      unmatched.push(raw);
      continue;
    }

    if (!seenSlugs.has(entry.symptomSlug)) {
      seenSlugs.add(entry.symptomSlug);
      matched.push(entry);
    }
  }

  return { matched, unmatched };
}
