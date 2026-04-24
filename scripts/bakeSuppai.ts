// file: scripts/bakeSuppai.ts — SUPP.AI HTML + API → src/lib/db/suppai-interactions.ts
//
// 依据：CLAUDE.md §5 / §6.3 / §9.3 坑 4 / §12.1 / docs/engineering/plans/data-baking-gpt.md §4.6
// 流程：
//   1) 读 scripts/raw/suppai-ingredient-map.json（27 个 ingredientId → CUI）
//   2) 对每个 supplement：分页抓 /a/<slug>/<cui>?p=N 直到无新条目，收集 interaction_id 列表
//   3) 对每个 interaction_id：请求 /api/interaction/<id> 拉结构化 JSON
//   4) 过滤：另一侧 ent_type === 'drug' 且 evidence.length >= MIN_EVIDENCE（CLAUDE.md §9.3 坑 4 v2.3 新规则：证据阈值而非行数白名单）
//   5) severity 统一 yellow（red 保留给 hardcoded contraindications 独占）
//   6) 按 (supplementCui, drugCui) 字典序稳定排序，写 TS
//
// 速率：250ms / request，保守不触 SUPP.AI 速率限制。
// 幂等：给定相同输入 + SUPP.AI 数据稳定，产物逐字节一致。

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'scripts/raw/suppai-ingredient-map.json');
const OUTPUT = resolve(ROOT, 'src/lib/db/suppai-interactions.ts');

const BASE = 'https://supp.ai';
const RATE_LIMIT_MS = 250;
const MAX_LIST_PAGES = 30; // 硬上限，防止无限分页
const MIN_EVIDENCE = 3; // CLAUDE.md §9.3 坑 4 (v2.3)：长尾 ic=1~2 的 pair 临床意义弱，全砍

// ---- 输入 schema ----
const IngredientRow = z.object({
  ingredientId: z.string().min(1),
  cui: z.string().regex(/^C\d+$/),
  preferredName: z.string().min(1),
});
const InputSchema = z.object({
  _meta: z.object({
    sourceText: z.string(),
    sourceUrl: z.string().url(),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).passthrough(),
  ingredients: z.array(IngredientRow).nonempty(),
});

// ---- SUPP.AI interaction API schema ----
const Agent = z.object({
  cui: z.string(),
  preferred_name: z.string(),
  ent_type: z.enum(['supplement', 'drug']).or(z.string()),
  slug: z.string().optional(),
});
const InteractionResp = z.object({
  interaction_id: z.string(),
  slug: z.string().optional(),
  agents: z.array(Agent.nullable()).length(2),
  evidence: z.array(z.unknown()),
});

interface BakedRow {
  interactionId: string;
  supplementCui: string;
  supplementIngredientId: string;
  drugCui: string;
  drugSlug: string;
  drugNameEn: string;
  evidenceCount: number;
  suppaiSlug: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// SUPP.AI 的 /a/<slug>/<cui> 页面：默认 gzip 返回 SPA 壳（不含 SSR 注入的 /i/ 链接），
// 必须显式 Accept-Encoding: identity 让 CDN 回源拿完整 SSR HTML（~1MB/页）。
const SSR_HEADERS = {
  'User-Agent': 'curl/8.0',
  'Accept-Encoding': 'identity',
} as const;

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: SSR_HEADERS });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 从 /a/<slug>/<cui>?p=N 页面抓所有 /i/<slug>/<cui_a>-<cui_b> 链接。
 * SUPP.AI 无页数提示，靠"本页条目数为 0" 判空。
 */
async function listInteractionIdsFor(cui: string, slug: string): Promise<Set<string>> {
  const re = /\/i\/[a-z0-9-]+\/(C\d+-C\d+)/g;
  const ids = new Set<string>();

  // SUPP.AI 用 1-indexed 分页：?p=0 会被 CDN 当作 SPA shell 路由（33KB 空壳，0 链接）；
  // ?p=1..N 才是完整 SSR HTML（~1MB/页，每页 ~50 条）。必须从 1 起。
  for (let p = 1; p <= MAX_LIST_PAGES; p++) {
    const url = `${BASE}/a/${slug}/${cui}?p=${p}`;
    const html = await fetchText(url);
    await sleep(RATE_LIMIT_MS);
    if (!html) break;
    let m: RegExpExecArray | null;
    let pageCount = 0;
    while ((m = re.exec(html)) !== null) {
      if (m[1] !== undefined) {
        ids.add(m[1]);
        pageCount += 1;
      }
    }
    if (pageCount === 0) break; // 空页 → 翻到底
  }
  return ids;
}

function cuiPairHasCui(pair: string, cui: string): boolean {
  const [a, b] = pair.split('-');
  return a === cui || b === cui;
}

async function main(): Promise<void> {
  const raw = JSON.parse(readFileSync(INPUT, 'utf-8'));
  const parsed = InputSchema.parse(raw);
  const { sourceUrl, retrievedAt } = parsed._meta;

  // supplement CUI → ingredientId 反向映射（用于识别 supplementSide）
  const cuiToIngredientId = new Map<string, string>();
  for (const r of parsed.ingredients) cuiToIngredientId.set(r.cui, r.ingredientId);

  // ---- 收集所有 (ingredientCui, interactionPair) ----
  const pairsToIngredient = new Map<string, string[]>(); // interactionPair → ingredientIds (可能多个都命中)
  for (const row of parsed.ingredients) {
    // SUPP.AI slug 需与 preferredName 小写连字符一致；用搜索 API 不够可靠，直接访问 a/<slug>/<cui> 时 slug 可用 preferredName lowercased
    const slug = row.preferredName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    console.log(`\n[${row.ingredientId}] ${row.preferredName} (${row.cui}) → listing...`);
    const ids = await listInteractionIdsFor(row.cui, slug);
    console.log(`  ${ids.size} interaction ids found`);
    for (const p of ids) {
      if (!cuiPairHasCui(p, row.cui)) continue; // 防串页（罕见）
      const list = pairsToIngredient.get(p) ?? [];
      list.push(row.ingredientId);
      pairsToIngredient.set(p, list);
    }
  }

  console.log(`\n汇总：${pairsToIngredient.size} 条唯一 interaction pair 待拉 detail`);

  // ---- 拉 detail + 过滤 ----
  const baked: BakedRow[] = [];
  let cnt = 0;
  for (const [pair, ingredientIds] of pairsToIngredient) {
    cnt++;
    if (cnt % 50 === 0) console.log(`  progress ${cnt}/${pairsToIngredient.size}`);
    const json = await fetchJson(`${BASE}/api/interaction/${pair}`);
    await sleep(RATE_LIMIT_MS);
    if (!json) continue;
    const parsedResp = InteractionResp.safeParse(json);
    if (!parsedResp.success) continue;
    const r = parsedResp.data;
    if (r.evidence.length < MIN_EVIDENCE) continue;

    const [aRaw, bRaw] = r.agents;
    if (!aRaw || !bRaw) continue;

    // 哪一侧是 supplement（我们的 ingredient），另一侧必须是 drug
    let suppSide = null;
    let drugSide = null;
    if (cuiToIngredientId.has(aRaw.cui) && bRaw.ent_type === 'drug') {
      suppSide = aRaw;
      drugSide = bRaw;
    } else if (cuiToIngredientId.has(bRaw.cui) && aRaw.ent_type === 'drug') {
      suppSide = bRaw;
      drugSide = aRaw;
    } else {
      continue; // 非 supplement×drug（可能 supp×supp 或两边都不在我们表里）
    }

    baked.push({
      interactionId: r.interaction_id,
      supplementCui: suppSide.cui,
      supplementIngredientId: cuiToIngredientId.get(suppSide.cui) ?? ingredientIds[0]!,
      drugCui: drugSide.cui,
      drugSlug: drugSide.slug ?? drugSide.preferred_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      drugNameEn: drugSide.preferred_name,
      evidenceCount: r.evidence.length,
      suppaiSlug: r.slug ?? '',
    });
  }

  // ---- 去重 + 排序（supplementCui, drugCui 字典序）----
  const uniq = new Map<string, BakedRow>();
  for (const b of baked) {
    const key = `${b.supplementCui}|${b.drugCui}`;
    if (!uniq.has(key)) uniq.set(key, b);
  }
  const final = [...uniq.values()].sort((a, b) => {
    const c = a.supplementCui.localeCompare(b.supplementCui);
    return c !== 0 ? c : a.drugCui.localeCompare(b.drugCui);
  });

  // ---- 写 TS ----
  const body = final
    .map((r) => {
      const id = `suppai-${r.supplementCui}-${r.drugCui}`;
      const lines = [
        `  {`,
        `    id: ${JSON.stringify(id)},`,
        `    substanceA: { id: ${JSON.stringify(r.supplementIngredientId)}, kind: 'supplement' },`,
        `    substanceB: { id: ${JSON.stringify(r.drugSlug)}, kind: 'drug', nameEn: ${JSON.stringify(r.drugNameEn)} },`,
        `    severity: 'yellow' as const,`,
        `    reasonCode: 'suppai_evidence',`,
        `    reason: ${JSON.stringify(`与 ${r.drugNameEn} 可能存在相互作用（SUPP.AI 收录 ${r.evidenceCount} 篇证据）`)},`,
        `    sourceRef: {`,
        `      source: 'suppai' as const,`,
        `      id: ${JSON.stringify(r.interactionId)},`,
        `      url: ${JSON.stringify(`${BASE}/i/${r.suppaiSlug || r.interactionId.toLowerCase()}/${r.interactionId}`)},`,
        `      retrievedAt: ${JSON.stringify(retrievedAt)},`,
        `    },`,
        `    evidenceCount: ${r.evidenceCount},`,
        `  },`,
      ];
      return lines.join('\n');
    })
    .join('\n');

  const content = `// file: src/lib/db/suppai-interactions.ts — 由 scripts/bakeSuppai.ts 生成；勿手改
//
// 源: SUPP.AI (Allen AI Institute)
// 采集日: ${retrievedAt}
// 总条目: ${final.length}（过滤条件：另一侧 ent_type='drug' + evidence 非空；severity 统一 yellow）

import 'server-only';
import type { Interaction } from '@/lib/types/interaction';

export interface SuppaiInteraction extends Interaction {
  severity: 'yellow';
  reasonCode: 'suppai_evidence';
  /** 该 pair 下 SUPP.AI 收录的证据篇数（仅用于前端徽章权重提示） */
  evidenceCount: number;
}

export const SUPPAI_INTERACTIONS: readonly SuppaiInteraction[] = [
${body}
];

export const SUPPAI_BY_PAIR: ReadonlyMap<string, SuppaiInteraction> = new Map(
  SUPPAI_INTERACTIONS.map((i) => [\`\${i.substanceA.id}|\${i.substanceB.id}\`, i]),
);
`;

  writeFileSync(OUTPUT, content, 'utf-8');

  const { size } = statSync(OUTPUT);
  console.log(
    `\nbakeSuppai — size: ${(size / 1024).toFixed(1)} KB, entries: ${final.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
