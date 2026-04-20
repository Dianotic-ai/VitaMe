// file: scripts/validate-raw.ts — 外包交付物校验 CLI
// 用法：
//   npx tsx scripts/validate-raw.ts lpi   scripts/raw/lpi-manual.json
//   npx tsx scripts/validate-raw.ts seeds tests/fixtures/seeds.json
//
// 验收 TASK-1（lpi）+ TASK-3（seeds）。跑 Zod schema + 30/20 集合完整性 + §11.2 禁词扫描。

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { scanBannedWords } from '../src/lib/capabilities/compliance/bannedWordsFilter';

// ---- LPI schema（对齐 docs/outsourcing/TASK-1-lpi-raw-json.md）----
const LPI_30 = [
  'vitamin-a', 'vitamin-c', 'vitamin-d', 'vitamin-e', 'vitamin-k',
  'thiamin', 'riboflavin', 'niacin', 'vitamin-b6', 'folate', 'vitamin-b12',
  'biotin', 'pantothenic-acid', 'choline',
  'calcium', 'iron', 'magnesium', 'zinc', 'copper', 'manganese',
  'iodine', 'selenium', 'chromium', 'molybdenum',
  'omega-3', 'coq10', 'probiotics', 'glucosamine', 'melatonin', 'lutein',
] as const;

const lpiRowSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url().startsWith('https://lpi.oregonstate.edu/'),
  summaryZh: z.object({
    functionBrief: z.string().min(1).max(80),
    deficiencySymptoms: z.array(z.string().max(30)),
    excessRisks: z.array(z.string().max(30)),
  }),
  summaryEn: z.object({
    functionBrief: z.string().min(1).max(150),
    deficiencySymptoms: z.array(z.string()),
    excessRisks: z.array(z.string()),
  }),
});

const lpiSchema = z.object({
  _meta: z.object({
    sourceText: z.string().min(1),
    sourceUrl: z.string().url(),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  rows: z.array(lpiRowSchema).length(30),
});

// ---- Seeds schema（对齐 src/lib/types/{query,risk}.ts 真实字段）----
const riskLevelEnum = z.enum(['red', 'yellow', 'gray', 'green']);
const tokenKindEnum = z.enum(['ingredient', 'medication', 'product', 'unknown']);
const inputSourceEnum = z.enum(['text', 'ocr']);

const normalizedTokenSchema = z.object({
  raw: z.string().min(1),
  normalized: z.boolean(),
  kind: tokenKindEnum,
  ingredientId: z.string().optional(),
  form: z.string().optional(),
  dose: z.number().optional(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

const queryContextSchema = z.object({
  medications: z.array(z.string()),
  conditions: z.array(z.string()),
  allergies: z.array(z.string()),
  specialGroups: z.array(z.string()),
  genes: z.array(z.string()).optional(),
});

const expectedRiskSchema = z.object({
  level: riskLevelEnum,
  ingredient: z.string().min(1),
  condition: z.string().optional(),
  medication: z.string().optional(),
  reasonCodeHint: z.string().nullable(),
});

const seedSchema = z.object({
  id: z.string().regex(/^S(0[1-9]|1[0-9]|20)$/),
  sourceQuestion: z.string().min(1),
  input: z.object({
    source: inputSourceEnum,
    tokens: z.array(normalizedTokenSchema).min(1),
  }),
  context: queryContextSchema,
  expectedRisks: z.array(expectedRiskSchema).min(1),
  expectedOverallLevel: riskLevelEnum,
  explanation: z.string().min(1),
});

const seedsSchema = z.object({
  _meta: z.object({
    version: z.string().min(1),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    totalCount: z.literal(20),
  }),
  seeds: z.array(seedSchema).length(20),
});

// ---- 通用：递归抽取所有 string，过禁词扫描 ----
function collectStrings(obj: unknown, acc: string[] = []): string[] {
  if (typeof obj === 'string') acc.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => collectStrings(x, acc));
  else if (obj && typeof obj === 'object') {
    Object.values(obj as Record<string, unknown>).forEach((x) => collectStrings(x, acc));
  }
  return acc;
}

function validateIdCoverage(actual: string[], expected: readonly string[], label: string): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    const missing = expectedSorted.filter((x) => !actualSorted.includes(x));
    const extra = actualSorted.filter((x) => !expectedSorted.includes(x));
    console.error(`✗ ${label} id 集合不一致`);
    if (missing.length) console.error(`  缺: ${missing.join(', ')}`);
    if (extra.length) console.error(`  多: ${extra.join(', ')}`);
    process.exit(1);
  }
}

function main(): void {
  const [, , type, path] = process.argv;
  if (!type || !path) {
    console.error('Usage: npx tsx scripts/validate-raw.ts <lpi|seeds> <path>');
    process.exit(2);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    console.error(`✗ 读文件/解析 JSON 失败：${(err as Error).message}`);
    process.exit(1);
  }

  const schemas: Record<string, z.ZodTypeAny> = { lpi: lpiSchema, seeds: seedsSchema };
  const schema = schemas[type];
  if (!schema) {
    console.error(`✗ 未知 type: ${type}（应为 lpi | seeds）`);
    process.exit(2);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error('✗ Zod schema 校验失败：');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  if (type === 'lpi') {
    const data = parsed.data as z.infer<typeof lpiSchema>;
    validateIdCoverage(data.rows.map((r) => r.id), LPI_30, 'LPI 30 成分');
  } else if (type === 'seeds') {
    const data = parsed.data as z.infer<typeof seedsSchema>;
    const expected = Array.from({ length: 20 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
    const actual = data.seeds.map((s) => s.id);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.error(`✗ seeds id 必须 S01..S20 顺序完整；实际: [${actual.join(', ')}]`);
      process.exit(1);
    }
  }

  const strings = collectStrings(raw);
  const bannedHits: string[] = [];
  for (const s of strings) {
    const r = scanBannedWords(s);
    if (!r.clean) {
      bannedHits.push(`"${s}" → [${r.hits.map((h) => h.word).join(', ')}]`);
    }
  }
  if (bannedHits.length > 0) {
    console.error(`✗ §11.2 禁词命中 ${bannedHits.length} 处：`);
    bannedHits.forEach((h) => console.error(`  - ${h}`));
    process.exit(1);
  }

  const count = type === 'lpi' ? '30 rows' : '20 seeds';
  console.log(`✓ ${type} valid: ${count}, schema match, 0 banned words`);
}

main();
