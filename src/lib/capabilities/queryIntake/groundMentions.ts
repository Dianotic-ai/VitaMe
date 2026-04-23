// file: src/lib/capabilities/queryIntake/groundMentions.ts — L0 子模块 b：mention → slug 确定性翻译
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md §b "fuzzy 规则"
//      + CLAUDE.md §10.0 L0 rules（不判风险，不调 LLM）
//      + CLAUDE.md §13.1（L0 强 TDD）
//
// 职能：把 parseIntent 抽出来的中文短语 mention 翻成 contraindications/suppai/db 用的 slug。
// 纯函数 / 同步 / 无 IO / 无 LLM。
//
// 算法（design spec §b）：
//   ingredient: 1) 精确 INGREDIENT_QUERY_MAP 命中 → slug
//               2) parseIngredientQuery (substring includes) → slug[]
//               3) L1 fuzzy：mention 本身就是 slug 时 (CN_DRI / LPI / PUBCHEM 命中) → 留 slug
//               4) 否则 ungrounded（candidates=[]，P0 不做 levenshtein）
//   medication / condition / specialGroup: 精确 → substring 匹配 alias 表 keys
//
// 决策（design spec 未覆盖）：
//   - alias 表 value 为 [] 的 key（如 CONDITION_OPTION_MAP['高血压'] = []）：
//     视为 "已识别但暂无 slug"，**不**进 ungroundedMentions（因为没有候选可让用户选）。
//     语义：业务承认这个词存在，下游 L2 自然 no-hit 走 gray no_data。
//   - product mention 在 P0 不做 grounding（design spec §c 场景 5），**不**进 ungrounded。

import {
  INGREDIENT_QUERY_MAP,
  MEDICATION_OPTION_MAP,
  CONDITION_OPTION_MAP,
  SPECIAL_GROUP_OPTION_MAP,
  parseIngredientQuery,
} from '@/lib/api/slugMappings';
import { CN_DRI_BY_ID } from '@/lib/db/cn-dri-values';
import { LPI_BY_ID } from '@/lib/db/lpi-values';
import { PUBCHEM_CIDS } from '@/lib/db/pubchem-cids';
import type {
  GroundedMentions,
  IntentResult,
  UngroundedKind,
  UngroundedMention,
} from '@/lib/types/intent';

/** L1 ingredient 已知 slug 集合（CN-DRI ∪ LPI ∪ PubChem），用于"mention 本身就是 slug"的兜底命中。 */
const L1_INGREDIENT_SLUGS: ReadonlySet<string> = new Set<string>([
  ...CN_DRI_BY_ID.keys(),
  ...LPI_BY_ID.keys(),
  ...PUBCHEM_CIDS.map((e) => e.ingredientId),
]);

/** 把 mention 翻成 ingredient slug[]；返回空数组表示完全未命中。 */
function groundIngredient(mention: string): string[] {
  const trimmed = mention.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();

  // 1) 精确命中 alias 表（key 已统一小写存放）
  const exact = INGREDIENT_QUERY_MAP[lower];
  if (exact && exact.length > 0) return [...exact];

  // 2) substring includes（slugMappings.parseIngredientQuery 已实现）
  const subs = parseIngredientQuery(trimmed);
  if (subs.length > 0) return subs;

  // 3) mention 本身就是 L1 已知 slug（如 'fish-oil' / 'biotin' / 'omega-3'）
  if (L1_INGREDIENT_SLUGS.has(lower)) return [lower];

  // 4) P0 不做 levenshtein fuzzy → unground
  return [];
}

/**
 * 通用：把 mention 在一张 alias 表里翻成 slug[]。
 *  - exact key 命中 → 返回 mapped slugs
 *  - 否则做 substring 双向匹配：mention 包含 key（"华法林" → "华法林 / 抗凝药"）
 *    或 key 包含 mention（key 字段更宽时的兜底）
 *  - 命中但 mapped 是 [] → 返回 { recognized: true, slugs: [] }（业务认得，但暂无 slug）
 *  - 完全没命中 → { recognized: false, slugs: [] }
 */
function groundFromOptionMap(
  mention: string,
  table: Record<string, string[]>,
): { recognized: boolean; slugs: string[] } {
  const trimmed = mention.trim();
  if (!trimmed) return { recognized: false, slugs: [] };
  const lower = trimmed.toLowerCase();

  // 1) 精确命中（先原样，再小写）
  if (Object.prototype.hasOwnProperty.call(table, trimmed)) {
    return { recognized: true, slugs: [...table[trimmed]!] };
  }
  for (const key of Object.keys(table)) {
    if (key.toLowerCase() === lower) {
      return { recognized: true, slugs: [...table[key]!] };
    }
  }

  // 2) substring 双向匹配
  for (const key of Object.keys(table)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes(lower) || lower.includes(keyLower)) {
      return { recognized: true, slugs: [...table[key]!] };
    }
  }

  return { recognized: false, slugs: [] };
}

/** 去重保序（按首次出现顺序保留）。 */
function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/** 把一类 mention 批量 ground 到 alias 表，并把完全未命中的塞进 ungrounded。 */
function groundCategory(
  mentions: readonly string[],
  table: Record<string, string[]>,
  kind: UngroundedKind,
  ungrounded: UngroundedMention[],
): string[] {
  const slugs: string[] = [];
  for (const m of mentions) {
    const { recognized, slugs: s } = groundFromOptionMap(m, table);
    if (s.length > 0) {
      slugs.push(...s);
    } else if (!recognized) {
      // 完全未命中（不是 "已识别但 slug 空"），需要让上层 clarify
      ungrounded.push({ raw: m, kind, candidates: [] });
    }
    // recognized=true 但 slugs=[]（如 '高血压'）：识别但无 slug，跳过
  }
  return dedupe(slugs);
}

export function groundMentions(intent: IntentResult): GroundedMentions {
  const ungrounded: UngroundedMention[] = [];

  // ── ingredient: 多步策略，自带 ungrounded 收集 ──
  const ingredientSlugs: string[] = [];
  for (const m of intent.ingredientMentions) {
    const slugs = groundIngredient(m);
    if (slugs.length > 0) {
      ingredientSlugs.push(...slugs);
    } else {
      ungrounded.push({ raw: m, kind: 'ingredient', candidates: [] });
    }
  }

  // ── medication / condition / specialGroup: 走通用 alias 表 ──
  const medicationSlugs = groundCategory(
    intent.medicationMentions,
    MEDICATION_OPTION_MAP,
    'medication',
    ungrounded,
  );
  const conditionSlugs = groundCategory(
    intent.conditionMentions,
    CONDITION_OPTION_MAP,
    'condition',
    ungrounded,
  );
  const specialGroupSlugs = groundCategory(
    intent.specialGroupMentions,
    SPECIAL_GROUP_OPTION_MAP,
    'specialGroup',
    ungrounded,
  );

  // P0 不做 product grounding（design spec §c 场景 5），不进 ungrounded

  return {
    ingredientSlugs: dedupe(ingredientSlugs),
    medicationSlugs,
    conditionSlugs,
    specialGroupSlugs,
    ungroundedMentions: ungrounded,
  };
}
