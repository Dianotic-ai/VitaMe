// file: tests/unit/agent/memoryPreview.spec.ts — buildMemoryPreview 隐私 + 去重 + cap + label 白名单
import { describe, it, expect } from 'vitest';
import { buildMemoryPreview } from '@/lib/agent/memoryPreview';

describe('buildMemoryPreview', () => {
  it('privacyMode 永远固定 local（隐私红线）', () => {
    const p = buildMemoryPreview({ personLabel: 'self', factsFromSession: [] });
    expect(p.privacyMode).toBe('local');
  });

  it('facts 去重（保留首次出现顺序）', () => {
    const p = buildMemoryPreview({
      personLabel: 'self',
      factsFromSession: ['吃华法林', '65 岁', '吃华法林', '有胃溃疡'],
    });
    expect(p.facts).toEqual(['吃华法林', '65 岁', '有胃溃疡']);
  });

  it('facts 最多 5 条（防 LLM 注入长串）', () => {
    const many = Array.from({ length: 10 }, (_, i) => `事实${i}`);
    const p = buildMemoryPreview({ personLabel: 'self', factsFromSession: many });
    expect(p.facts.length).toBe(5);
    expect(p.facts).toEqual(['事实0', '事实1', '事实2', '事实3', '事实4']);
  });

  it('空串 / 只含空白的 fact 会被过滤', () => {
    const p = buildMemoryPreview({
      personLabel: 'self',
      factsFromSession: ['', '  ', '真实事实', '\t\n'],
    });
    expect(p.facts).toEqual(['真实事实']);
  });

  it('非白名单 personLabel 回落到 other', () => {
    const p = buildMemoryPreview({ personLabel: 'sister', factsFromSession: [] });
    expect(p.personLabel).toBe('other');
  });

  it('白名单 personLabel 透传', () => {
    for (const label of ['self', 'mom', 'dad', 'child', 'other'] as const) {
      const p = buildMemoryPreview({ personLabel: label, factsFromSession: [] });
      expect(p.personLabel).toBe(label);
    }
  });
});
