// file: scripts/bakeSymptomIngredients.ts — 症状→候选成分手录 JSON → src/lib/db/symptom-ingredients.ts
//
// CLAUDE.md §11.14 P0 例外：symptom_goal_query 走候选清单（每条挂 sourceRefs + 二次核查引导）。
// 与 bakeLpi.ts 同样的 Zod 严校验 + 排序去重 + 大小日志套路。

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export function main(): void {
  const ROOT = resolve(__dirname, '..');
  const INPUT = resolve(ROOT, 'scripts/raw/symptom-ingredients-manual.json');
  const OUTPUT = resolve(ROOT, 'src/lib/db/symptom-ingredients.ts');

  const SourceRefSchema = z.object({
    source: z.literal('lpi'),
    id: z.string().min(1),
    url: z.string().url(),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  const CandidateSchema = z.object({
    ingredientSlug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'ingredientSlug must be kebab-case'),
    evidenceNote: z.string().min(8),
    sourceRefs: z.array(SourceRefSchema).nonempty(),
  });

  const RowSchema = z.object({
    symptomSlug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'symptomSlug must be kebab-case'),
    symptomZh: z.string().min(1),
    synonyms: z.array(z.string().min(1)),
    candidates: z.array(CandidateSchema).nonempty(),
  });

  const FileSchema = z.object({
    _meta: z
      .object({
        retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .passthrough(),
    rows: z.array(RowSchema).nonempty(),
  });

  type Row = z.infer<typeof RowSchema>;

  const compareBySlug = (left: Row, right: Row): number => {
    if (left.symptomSlug < right.symptomSlug) return -1;
    if (left.symptomSlug > right.symptomSlug) return 1;
    return 0;
  };

  const raw = JSON.parse(readFileSync(INPUT, 'utf-8')) as unknown;
  const parsed = FileSchema.parse(raw);
  const rows = [...parsed.rows].sort(compareBySlug);

  const seenSlugs = new Set<string>();
  for (const row of rows) {
    if (seenSlugs.has(row.symptomSlug)) {
      throw new Error(`Duplicate symptomSlug: ${row.symptomSlug}`);
    }
    seenSlugs.add(row.symptomSlug);

    const seenIngredients = new Set<string>();
    for (const c of row.candidates) {
      if (seenIngredients.has(c.ingredientSlug)) {
        throw new Error(
          `Duplicate ingredientSlug "${c.ingredientSlug}" inside symptom "${row.symptomSlug}"`,
        );
      }
      seenIngredients.add(c.ingredientSlug);
    }
  }

  const formatSourceRefs = (refs: z.infer<typeof SourceRefSchema>[], indent: string): string => {
    const inner = refs
      .map((r) => {
        return `${indent}  {
${indent}    source: 'lpi',
${indent}    id: ${JSON.stringify(r.id)},
${indent}    url: ${JSON.stringify(r.url)},
${indent}    retrievedAt: ${JSON.stringify(r.retrievedAt)},
${indent}  },`;
      })
      .join('\n');
    return `[
${inner}
${indent}]`;
  };

  const formatCandidates = (cs: z.infer<typeof CandidateSchema>[], indent: string): string => {
    const inner = cs
      .map((c) => {
        return `${indent}  {
${indent}    ingredientSlug: ${JSON.stringify(c.ingredientSlug)},
${indent}    evidenceNote: ${JSON.stringify(c.evidenceNote)},
${indent}    sourceRefs: ${formatSourceRefs(c.sourceRefs, `${indent}    `)},
${indent}  },`;
      })
      .join('\n');
    return `[
${inner}
${indent}]`;
  };

  const body = rows
    .map((row) => {
      const parts: string[] = [];
      parts.push(`    symptomSlug: ${JSON.stringify(row.symptomSlug)},`);
      parts.push(`    symptomZh: ${JSON.stringify(row.symptomZh)},`);
      parts.push(`    synonyms: ${JSON.stringify(row.synonyms)},`);
      parts.push(`    candidates: ${formatCandidates(row.candidates, '    ')},`);
      return `  {\n${parts.join('\n')}\n  },`;
    })
    .join('\n');

  const content = `// file: src/lib/db/symptom-ingredients.ts — 由 scripts/bakeSymptomIngredients.ts 生成；勿手改
//
// 用途: L0 symptom_goal_query 候选成分清单（CLAUDE.md §11.14 P0 例外）
// 源: scripts/raw/symptom-ingredients-manual.json (LPI 公开资料整理)
// 采集日: ${parsed._meta.retrievedAt}
// 入库症状: ${rows.length}

import 'server-only';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface SymptomIngredientCandidate {
  ingredientSlug: string;
  evidenceNote: string;
  sourceRefs: readonly SourceRef[];
}

export interface SymptomIngredientEntry {
  symptomSlug: string;
  symptomZh: string;
  synonyms: readonly string[];
  candidates: readonly SymptomIngredientCandidate[];
}

export const SYMPTOM_INGREDIENTS: readonly SymptomIngredientEntry[] = [
${body}
];

export const SYMPTOM_INGREDIENTS_BY_SLUG: ReadonlyMap<string, SymptomIngredientEntry> = new Map(
  SYMPTOM_INGREDIENTS.map((e) => [e.symptomSlug, e]),
);

// 反向索引：中文症状名/同义词 → entry。lookup 端点用 lower-case 精确匹配 + substring 兜底。
export const SYMPTOM_INGREDIENTS_BY_ZH: ReadonlyMap<string, SymptomIngredientEntry> = new Map(
  SYMPTOM_INGREDIENTS.flatMap((e) => {
    const keys = [e.symptomZh, ...e.synonyms];
    return keys.map((k) => [k, e] as const);
  }),
);
`;

  writeFileSync(OUTPUT, content, 'utf-8');

  const { size } = statSync(OUTPUT);
  const totalCandidates = rows.reduce((acc, r) => acc + r.candidates.length, 0);
  console.log(
    `bakeSymptomIngredients — size: ${(size / 1024).toFixed(1)} KB, symptoms: ${rows.length}, candidates: ${totalCandidates}`,
  );
}

if (require.main === module) {
  main();
}
