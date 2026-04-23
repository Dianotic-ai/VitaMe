// file: tests/unit/queryIntake/clarify.spec.ts — clarify 模板包装 TDD
//
// 锁死：每个 ClarifyTopic 必有模板；choices 边界 (2-4)；question ≤40 字；schema 校验。

import { describe, it, expect } from 'vitest';
import { clarify } from '@/lib/capabilities/queryIntake/clarify';
import { ClarifyingQuestionSchema } from '@/lib/types/intent';

describe('clarify — 模板包装 (P0 deterministic)', () => {
  it('medication_context 默认 4 选', () => {
    const res = clarify('medication_context');
    expect(res.question).toBe('你目前在吃什么药?');
    expect(res.choices).toEqual(['华法林', 'SSRI 抗抑郁', '降压药', '都没在吃']);
    expect(() => ClarifyingQuestionSchema.parse(res)).not.toThrow();
  });

  it('product_disambiguation 默认 3 选', () => {
    const res = clarify('product_disambiguation');
    expect(res.question).toBe('想查哪个补剂或成分?');
    expect(res.choices.length).toBe(3);
  });

  it('symptom_specificity 默认 4 选', () => {
    const res = clarify('symptom_specificity');
    expect(res.choices).toEqual(['睡眠', '精力', '消化', '免疫']);
  });

  it('special_group 默认 4 选', () => {
    const res = clarify('special_group');
    expect(res.choices).toEqual(['孕期', '哺乳期', '儿童', '老年']);
  });

  it('suggestedChoices 在 2-4 范围 → 采用', () => {
    const res = clarify('medication_context', ['A', 'B', 'C']);
    expect(res.choices).toEqual(['A', 'B', 'C']);
  });

  it('suggestedChoices > 4 → 回落 canonical', () => {
    const res = clarify('medication_context', ['1', '2', '3', '4', '5', '6']);
    expect(res.choices).toEqual(['华法林', 'SSRI 抗抑郁', '降压药', '都没在吃']);
  });

  it('suggestedChoices < 2 (1 个) → 回落 canonical', () => {
    const res = clarify('medication_context', ['only one']);
    expect(res.choices).toEqual(['华法林', 'SSRI 抗抑郁', '降压药', '都没在吃']);
  });

  it('suggestedChoices 全是空白 → 回落 canonical', () => {
    const res = clarify('symptom_specificity', ['  ', '\t', '']);
    expect(res.choices).toEqual(['睡眠', '精力', '消化', '免疫']);
  });

  it('suggestedChoices 含空白和空字符串 → trim+filter 后剩 2 个，采用', () => {
    const res = clarify('symptom_specificity', [' 睡眠 ', '', '  消化  ']);
    expect(res.choices).toEqual(['睡眠', '消化']);
  });

  it('每个模板 question ≤40 字（DESIGN.md 移动端约束）', () => {
    const topics = [
      'medication_context',
      'product_disambiguation',
      'symptom_specificity',
      'special_group',
    ] as const;
    for (const t of topics) {
      const res = clarify(t);
      expect(res.question.length).toBeLessThanOrEqual(40);
      expect(res.question.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('返回结构经 ClarifyingQuestionSchema.strict() 校验通过', () => {
    const topics = [
      'medication_context',
      'product_disambiguation',
      'symptom_specificity',
      'special_group',
    ] as const;
    for (const t of topics) {
      expect(() => ClarifyingQuestionSchema.parse(clarify(t))).not.toThrow();
    }
  });
});
