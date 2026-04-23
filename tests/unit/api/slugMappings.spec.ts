import { describe, expect, it } from 'vitest';
import { buildLookupRequest, parseIngredientQuery } from '@/lib/api/slugMappings';

describe('parseIngredientQuery', () => {
  it('matches single Chinese ingredient', () => {
    expect(parseIngredientQuery('鱼油')).toEqual(['fish-oil']);
  });

  it('matches multiple ingredients in one query string', () => {
    const out = parseIngredientQuery('鱼油 + 辅酶 Q10 + 益生菌');
    expect(out).toEqual(expect.arrayContaining(['fish-oil', 'coenzyme-q10', 'probiotic']));
  });

  it('matches Doctor\'s Best Magnesium 200mg → magnesium', () => {
    expect(parseIngredientQuery("Doctor's Best Magnesium 200mg")).toEqual(['magnesium']);
  });

  it('matches case-insensitive English keyword', () => {
    expect(parseIngredientQuery('Vitamin D')).toEqual(['vitamin-d']);
  });

  it('returns empty array on no match', () => {
    expect(parseIngredientQuery('完全无关字符串')).toEqual([]);
  });

  it('dedupes duplicates from overlapping aliases', () => {
    const out = parseIngredientQuery('鱼油 fish oil omega');
    expect(out).toEqual(['fish-oil']);
  });
});

describe('buildLookupRequest', () => {
  it('Q4 — CoQ10 + warfarin: maps query + medication option to slugs', () => {
    const req = buildLookupRequest({
      query: '辅酶 Q10',
      currentMedications: ['华法林 / 抗凝药'],
    });
    expect(req.ingredients).toEqual(['coenzyme-q10']);
    expect(req.medications).toEqual(['warfarin']);
    expect(req.conditions).toEqual([]);
    expect(req.specialGroups).toEqual([]);
  });

  it('Q1 — multi-ingredient + SSRI', () => {
    const req = buildLookupRequest({
      query: '鱼油 维 D 镁 益生菌 维 B 维 C',
      currentMedications: ['SSRI / 抗抑郁药'],
    });
    expect(req.ingredients).toEqual(
      expect.arrayContaining(['fish-oil', 'vitamin-d', 'magnesium', 'probiotic', 'vitamin-b-complex', 'vitamin-c']),
    );
    expect(req.medications).toEqual(['ssri-use']);
  });

  it('Q2 — 降压药 expands to amlodipine + class slug', () => {
    const req = buildLookupRequest({
      query: '鱼油',
      currentMedications: ['降压药'],
    });
    expect(req.medications).toEqual(expect.arrayContaining(['amlodipine', 'antihypertensive-stack']));
  });

  it('Q7 — 胃溃疡 + 镁 maps condition + ingredient', () => {
    const req = buildLookupRequest({
      query: '镁',
      chronicConditions: ['胃溃疡'],
    });
    expect(req.ingredients).toEqual(['magnesium']);
    expect(req.conditions).toEqual(['gastric-ulcer']);
  });

  it('Q18 — pregnancy special group', () => {
    const req = buildLookupRequest({
      query: '维生素 D',
      specialGroups: ['孕期'],
    });
    expect(req.ingredients).toEqual(['vitamin-d']);
    expect(req.specialGroups).toEqual(['pregnancy']);
  });

  it('unmapped condition labels (高血压/糖尿病) yield empty conditions; 肾病 D6 起映射 kidney-impairment', () => {
    // D6 P0 红规则解锁后，"肾病" / "肾功能不全" 进规范 slug。高血压/糖尿病 暂仍 unmapped。
    const req = buildLookupRequest({
      query: '鱼油',
      chronicConditions: ['高血压', '糖尿病', '肾病'],
    });
    expect(req.conditions).toEqual(['kidney-impairment']);
  });

  it('"都没有" / "无" sentinels produce empty arrays', () => {
    const req = buildLookupRequest({
      query: '鱼油',
      currentMedications: ['都没有'],
      chronicConditions: ['都没有'],
      specialGroups: ['无'],
    });
    expect(req.medications).toEqual([]);
    expect(req.conditions).toEqual([]);
    expect(req.specialGroups).toEqual([]);
  });
});
