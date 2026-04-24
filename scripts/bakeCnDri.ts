// file: scripts/bakeCnDri.ts — 中国营养学会 DRIs 手录 → src/lib/db/cn-dri-values.ts
//
// 依据：docs/engineering/plans/data-baking-gpt.md §4.3 / CLAUDE.md §12 / §6.3
// 流程：读 scripts/raw/cn-dri-manual.json → Zod 校验 → 过滤全空值条目 → 写 TS 产物
// 产物：src/lib/db/cn-dri-values.ts（typed export，供后续 ingredients.ts composer 合并）
// 重跑幂等：给定相同输入必定产出相同输出（条目按 id 字典序）。

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'scripts/raw/cn-dri-manual.json');
const OUTPUT = resolve(ROOT, 'src/lib/db/cn-dri-values.ts');

// ---- Zod schema ----
const DRISchema = z.object({
  rdi: z.number().positive().nullable(),
  ul: z.number().positive().nullable(),
  unit: z.enum(['mg', 'mcg', 'IU', 'g']),
});

const RowSchema = z.object({
  id: z.string().min(1),
  cn: DRISchema,
  note: z.string().optional(),
});

const FileSchema = z.object({
  _meta: z
    .object({
      sourceText: z.string(),
      sourceUrl: z.string().url(),
      retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .passthrough(),
  rows: z.array(RowSchema).nonempty(),
});

type Row = z.infer<typeof RowSchema>;

// ---- 主流程 ----
function main(): void {
  const raw = JSON.parse(readFileSync(INPUT, 'utf-8'));
  const parsed = FileSchema.parse(raw);

  const { sourceUrl, retrievedAt } = parsed._meta;

  // 过滤：rdi 与 ul 皆为 null 的条目不纳入 CN_DRI_VALUES（无合并价值）
  const usable: Row[] = parsed.rows
    .filter((r) => r.cn.rdi !== null || r.cn.ul !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  const skipped = parsed.rows.length - usable.length;

  const body = usable
    .map((r) => {
      const parts: string[] = [];
      parts.push(`    ingredientId: ${JSON.stringify(r.id)},`);
      parts.push(`    cn: { ${driLiteral(r.cn)} },`);
      parts.push(`    sourceRef: {`);
      parts.push(`      source: 'cn-dri',`);
      parts.push(`      id: ${JSON.stringify(r.id)},`);
      parts.push(`      url: ${JSON.stringify(sourceUrl)},`);
      parts.push(`      retrievedAt: ${JSON.stringify(retrievedAt)},`);
      parts.push(`    },`);
      if (r.note) parts.push(`    note: ${JSON.stringify(r.note)},`);
      return `  {\n${parts.join('\n')}\n  },`;
    })
    .join('\n');

  const content = `// file: src/lib/db/cn-dri-values.ts — 由 scripts/bakeCnDri.ts 生成；勿手改
//
// 源: ${parsed._meta.sourceText}
// 采集日: ${retrievedAt}
// 入库条目: ${usable.length}  / 原始行数: ${parsed.rows.length}  / 跳过（rdi 与 ul 均空）: ${skipped}

import 'server-only';
import type { DRIValues } from '@/lib/types/ingredient';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface CnDriEntry {
  ingredientId: string;
  cn: DRIValues;
  sourceRef: SourceRef;
  note?: string;
}

export const CN_DRI_VALUES: readonly CnDriEntry[] = [
${body}
];

export const CN_DRI_BY_ID: ReadonlyMap<string, CnDriEntry> = new Map(
  CN_DRI_VALUES.map((e) => [e.ingredientId, e]),
);
`;

  writeFileSync(OUTPUT, content, 'utf-8');

  const { size } = statSync(OUTPUT);
  console.log(
    `bakeCnDri — size: ${(size / 1024).toFixed(1)} KB, entries: ${usable.length}, skipped: ${skipped}`,
  );
}

function driLiteral(d: { rdi: number | null; ul: number | null; unit: string }): string {
  const bits: string[] = [];
  if (d.rdi !== null) bits.push(`rdi: ${d.rdi}`);
  if (d.ul !== null) bits.push(`ul: ${d.ul}`);
  bits.push(`unit: ${JSON.stringify(d.unit)}`);
  return bits.join(', ');
}

main();
