// file: tests/unit/queryIntake/symptomCandidates.spec.ts — L0 症状→候选成分查询 TDD
//
// 对齐 CLAUDE.md §11.14 P0 例外：symptom_goal_query 走 SYMPTOM_INGREDIENTS 候选清单。
// 严格 TDD per §13.1（L0 capability 安全关键）。

import { describe, it, expect } from 'vitest';
import { lookupSymptomCandidates } from '@/lib/capabilities/queryIntake/symptomCandidates';

describe('lookupSymptomCandidates — 症状中文 → 候选成分', () => {
  it('精确中文匹配 "失眠" → insomnia', () => {
    const res = lookupSymptomCandidates(['失眠']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
    expect(res.matched[0]!.symptomZh).toBe('失眠');
  });

  it('同义词匹配 "睡不着" → insomnia', () => {
    const res = lookupSymptomCandidates(['睡不着']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
  });

  it('substring 匹配 "我最近老失眠了" → insomnia', () => {
    const res = lookupSymptomCandidates(['我最近老失眠了']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
  });

  it('多症状 ["失眠", "疲劳"] → 2 个 entry，按出现顺序', () => {
    const res = lookupSymptomCandidates(['失眠', '疲劳']);
    expect(res.matched.map((e) => e.symptomSlug)).toEqual(['insomnia', 'fatigue']);
  });

  it('同症状不同表述 ["失眠", "睡不着"] → dedupe 为 1 个', () => {
    const res = lookupSymptomCandidates(['失眠', '睡不着']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
  });

  it('无匹配 ["完全不存在的症状xyz"] → matched=[] + unmatched 保留原文', () => {
    const res = lookupSymptomCandidates(['完全不存在的症状xyz']);
    expect(res.matched).toEqual([]);
    expect(res.unmatched).toEqual(['完全不存在的症状xyz']);
  });

  it('空输入 → matched=[]', () => {
    const res = lookupSymptomCandidates([]);
    expect(res.matched).toEqual([]);
    expect(res.unmatched).toEqual([]);
  });

  it('每个 candidate 必带 sourceRefs（§12.2 evidence 强制）', () => {
    const res = lookupSymptomCandidates(['失眠', '疲劳', '免疫力低']);
    for (const entry of res.matched) {
      expect(entry.candidates.length).toBeGreaterThan(0);
      for (const c of entry.candidates) {
        expect(c.sourceRefs.length).toBeGreaterThan(0);
        for (const ref of c.sourceRefs) {
          expect(ref.source).toBe('lpi');
          expect(ref.url ?? '').toMatch(/^https:\/\/lpi\.oregonstate\.edu\//);
          expect(ref.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    }
  });

  it('返回结构不含 level/risk/safe 等任何风险字段（§11.13 红线）', () => {
    const res = lookupSymptomCandidates(['失眠']);
    const json = JSON.stringify(res);
    expect(json).not.toMatch(/"level"\s*:/);
    expect(json).not.toMatch(/"risk"\s*:/);
    expect(json).not.toMatch(/"safe"\s*:/);
    expect(json).not.toMatch(/"dangerous"\s*:/);
    expect(json).not.toMatch(/"verdict"\s*:/);
  });

  it('英文 trim + 大小写不敏感: " 失眠 " → insomnia', () => {
    const res = lookupSymptomCandidates([' 失眠 ']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
  });

  it('已知症状边界 "感冒" → common-cold（验证 15 条之一可触达）', () => {
    const res = lookupSymptomCandidates(['感冒']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('common-cold');
    const slugs = res.matched[0]!.candidates.map((c) => c.ingredientSlug);
    expect(slugs).toContain('vitamin-c');
    expect(slugs).toContain('zinc');
  });

  it('PMS 同义词 "经前综合征" → menstrual-discomfort', () => {
    const res = lookupSymptomCandidates(['经前综合征']);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('menstrual-discomfort');
  });
});
