// file: src/lib/capabilities/safetyJudgment/knowledgeBaseLookup.ts — L1 知识库 OR 命中查询
//
// 用途：判断 ingredient slug 是否被 L1 任一 dict 收录，给 judgmentEngine 区分两类"无规则触发"：
//   - 已知（KB 命中）+ 无规则触发 → green (no_known_risk)
//   - 未知（KB 未命中）→ gray (no_data)
// 这是 CLAUDE.md §10.2 v2.8 红线的实现：no-data ≠ no-risk。
//
// 依赖固定为 3 个已存在的 L1 文件（D5 实情，T-0.15 ingredients.ts 尚未实装；
// 上线后若新增 L1 dict，须在此 OR 链中加一条）。

import { CN_DRI_BY_ID } from '@/lib/db/cn-dri-values';
import { LPI_BY_ID } from '@/lib/db/lpi-values';
import { PUBCHEM_CIDS } from '@/lib/db/pubchem-cids';

const PUBCHEM_INGREDIENT_IDS: ReadonlySet<string> = new Set(
  PUBCHEM_CIDS.map((e) => e.ingredientId),
);

/**
 * Slug 同义词桥（contraindications.ts / 用户输入 → KB 真实 id）。
 * 这些是「业务词汇」 vs 「字典编码词汇」之间的命名分裂，KB 已知但 id 不同。
 *
 * 例子（D5 晚 seed Q10 暴露）：
 *   - 用户/规则用 'fish-oil'，LPI 烘焙的 id 是 'omega-3'
 *   - 用户/规则用 'coenzyme-q10'，LPI id 是 'coq10'
 *   - 用户/规则用 'probiotic'（单数），LPI id 是 'probiotics'（复数）
 *   - 用户/规则用 'vitamin-b-complex'（组合名），KB 里只有单 B 族（b6/b12/folate/...），但概念上属"已知"
 *
 * 不修这里，CLAUDE.md §10.2 v2.8 红线（"no-data ≠ no-risk"）会把这些已知成分误打成 gray no_data，
 * 等于把"经检查未见风险"贬成"我们没收录"——产品事故级 bug。
 */
const KB_ALIAS: ReadonlyMap<string, string> = new Map([
  ['fish-oil', 'omega-3'],
  ['coenzyme-q10', 'coq10'],
  ['probiotic', 'probiotics'],
  // vitamin-b-complex 不真正映射到单 id，但 KB 概念已知 → 直接判 true（见下方 KB_ALIAS_KNOWN_SET）
]);

const KB_ALIAS_KNOWN_SET: ReadonlySet<string> = new Set([
  'vitamin-b-complex',
  // P0 D6：硬编码已收录的草本（CN-DRI / LPI / PubChem 暂未覆盖，但 contraindications 已建模 → KB 已知）
  'st-johns-wort',
  'ginkgo',
]);

export function isInKnowledgeBase(slug: string): boolean {
  if (!slug) return false;
  if (KB_ALIAS_KNOWN_SET.has(slug)) return true;
  const canonical = KB_ALIAS.get(slug) ?? slug;
  return (
    CN_DRI_BY_ID.has(canonical) ||
    LPI_BY_ID.has(canonical) ||
    PUBCHEM_INGREDIENT_IDS.has(canonical)
  );
}
