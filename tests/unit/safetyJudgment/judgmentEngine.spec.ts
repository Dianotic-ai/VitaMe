// file: tests/unit/safetyJudgment/judgmentEngine.spec.ts — L2 引擎 TDD
//
// 对齐 design spec §Architecture / §Data Flow
// 覆盖：3 路并发 → Merger → JudgmentResult

import { describe, it, expect, vi } from 'vitest';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';
import { isInKnowledgeBase } from '@/lib/capabilities/safetyJudgment/knowledgeBaseLookup';
import { suppaiAdapter } from '@/lib/adapters/suppaiAdapter';

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
    // W2-A：suppai 已激活，三路 adapter 自然态均 partialData=false
    expect(res.partialData).toBe(false);
  });

  it('Q1 / 6 成分 × SSRI → overallLevel=yellow；未命中成分按 KB 拆 green(no_known_risk)/gray(no_data)（v2.8）', async () => {
    // CLAUDE.md §10.2 v2.8 红线：no-data ≠ no-risk
    //   - KB 已知 + 无规则触发 → green no_known_risk
    //   - KB 未收录 → gray no_data
    // 故意混入「黄金燕窝肽」这种 KB 真未收录的冷门成分来覆盖 gray 路径。
    // 注：probiotic / fish-oil 在 KB_ALIAS 修复后已被 isInKnowledgeBase 判为 known，
    // 不再适合作为 gray fixture（D5 晚 seed Q10 暴露的命名分裂 bug 已修）。
    const ingredients = ['fish-oil', 'vitamin-b6', 'vitamin-d', 'magnesium', '黄金燕窝肽', 'vitamin-c'];
    const res = await judge('test-q1', {
      ingredients,
      medications: ['ssri-use'],
      conditions: [],
    });
    expect(res.overallLevel).toBe('yellow');
    const yellows = res.risks.filter((r) => r.level === 'yellow');
    const greens = res.risks.filter((r) => r.level === 'green');
    const grays = res.risks.filter((r) => r.level === 'gray');
    expect(yellows).toHaveLength(2);
    // 未命中规则的成分都应有 1 条兜底（不重复），无论 green / gray
    const hitYellowIds = new Set(yellows.map((r) => r.ingredient));
    const fallbackIds = ingredients.filter((id) => !hitYellowIds.has(id));
    expect(greens.length + grays.length).toBe(fallbackIds.length);
    // green 必须是 KB 已知；gray 必须是 KB 未收录
    for (const g of greens) {
      expect(g.reasonCode).toBe('no_known_risk');
      expect(isInKnowledgeBase(g.ingredient)).toBe(true);
    }
    for (const g of grays) {
      expect(g.reasonCode).toBe('no_data');
      expect(isInKnowledgeBase(g.ingredient)).toBe(false);
    }
    // 「黄金燕窝肽」KB 真未收录 → 必为 gray no_data
    expect(grays.some((r) => r.ingredient === '黄金燕窝肽')).toBe(true);
  });

  it('场景 5a / 冷门成分（KB 未收录）→ overallLevel=gray, reasonCode=no_data', async () => {
    // CLAUDE.md §10.2 v2.8: 未在 L1 任一 dict 收录 → "我们没收录" gray
    const res = await judge('test-cold', {
      ingredients: ['黄金燕窝肽'],
      medications: ['warfarin'],
      conditions: ['kidney-stone-history'],
    });
    expect(res.overallLevel).toBe('gray');
    expect(res.risks).toHaveLength(1);
    expect(res.risks[0]!.level).toBe('gray');
    expect(res.risks[0]!.reasonCode).toBe('no_data');
    expect(res.risks[0]!.evidence.sourceType).toBe('none');
    expect(res.risks[0]!.evidence.confidence).toBe('unknown');
    expect(res.risks[0]!.dimension).toBe('coverage_gap');
    expect(res.risks[0]!.cta).toBe('recheck_with_more_context');
  });

  it('场景 5b / 已知成分（KB 命中 + 无 context）→ overallLevel=green, reasonCode=no_known_risk', async () => {
    // CLAUDE.md §10.2 v2.8: KB 已知 + 三路 adapter 全部 no-hit → "已检查未见风险" green
    // biotin 在 cn-dri + lpi 命中；硬编码/SUPP.AI/DDInter 都没有 biotin × {无} 规则
    const res = await judge('test-known-bare', {
      ingredients: ['biotin'],
      medications: [],
      conditions: [],
    });
    expect(res.overallLevel).toBe('green');
    expect(res.risks).toHaveLength(1);
    expect(res.risks[0]!.level).toBe('green');
    expect(res.risks[0]!.reasonCode).toBe('no_known_risk');
    expect(res.risks[0]!.cta).toBe('basic_ok');
    expect(res.risks[0]!.dimension).toBe('coverage_gap');
    expect(res.risks[0]!.ingredient).toBe('biotin');
  });

  it('场景 5c / 已知成分 + condition（无规则触发）→ overallLevel=green, reasonCode=no_known_risk', async () => {
    // CLAUDE.md §10.2 v2.8: KB 已知 + 给了 condition 但没规则匹配 → 仍是 green，不掩盖为 gray
    // biotin × hypertension-history 无任何 hardcoded/suppai/ddinter 规则
    const res = await judge('test-known-with-context', {
      ingredients: ['biotin'],
      medications: [],
      conditions: ['hypertension-history'],
    });
    expect(res.overallLevel).toBe('green');
    expect(res.risks).toHaveLength(1);
    expect(res.risks[0]!.level).toBe('green');
    expect(res.risks[0]!.reasonCode).toBe('no_known_risk');
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

  it('partialReason 必须是固定白名单码（§11.12 红线）+ 不掩盖主判定', async () => {
    // W2-A 后：suppai 已激活，自然态不会触发 partialData=true。
    // 但 §11.12 红线要求 partialReason 只能输出 3 个白名单码、严禁透 adapter.error 诊断串。
    // 此处用 vi.spyOn 注入一次性 suppai 降级，验证：
    //   1) partialReason === 'suppai_partial'（白名单码命中）
    //   2) 不含 adapter.ts:45 的诊断串（adapter.error 约定"仅 audit，不进 UI"）
    //   3) 主判定不被降级掩盖（CoQ10 × 华法林 仍 red）
    const spy = vi.spyOn(suppaiAdapter, 'lookup').mockResolvedValueOnce({
      risks: [],
      partialData: true,
      source: 'suppai',
      error: 'MOCKED_DIAGNOSTIC_should_not_leak',
    });

    const res = await judge('test-partial', {
      ingredients: ['coenzyme-q10'],
      medications: ['warfarin'],
      conditions: [],
    });

    expect(res.partialData).toBe(true);
    expect(res.overallLevel).toBe('red');
    expect(res.partialReason).toBe('suppai_partial');

    const ALLOWED_CODES = ['hardcoded_partial', 'suppai_partial', 'ddinter_partial'];
    const codes = res.partialReason!.split(',');
    for (const code of codes) {
      expect(ALLOWED_CODES).toContain(code);
    }
    // 锁死契约：诊断串不得透出
    expect(res.partialReason).not.toContain('MOCKED_DIAGNOSTIC');
    expect(res.partialReason).not.toContain('should_not_leak');

    spy.mockRestore();
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
