// file: scripts/bakeLpi.ts — Linus Pauling Institute 手录 JSON → src/lib/db/lpi-values.ts

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export function main(): void {
  const ROOT = resolve(__dirname, '..');
  const INPUT = resolve(ROOT, 'scripts/raw/lpi-manual.json');
  const OUTPUT = resolve(ROOT, 'src/lib/db/lpi-values.ts');

  const SummarySchema = z.object({
    functionBrief: z.string().min(1),
    deficiencySymptoms: z.array(z.string().min(1)),
    excessRisks: z.array(z.string().min(1)),
  });

  const RowSchema = z.object({
    id: z.string().min(1),
    sourceUrl: z.string().url(),
    summaryZh: SummarySchema,
    summaryEn: SummarySchema,
  });

  const FileSchema = z.object({
    _meta: z
      .object({
        sourceText: z.string().min(1),
        sourceUrl: z.string().url(),
        retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .passthrough(),
    rows: z.array(RowSchema).nonempty(),
  });

  type Summary = z.infer<typeof SummarySchema>;
  type Row = z.infer<typeof RowSchema>;

  const formatSummary = (summary: Summary, indent: string): string => {
    const nestedIndent = `${indent}  `;
    return `{
${nestedIndent}functionBrief: ${JSON.stringify(summary.functionBrief)},
${nestedIndent}deficiencySymptoms: ${JSON.stringify(summary.deficiencySymptoms)},
${nestedIndent}excessRisks: ${JSON.stringify(summary.excessRisks)},
${indent}}`;
  };

  const compareById = (left: Row, right: Row): number => {
    if (left.id < right.id) {
      return -1;
    }

    if (left.id > right.id) {
      return 1;
    }

    return 0;
  };

  const raw = JSON.parse(readFileSync(INPUT, 'utf-8')) as unknown;
  const parsed = FileSchema.parse(raw);
  const rows = [...parsed.rows].sort(compareById);

  const seenIds = new Set<string>();
  for (const row of rows) {
    if (seenIds.has(row.id)) {
      throw new Error(`Duplicate ingredient id: ${row.id}`);
    }
    seenIds.add(row.id);
  }

  const body = rows
    .map((row) => {
      const parts: string[] = [];
      parts.push(`    ingredientId: ${JSON.stringify(row.id)},`);
      parts.push(`    summaryZh: ${formatSummary(row.summaryZh, '    ')},`);
      parts.push(`    summaryEn: ${formatSummary(row.summaryEn, '    ')},`);
      parts.push(`    sourceRef: {`);
      parts.push(`      source: 'lpi',`);
      parts.push(`      id: ${JSON.stringify(row.id)},`);
      parts.push(`      url: ${JSON.stringify(row.sourceUrl)},`);
      parts.push(`      retrievedAt: ${JSON.stringify(parsed._meta.retrievedAt)},`);
      parts.push(`    },`);
      return `  {\n${parts.join('\n')}\n  },`;
    })
    .join('\n');

  const content = `// file: src/lib/db/lpi-values.ts — 由 scripts/bakeLpi.ts 生成；勿手改
//
// 源: ${parsed._meta.sourceText}
// 采集日: ${parsed._meta.retrievedAt}
// 入库条目: ${rows.length}

import 'server-only';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface LpiEntry {
  ingredientId: string;
  summaryZh: {
    functionBrief: string;
    deficiencySymptoms: readonly string[];
    excessRisks: readonly string[];
  };
  summaryEn: {
    functionBrief: string;
    deficiencySymptoms: readonly string[];
    excessRisks: readonly string[];
  };
  sourceRef: SourceRef;
}

export const LPI_VALUES: readonly LpiEntry[] = [
${body}
];

export const LPI_BY_ID: ReadonlyMap<string, LpiEntry> = new Map(
  LPI_VALUES.map((e) => [e.ingredientId, e]),
);
`;

  writeFileSync(OUTPUT, content, 'utf-8');

  const { size } = statSync(OUTPUT);
  console.log(`bakeLpi — size: ${(size / 1024).toFixed(1)} KB, entries: ${rows.length}`);
}

if (require.main === module) {
  main();
}
