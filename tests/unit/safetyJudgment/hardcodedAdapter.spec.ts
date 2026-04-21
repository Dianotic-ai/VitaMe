// file: tests/unit/safetyJudgment/hardcodedAdapter.spec.ts — L2 判断层第 1 路 adapter TDD
//
// 对齐 docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md §Testing 场景 1/2/3/4/5
// §13.1 要求 L2 judgment 必须 TDD；本测试跑红再实现。

import { describe, it, expect } from 'vitest';
import { hardcodedAdapter } from '@/lib/adapters/hardcodedAdapter';
import type { LookupRequest } from '@/lib/types/adapter';

const emptyReq: LookupRequest = {
  ingredients: [],
  medications: [],
  conditions: [],
};

describe('hardcodedAdapter — 50 条禁忌规则 SafetyAdapter', () => {
  it('name 为 hardcoded（AdapterSource 契约）', () => {
    expect(hardcodedAdapter.name).toBe('hardcoded');
  });

  it('空请求返回空 risks 且 partialData=false', async () => {
    const res = await hardcodedAdapter.lookup(emptyReq);
    expect(res.risks).toEqual([]);
    expect(res.partialData).toBe(false);
    expect(res.source).toBe('hardcoded');
  });

  it('场景 1 / Q4 —— 辅酶 Q10 × 华法林 → 1 条 red', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['coenzyme-q10'],
      medications: ['warfarin'],
      conditions: [],
    });
    expect(res.risks).toHaveLength(1);
    const r = res.risks[0]!;
    expect(r.level).toBe('red');
    expect(r.ingredient).toBe('coenzyme-q10');
    expect(r.medication).toBe('warfarin');
    expect(r.reasonCode).toBe('vitamin_k_like_effect');
    expect(r.evidence.sourceType).toBe('hardcoded');
    expect(r.evidence.sourceRef).toContain('vm-rule-coq10-warfarin');
    expect(r.evidence.confidence).toBe('high');
    // 新字段：drug × supplement → drug_interaction；red → stop_and_consult
    expect(r.dimension).toBe('drug_interaction');
    expect(r.cta).toBe('stop_and_consult');
  });

  it('场景 2 / Q1 —— 鱼油 + 维 B6 × SSRI → 2 条 yellow', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['fish-oil', 'vitamin-b6', 'vitamin-d', 'magnesium', 'probiotic', 'vitamin-c'],
      medications: ['ssri-use'],
      conditions: [],
    });
    // 命中：fishoil-ssri-highdose + b6-ssri-highdose；其余 4 个成分无对应硬编码规则
    expect(res.risks).toHaveLength(2);
    const ingredients = res.risks.map((r) => r.ingredient).sort();
    expect(ingredients).toEqual(['fish-oil', 'vitamin-b6']);
    for (const r of res.risks) {
      expect(r.level).toBe('yellow');
      expect(r.medication).toBe('ssri-use');
    }
  });

  it('场景 4 / Q7 —— 镁 × 胃溃疡 + 胃肠敏感 → 至少 1 条 yellow', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['magnesium'],
      medications: [],
      conditions: ['gastric-ulcer', 'gastric-sensitivity'],
    });
    expect(res.risks.length).toBeGreaterThanOrEqual(1);
    for (const r of res.risks) {
      expect(r.level).toBe('yellow');
      expect(r.ingredient).toBe('magnesium');
      expect(['gastric-ulcer', 'gastric-sensitivity']).toContain(r.condition);
    }
  });

  it('场景 3 / Q5 —— 鱼油 × APOE4 + 活动期肝炎 → 至少 2 条 yellow', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['fish-oil'],
      medications: [],
      conditions: ['active-hepatitis'],
      genes: ['apoe4'],
    });
    expect(res.risks.length).toBeGreaterThanOrEqual(2);
    const bSides = res.risks.map((r) => r.condition).sort();
    expect(bSides).toContain('apoe4');
    expect(bSides).toContain('active-hepatitis');
  });

  it('Q18 —— 维生素 A × 孕期 → 1 条 red（retinol 致畸红线）', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['vitamin-a'],
      medications: [],
      conditions: [],
      specialGroups: ['pregnancy'],
    });
    expect(res.risks.length).toBeGreaterThanOrEqual(1);
    const red = res.risks.find((r) => r.level === 'red');
    expect(red).toBeDefined();
    expect(red!.reasonCode).toBe('retinol_pregnancy_teratogenicity');
    expect(red!.condition).toBe('pregnancy');
    // pregnancy 是 specialGroup → population_caution 维度
    expect(red!.dimension).toBe('population_caution');
  });

  it('Q13 —— 铁 × 咖啡窗口 → 1 条 yellow（usageTiming 路径）', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['iron'],
      medications: [],
      conditions: [],
      timings: ['coffee-window'],
    });
    expect(res.risks).toHaveLength(1);
    const r = res.risks[0]!;
    expect(r.level).toBe('yellow');
    expect(r.reasonCode).toBe('coffee_reduces_iron_absorption');
    // usageTiming → dose_caution 维度
    expect(r.dimension).toBe('dose_caution');
  });

  it('Q19 —— 铁 × 长期高剂量 → 1 条 yellow（usageStrategy 路径）', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['iron'],
      medications: [],
      conditions: [],
      strategies: ['long-term-high-dose'],
    });
    expect(res.risks).toHaveLength(1);
    expect(res.risks[0]!.reasonCode).toBe('iron_long_term_requires_reassessment');
  });

  it('场景 5 —— 冷门成分 × 任意上下文 → 空数组（gray 由 Merger 兜底）', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['黄金燕窝肽'],
      medications: ['warfarin'],
      conditions: ['kidney-stone-history'],
    });
    expect(res.risks).toEqual([]);
    expect(res.partialData).toBe(false);
  });

  it('每条 Risk 都附 evidence 且 sourceType=hardcoded（合规红线 §11.4）', async () => {
    const res = await hardcodedAdapter.lookup({
      ingredients: ['coenzyme-q10', 'fish-oil', 'vitamin-a'],
      medications: ['warfarin', 'ssri-use'],
      conditions: [],
      specialGroups: ['pregnancy'],
    });
    expect(res.risks.length).toBeGreaterThan(0);
    for (const r of res.risks) {
      expect(r.evidence.sourceType).toBe('hardcoded');
      expect(r.evidence.sourceRef).toMatch(/^vm-rule-/);
      expect(r.evidence.confidence).toBe('high');
      expect(r.reasonShort.length).toBeGreaterThan(0);
    }
  });

  it('结果去重：同一 (ingredient, otherSlug) 二元组只产出一条 Risk', async () => {
    // 同时传 medications 与 conditions 都有相同 slug 不会发生（slug 命名空间隔离）
    // 但同一请求内重复成分应只触发一次
    const res = await hardcodedAdapter.lookup({
      ingredients: ['coenzyme-q10', 'coenzyme-q10'],
      medications: ['warfarin', 'warfarin'],
      conditions: [],
    });
    expect(res.risks).toHaveLength(1);
  });
});
