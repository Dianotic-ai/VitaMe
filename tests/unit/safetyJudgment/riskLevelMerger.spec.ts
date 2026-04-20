// file: tests/unit/safetyJudgment/riskLevelMerger.spec.ts — L2 合并器 TDD
//
// 对齐 design spec §Components / §Data Flow / §Error Handling

import { describe, it, expect } from 'vitest';
import { mergeRisks, pickOverallLevel } from '@/lib/capabilities/safetyJudgment/riskLevelMerger';
import type { Risk } from '@/lib/types/risk';

function mkRisk(partial: Partial<Risk> & Pick<Risk, 'level' | 'ingredient' | 'reasonCode'>): Risk {
  return {
    reasonShort: partial.reasonShort ?? 'test reason',
    evidence: partial.evidence ?? {
      sourceType: 'hardcoded',
      sourceRef: 'vm-rule-test',
      confidence: 'high',
    },
    ...partial,
  } as Risk;
}

describe('pickOverallLevel — red > yellow > gray > green', () => {
  it('空数组返回 green（无 Risk 即无异常）', () => {
    expect(pickOverallLevel([])).toBe('green');
  });

  it('单条 red → red', () => {
    expect(pickOverallLevel([mkRisk({ level: 'red', ingredient: 'x', reasonCode: 'r' })])).toBe('red');
  });

  it('red + yellow + gray 混合 → red', () => {
    const risks = [
      mkRisk({ level: 'yellow', ingredient: 'a', reasonCode: 'a' }),
      mkRisk({ level: 'red', ingredient: 'b', reasonCode: 'b' }),
      mkRisk({ level: 'gray', ingredient: 'c', reasonCode: 'c' }),
    ];
    expect(pickOverallLevel(risks)).toBe('red');
  });

  it('yellow + green → yellow', () => {
    const risks = [
      mkRisk({ level: 'green', ingredient: 'a', reasonCode: 'a' }),
      mkRisk({ level: 'yellow', ingredient: 'b', reasonCode: 'b' }),
    ];
    expect(pickOverallLevel(risks)).toBe('yellow');
  });

  it('只有 gray → gray（数据不足不降级返绿）', () => {
    expect(
      pickOverallLevel([mkRisk({ level: 'gray', ingredient: 'a', reasonCode: 'no_data' })]),
    ).toBe('gray');
  });
});

describe('mergeRisks — 同键冲突保留最严 + 记 conflictingSources', () => {
  it('空输入返回空数组', () => {
    expect(mergeRisks([])).toEqual([]);
  });

  it('不同 ingredient 的 Risk 全部保留', () => {
    const risks = [
      mkRisk({ level: 'red', ingredient: 'coenzyme-q10', medication: 'warfarin', reasonCode: 'a' }),
      mkRisk({ level: 'yellow', ingredient: 'fish-oil', medication: 'warfarin', reasonCode: 'b' }),
    ];
    expect(mergeRisks(risks)).toHaveLength(2);
  });

  it('同 (ingredient, medication) 多来源 → 保留最严一条 + conflictingSources 数组', () => {
    const risks = [
      mkRisk({
        level: 'red',
        ingredient: 'coenzyme-q10',
        medication: 'warfarin',
        reasonCode: 'vitamin_k_like_effect',
        evidence: { sourceType: 'hardcoded', sourceRef: 'vm-rule-coq10-warfarin', confidence: 'high' },
      }),
      mkRisk({
        level: 'yellow',
        ingredient: 'coenzyme-q10',
        medication: 'warfarin',
        reasonCode: 'suppai_moderate',
        evidence: { sourceType: 'database', sourceRef: 'SUPP.AI:paper_xxx', confidence: 'medium' },
      }),
    ];
    const merged = mergeRisks(risks);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.level).toBe('red');
    expect(merged[0]!.evidence.sourceType).toBe('hardcoded'); // 硬编码 > database
    expect(merged[0]!.conflictingSources).toBeDefined();
    expect(merged[0]!.conflictingSources).toContain('SUPP.AI:paper_xxx');
    expect(merged[0]!.secondaryEvidence).toBeDefined();
    expect(merged[0]!.secondaryEvidence!.length).toBeGreaterThan(0);
  });

  it('同键同级别不重复附 conflictingSources（同源或完全相同则静默去重）', () => {
    const risks = [
      mkRisk({
        level: 'yellow',
        ingredient: 'fish-oil',
        medication: 'ssri-use',
        reasonCode: 'x',
        evidence: { sourceType: 'hardcoded', sourceRef: 'vm-rule-fishoil-ssri-highdose', confidence: 'high' },
      }),
      mkRisk({
        level: 'yellow',
        ingredient: 'fish-oil',
        medication: 'ssri-use',
        reasonCode: 'x',
        evidence: { sourceType: 'hardcoded', sourceRef: 'vm-rule-fishoil-ssri-highdose', confidence: 'high' },
      }),
    ];
    const merged = mergeRisks(risks);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.conflictingSources ?? []).not.toContain(
      'vm-rule-fishoil-ssri-highdose',
    );
  });

  it('ingredient × condition 与 ingredient × medication 视为不同键', () => {
    const risks = [
      mkRisk({
        level: 'yellow',
        ingredient: 'fish-oil',
        medication: 'warfarin',
        reasonCode: 'a',
      }),
      mkRisk({
        level: 'yellow',
        ingredient: 'fish-oil',
        condition: 'active-hepatitis',
        reasonCode: 'b',
      }),
    ];
    expect(mergeRisks(risks)).toHaveLength(2);
  });
});
