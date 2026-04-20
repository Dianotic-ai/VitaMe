// file: tests/unit/safetyJudgment/judgmentEngine.spec.ts — L2 引擎 TDD
//
// 对齐 design spec §Architecture / §Data Flow
// 覆盖：3 路并发 → Merger → JudgmentResult

import { describe, it, expect } from 'vitest';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';

describe('judgmentEngine — 3 路并发 + 合并 + overallLevel', () => {
  it('Q4 / 辅酶 Q10 × 华法林 → overallLevel=red，1 条 red risk', async () => {
    const res = await judge('test-q4', {
      ingredients: ['coenzyme-q10'],
      medications: ['warfarin'],
      conditions: [],
    });
    expect(res.sessionId).toBe('test-q4');
    expect(res.overallLevel).toBe('red');
    expect(res.risks.filter((r) => r.level === 'red')).toHaveLength(1);
    // suppai 未烘焙 → partialData=true
    expect(res.partialData).toBe(true);
  });

  it('Q1 / 6 成分 × SSRI → overallLevel=yellow，命中 2 条 yellow + 4 条未命中成分补 gray', async () => {
    const res = await judge('test-q1', {
      ingredients: ['fish-oil', 'vitamin-b6', 'vitamin-d', 'magnesium', 'probiotic', 'vitamin-c'],
      medications: ['ssri-use'],
      conditions: [],
    });
    expect(res.overallLevel).toBe('yellow');
    const yellows = res.risks.filter((r) => r.level === 'yellow');
    const grays = res.risks.filter((r) => r.level === 'gray');
    expect(yellows).toHaveLength(2);
    // 未命中成分（vit-d / mg / probiotic / vit-c）补 gray（§Error Handling "no_data"）
    expect(grays.length).toBeGreaterThanOrEqual(4);
    for (const g of grays) {
      expect(g.reasonCode).toBe('no_data');
    }
  });

  it('场景 5 / 冷门成分 → overallLevel=gray', async () => {
    const res = await judge('test-cold', {
      ingredients: ['黄金燕窝肽'],
      medications: ['warfarin'],
      conditions: ['kidney-stone-history'],
    });
    expect(res.overallLevel).toBe('gray');
    expect(res.risks).toHaveLength(1);
    expect(res.risks[0]!.level).toBe('gray');
    expect(res.risks[0]!.reasonCode).toBe('no_data');
    expect(res.risks[0]!.evidence.sourceType).toBe('limited');
  });

  it('空 ingredients → overallLevel=green，risks=[]', async () => {
    const res = await judge('test-empty', {
      ingredients: [],
      medications: [],
      conditions: [],
    });
    expect(res.overallLevel).toBe('green');
    expect(res.risks).toEqual([]);
  });

  it('红色规则存在时 partialData 不掩盖主判定', async () => {
    // SUPP.AI 空桩 partialData=true；但 overallLevel 依然必须是 red
    const res = await judge('test-partial', {
      ingredients: ['coenzyme-q10'],
      medications: ['warfarin'],
      conditions: [],
    });
    expect(res.partialData).toBe(true);
    expect(res.overallLevel).toBe('red');
  });

  it('sessionId 原样透传到 JudgmentResult', async () => {
    const res = await judge('abc-123', {
      ingredients: [],
      medications: [],
      conditions: [],
    });
    expect(res.sessionId).toBe('abc-123');
  });
});
