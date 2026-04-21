// file: src/lib/capabilities/safetyJudgment/riskLevelMerger.ts — L2 合并器
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md §Components
// 职责：
//   1) pickOverallLevel：在 red > yellow > gray > green 顺序里取最严
//   2) mergeRisks：对同 (ingredient, medication|condition) 键的多条 Risk
//      保留最严级别 + 硬编码 > database 优先，次级别进 secondaryEvidence[]
//      不同源的参考入 conflictingSources[]

import type { Risk, RiskLevel } from '@/lib/types/risk';

const LEVEL_RANK: Record<RiskLevel, number> = { red: 3, yellow: 2, gray: 1, green: 0 };
const SOURCE_RANK: Record<Risk['evidence']['sourceType'], number> = {
  hardcoded: 4,
  database: 3,
  literature: 2,
  limited: 1,
  none: 0,
};

export function pickOverallLevel(risks: readonly Risk[]): RiskLevel {
  if (risks.length === 0) return 'green';
  return risks.reduce<RiskLevel>((acc, r) => (LEVEL_RANK[r.level] > LEVEL_RANK[acc] ? r.level : acc), 'green');
}

function keyOf(r: Risk): string {
  // medication 与 condition 共用 B 侧槽；二者不会同时填（见 hardcodedAdapter）
  return `${r.ingredient}|${r.medication ?? r.condition ?? ''}`;
}

/**
 * 合并同键多条 Risk。策略：
 * - 级别严重者 or 级别相同但 sourceType 更权威者 → 作为主 Risk
 * - 其它条目：evidence 进 secondaryEvidence[]，sourceRef 进 conflictingSources[]
 * - 完全相同的 Risk（同级别 + 同 sourceRef）→ 静默去重
 */
export function mergeRisks(input: readonly Risk[]): Risk[] {
  const groups = new Map<string, Risk[]>();
  for (const r of input) {
    const k = keyOf(r);
    const arr = groups.get(k);
    if (arr) arr.push(r);
    else groups.set(k, [r]);
  }

  const out: Risk[] = [];
  for (const bucket of groups.values()) {
    out.push(mergeBucket(bucket));
  }
  return out;
}

function mergeBucket(bucket: Risk[]): Risk {
  if (bucket.length === 1) return bucket[0]!;

  // 挑主 Risk：先按 level 降序，再按 sourceType 降序
  const sorted = [...bucket].sort((a, b) => {
    const diff = LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
    if (diff !== 0) return diff;
    return SOURCE_RANK[b.evidence.sourceType] - SOURCE_RANK[a.evidence.sourceType];
  });

  const primary: Risk = { ...sorted[0]! };
  const rest = sorted.slice(1);

  // TODO(P1, Wave 2+): primary 的 dimension/cta 会**吞掉**次值，只保留 evidence 进 secondaryEvidence。
  // P0 不咬：同 bucket 的 dimension 由 SubstanceKind 决定（同 medication/condition → 同 kind → 同
  // dimension），所以现有 3 路 adapter 不会产生冲突 dimension。未来 suppai 激活后，如果出现
  // "suppai drug_interaction vs hardcoded dose_caution" 这类同键跨维度冲突，需要加
  // conflictingDimensions / conflictingCtas 字段；否则策略/埋点会漏掉次维度。seed 测试若开始
  // 挂掉，先查是不是这里。
  const seenRefs = new Set<string>([primary.evidence.sourceRef]);
  const secondary: Risk['evidence'][] = [];
  const conflicting: string[] = [];

  for (const r of rest) {
    const ref = r.evidence.sourceRef;
    if (seenRefs.has(ref)) continue; // 去重：同 sourceRef 的重复 Risk
    seenRefs.add(ref);
    secondary.push(r.evidence);
    conflicting.push(ref);
  }

  if (secondary.length > 0) primary.secondaryEvidence = secondary;
  if (conflicting.length > 0) primary.conflictingSources = conflicting;
  return primary;
}
