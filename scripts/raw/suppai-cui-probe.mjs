// 一次性探测脚本：为 30 成分找 SUPP.AI CUI。输出供 suppai-ingredient-map.json 手工采纳。
// 不走 bake 流水线，只是辅助。

const targets = [
  { id: 'magnesium',         terms: ['magnesium'] },
  { id: 'fish-oil',          terms: ['fish oil', 'omega-3 fatty acid'] },
  { id: 'vitamin-d',         terms: ['cholecalciferol', 'vitamin d3', 'ergocalciferol'] },
  { id: 'coenzyme-q10',      terms: ['ubiquinone', 'coenzyme q10'] },
  { id: 'calcium',           terms: ['calcium', 'calcium carbonate'] },
  { id: 'vitamin-c',         terms: ['ascorbic acid', 'vitamin c'] },
  { id: 'iron',              terms: ['iron', 'ferrous sulfate'] },
  { id: 'zinc',              terms: ['zinc', 'zinc sulfate'] },
  { id: 'vitamin-b6',        terms: ['pyridoxine', 'vitamin b6'] },
  { id: 'vitamin-b12',       terms: ['cyanocobalamin', 'vitamin b12', 'methylcobalamin'] },
  { id: 'folate',            terms: ['folate', 'folic acid'] },
  { id: 'vitamin-a',         terms: ['vitamin a', 'retinol'] },
  { id: 'vitamin-e',         terms: ['vitamin e', 'tocopherol'] },
  { id: 'vitamin-k',         terms: ['vitamin k', 'phytonadione'] },
  { id: 'selenium',          terms: ['selenium', 'selenomethionine'] },
  { id: 'curcumin',          terms: ['curcumin', 'turmeric'] },
  { id: 'melatonin',         terms: ['melatonin'] },
  { id: 'probiotic',         terms: ['lactobacillus', 'probiotic'] },
  { id: 'chromium',          terms: ['chromium picolinate', 'chromium'] },
  { id: 'cinnamon',          terms: ['cinnamon'] },
  { id: 'biotin',            terms: ['biotin'] },
  { id: 'thiamin',           terms: ['thiamine', 'thiamin'] },
  { id: 'riboflavin',        terms: ['riboflavin'] },
  { id: 'niacin',            terms: ['niacin', 'nicotinic acid'] },
  { id: 'pantothenic-acid',  terms: ['pantothenic acid'] },
  { id: 'iodine',            terms: ['iodine', 'potassium iodide'] },
  { id: 'copper',            terms: ['copper', 'copper gluconate'] },
  { id: 'manganese',         terms: ['manganese'] },
  { id: 'choline',           terms: ['choline', 'phosphatidylcholine'] },
];

async function searchOne(q) {
  const url = `https://supp.ai/api/agent/search?q=${encodeURIComponent(q)}&p=0`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.results ?? []).filter((r) => r.ent_type === 'supplement');
  } catch (e) {
    return [];
  }
}

function score(result, term) {
  // 宁可选更具体、交互数更高的本体
  const n = (result.preferred_name ?? '').toLowerCase();
  const t = term.toLowerCase();
  let s = (result.interacts_with_count ?? 0);
  if (n === t) s += 100000;
  if (n.includes(t)) s += 1000;
  // 排除复合制剂名
  if (n.includes('/') || n.includes('emulsion') || n.includes('supplement drink')) s -= 50000;
  return s;
}

async function main() {
  const picks = [];
  for (const t of targets) {
    const all = [];
    for (const term of t.terms) {
      const hits = await searchOne(term);
      for (const h of hits) all.push({ h, term });
      await new Promise((r) => setTimeout(r, 250));
    }
    // 去重 + 排序
    const uniq = new Map();
    for (const { h, term } of all) {
      const cur = uniq.get(h.cui);
      const newScore = score(h, term);
      if (!cur || newScore > cur.score) uniq.set(h.cui, { h, score: newScore, term });
    }
    const sorted = [...uniq.values()].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    if (best) {
      picks.push({
        ingredientId: t.id,
        cui: best.h.cui,
        preferredName: best.h.preferred_name,
        interactsCount: best.h.interacts_with_count,
      });
      console.log(`${t.id.padEnd(20)} → ${best.h.cui}  ${best.h.preferred_name}  (${best.h.interacts_with_count})`);
    } else {
      console.log(`${t.id.padEnd(20)} → MISS`);
    }
  }
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(picks, null, 2));
}

main();
