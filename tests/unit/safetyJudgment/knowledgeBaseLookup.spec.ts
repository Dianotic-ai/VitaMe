// file: tests/unit/safetyJudgment/knowledgeBaseLookup.spec.ts — L1 知识库 OR 命中查询 TDD
//
// 对齐 CLAUDE.md §10.2 "no-data ≠ no-risk" 区分：
//   isInKnowledgeBase(slug) = slug 是否在 L1 任一 dict 中收录
//   在 → ingredient 已知，找不到风险 = green (no_known_risk)
//   不在 → ingredient 未收录，证据有限 = gray (no_data)
//
// 当前 L1 分布（D5 实情）：
//   - cn-dri-values.ts: biotin / calcium / magnesium 等 23 条 RNI/UL 数据
//   - lpi-values.ts:    biotin / coq10 / glucosamine / omega-3 / probiotics 等 30 条
//   - pubchem-cids.ts:  curcumin / fish-oil / coenzyme-q10 等 31 条形态映射
//   - ingredients.ts:   T-0.15 尚未实装（CLAUDE.md §10.2 提到 "等" 表 3 源 OR）

import { describe, it, expect } from 'vitest';
import { isInKnowledgeBase } from '@/lib/capabilities/safetyJudgment/knowledgeBaseLookup';

describe('knowledgeBaseLookup.isInKnowledgeBase — 三源 OR 命中', () => {
  it('在 cn-dri + lpi 同时命中的 slug → true（biotin）', () => {
    expect(isInKnowledgeBase('biotin')).toBe(true);
  });

  it('在 cn-dri + lpi + pubchem 三源都命中的 slug → true（calcium）', () => {
    expect(isInKnowledgeBase('calcium')).toBe(true);
  });

  it('只在 lpi 命中的 slug → true（glucosamine, lpi 独有）', () => {
    expect(isInKnowledgeBase('glucosamine')).toBe(true);
  });

  it('只在 lpi 命中的 slug → true（omega-3, lpi 独有）', () => {
    expect(isInKnowledgeBase('omega-3')).toBe(true);
  });

  it('只在 pubchem 命中的 slug → true（fish-oil, pubchem 独有）', () => {
    expect(isInKnowledgeBase('fish-oil')).toBe(true);
  });

  it('只在 pubchem 命中的 slug → true（curcumin, pubchem 独有）', () => {
    expect(isInKnowledgeBase('curcumin')).toBe(true);
  });

  it('只在 pubchem 命中的 slug → true（coenzyme-q10, pubchem 独有；注意 lpi 用的是 coq10 不同 slug）', () => {
    expect(isInKnowledgeBase('coenzyme-q10')).toBe(true);
  });

  it('未在任何 L1 源收录的中文俗名 → false（黄金燕窝肽）', () => {
    expect(isInKnowledgeBase('黄金燕窝肽')).toBe(false);
  });

  it('未在任何 L1 源收录的 slug → false', () => {
    expect(isInKnowledgeBase('made-up-ingredient-xyz')).toBe(false);
  });

  it('空字符串 → false（不应误命中）', () => {
    expect(isInKnowledgeBase('')).toBe(false);
  });

  it('OR 语义：任一源命中即返回 true，不要求三源都有', () => {
    // glucosamine 只在 lpi，不在 cn-dri 也不在 pubchem，但 OR 后应 true
    expect(isInKnowledgeBase('glucosamine')).toBe(true);
    // fish-oil 只在 pubchem，不在 cn-dri 也不在 lpi（lpi 用的是 omega-3），但 OR 后应 true
    expect(isInKnowledgeBase('fish-oil')).toBe(true);
  });
});
