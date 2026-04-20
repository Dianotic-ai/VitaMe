// file: scripts/bakePubchem.ts — PubChem PUG REST → src/lib/db/pubchem-cids.ts
//
// 依据：CLAUDE.md §5 / §12.1 / gpt烘焙方案.md §4.4 / 数据接入与实现方案.md §2
// 目的：为 IngredientForm.pubchemCid 填充官方化学 ID，供 L3 FormComparator 校验化学形式真实性。
// 流程：
//   1) 读 scripts/raw/pubchem-forms.json（手工策划 (ingredient, form) 清单）
//   2) 顺序调用 PubChem PUG REST（≤ 5 req/sec 官方速率限制；每次间隔 250ms）
//   3) 解析返回 CID；未命中记 null（不阻断整批）
//   4) 写 src/lib/db/pubchem-cids.ts（按 ingredientId, formNameEn 字典序）
//
// 幂等性：给定相同 JSON 输入 + PubChem 不重发 CID，产物逐字节一致（排序 + JSON 字段顺序固定）。

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'scripts/raw/pubchem-forms.json');
const OUTPUT = resolve(ROOT, 'src/lib/db/pubchem-cids.ts');

const BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name';
const RATE_LIMIT_MS = 250; // 官方限制 5 req/s；250ms 留余量

// ---- Zod schema for input ----
const FormRow = z.object({
  ingredientId: z.string().min(1),
  formNameEn: z.string().min(1),
  formNameZh: z.string().min(1),
});
const InputSchema = z.object({
  _meta: z
    .object({
      sourceText: z.string(),
      sourceUrl: z.string().url(),
      retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .passthrough(),
  forms: z.array(FormRow).nonempty(),
});

type FormRowT = z.infer<typeof FormRow>;

// ---- Zod schema for PubChem response ----
const PubChemResp = z.object({
  IdentifierList: z
    .object({
      CID: z.array(z.number()).nonempty(),
    })
    .optional(),
  Fault: z.unknown().optional(),
});

async function lookupCid(formNameEn: string): Promise<number | null> {
  const url = `${BASE_URL}/${encodeURIComponent(formNameEn)}/cids/JSON`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`  ! ${formNameEn} — HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const parsed = PubChemResp.safeParse(json);
    if (!parsed.success || !parsed.data.IdentifierList) return null;
    return parsed.data.IdentifierList.CID[0] ?? null;
  } catch (err) {
    console.warn(`  ! ${formNameEn} — ${(err as Error).message}`);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface ResolvedForm extends FormRowT {
  pubchemCid: number | null;
}

async function main(): Promise<void> {
  const raw = JSON.parse(readFileSync(INPUT, 'utf-8'));
  const parsed = InputSchema.parse(raw);
  const { sourceUrl, retrievedAt } = parsed._meta;

  const resolved: ResolvedForm[] = [];
  for (const row of parsed.forms) {
    const cid = await lookupCid(row.formNameEn);
    resolved.push({ ...row, pubchemCid: cid });
    console.log(`  ${cid !== null ? '✓' : '·'} ${row.formNameEn} → ${cid ?? 'null'}`);
    await sleep(RATE_LIMIT_MS);
  }

  // 按 (ingredientId, formNameEn) 字典序稳定排序
  resolved.sort((a, b) => {
    const c = a.ingredientId.localeCompare(b.ingredientId);
    return c !== 0 ? c : a.formNameEn.localeCompare(b.formNameEn);
  });

  const hits = resolved.filter((r) => r.pubchemCid !== null).length;
  const misses = resolved.length - hits;

  const body = resolved
    .map((r) => {
      const parts: string[] = [];
      parts.push(`    ingredientId: ${JSON.stringify(r.ingredientId)},`);
      parts.push(`    formNameEn: ${JSON.stringify(r.formNameEn)},`);
      parts.push(`    formNameZh: ${JSON.stringify(r.formNameZh)},`);
      parts.push(`    pubchemCid: ${r.pubchemCid === null ? 'null' : r.pubchemCid},`);
      parts.push(`    sourceRef: {`);
      parts.push(`      source: 'pubchem',`);
      parts.push(`      id: ${JSON.stringify(r.pubchemCid === null ? `name:${r.formNameEn}` : String(r.pubchemCid))},`);
      if (r.pubchemCid !== null) {
        parts.push(`      url: ${JSON.stringify(`https://pubchem.ncbi.nlm.nih.gov/compound/${r.pubchemCid}`)},`);
      } else {
        parts.push(`      url: ${JSON.stringify(sourceUrl)},`);
      }
      parts.push(`      retrievedAt: ${JSON.stringify(retrievedAt)},`);
      parts.push(`    },`);
      return `  {\n${parts.join('\n')}\n  },`;
    })
    .join('\n');

  const content = `// file: src/lib/db/pubchem-cids.ts — 由 scripts/bakePubchem.ts 生成；勿手改
//
// 源: PubChem PUG REST
// 采集日: ${retrievedAt}
// 总条目: ${resolved.length}  /  命中 CID: ${hits}  /  未命中（null）: ${misses}

import 'server-only';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface PubchemCidEntry {
  ingredientId: string;
  formNameEn: string;
  formNameZh: string;
  /** null = PubChem 未命中；上游 composer 应降级到 sourceType='limited' */
  pubchemCid: number | null;
  sourceRef: SourceRef;
}

export const PUBCHEM_CIDS: readonly PubchemCidEntry[] = [
${body}
];

export const PUBCHEM_CID_BY_KEY: ReadonlyMap<string, PubchemCidEntry> = new Map(
  PUBCHEM_CIDS.map((e) => [\`\${e.ingredientId}|\${e.formNameEn}\`, e]),
);
`;

  writeFileSync(OUTPUT, content, 'utf-8');

  const { size } = statSync(OUTPUT);
  console.log(
    `\nbakePubchem — size: ${(size / 1024).toFixed(1)} KB, entries: ${resolved.length}, hits: ${hits}, misses: ${misses}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
