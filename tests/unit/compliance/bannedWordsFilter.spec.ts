// file: tests/unit/compliance/bannedWordsFilter.spec.ts — §11.2 禁词过滤器契约
// 对齐 CLAUDE.md §11.2（禁词清单）、§13.1（强制 TDD）、§10.4（compliance middleware 第二层 Banned）

import { describe, it, expect } from 'vitest';
import {
  scanBannedWords,
  containsBannedWords,
  BANNED_WORDS_ZH,
  BANNED_WORDS_EN,
} from '@/lib/capabilities/compliance/bannedWordsFilter';

describe('bannedWordsFilter — 禁词扫描', () => {
  describe('禁词清单对齐 CLAUDE.md §11.2', () => {
    it('中文禁词恰好 6 个：治疗 / 治愈 / 处方 / 药效 / 根治 / 诊断', () => {
      expect(BANNED_WORDS_ZH).toEqual(['治疗', '治愈', '处方', '药效', '根治', '诊断']);
    });

    it('英文禁词根恰好 3 个：diagnosis / prescribe / cure', () => {
      expect(BANNED_WORDS_EN).toEqual(['diagnosis', 'prescribe', 'cure']);
    });
  });

  describe('scanBannedWords 基础行为', () => {
    it('空字符串返回 clean=true 且 hits=[]', () => {
      const r = scanBannedWords('');
      expect(r.clean).toBe(true);
      expect(r.hits).toEqual([]);
    });

    it('纯 whitespace 返回 clean=true', () => {
      expect(scanBannedWords('   \n\t  ').clean).toBe(true);
    });

    it('干净文本返回 clean=true', () => {
      const r = scanBannedWords('这个补剂建议避开，留意一下和药物的相互作用');
      expect(r.clean).toBe(true);
      expect(r.hits).toEqual([]);
    });

    it('返回对象包含原始 text 字段', () => {
      const text = '一段文字';
      expect(scanBannedWords(text).text).toBe(text);
    });
  });

  describe('中文禁词检测', () => {
    it.each([
      ['治疗', '这药可以治疗感冒'],
      ['治愈', '服用后可治愈失眠'],
      ['处方', '医生开了处方'],
      ['药效', '药效显著'],
      ['根治', '根治高血压'],
      ['诊断', '这不是诊断意见'],
    ])('命中中文禁词「%s」', (word, text) => {
      const r = scanBannedWords(text);
      expect(r.clean).toBe(false);
      expect(r.hits.length).toBeGreaterThanOrEqual(1);
      expect(r.hits.some((h) => h.word === word && h.category === 'zh')).toBe(true);
    });

    it('同词多次出现记录多条 hit，index 各不相同', () => {
      const r = scanBannedWords('治疗A、治疗B、治疗C');
      const treatHits = r.hits.filter((h) => h.word === '治疗');
      expect(treatHits).toHaveLength(3);
      const indices = treatHits.map((h) => h.index);
      expect(new Set(indices).size).toBe(3);
    });

    it('hit.index 指向词首字符位置', () => {
      const text = 'abc治疗def';
      const r = scanBannedWords(text);
      const h = r.hits.find((x) => x.word === '治疗')!;
      expect(h.index).toBe(3);
      expect(text.slice(h.index, h.index + h.word.length)).toBe('治疗');
    });
  });

  describe('英文禁词检测（大小写不敏感 + 词边界 + 常见变体）', () => {
    it.each([
      ['cure', 'This will cure you'],
      ['cure', 'This will CURE you'],
      ['cure', 'This will Cure you'],
      ['cure', 'cures many ailments'],
      ['cure', 'was cured overnight'],
      ['cure', 'curing symptoms'],
      ['prescribe', 'doctor will prescribe'],
      ['prescribe', 'prescribed medicine'],
      ['prescribe', 'writing a prescription'],
      ['diagnosis', 'not a diagnosis'],
      ['diagnosis', 'diagnosed with'],
      ['diagnosis', 'to diagnose'],
    ])('命中英文禁词根「%s」于「%s」', (root, text) => {
      const r = scanBannedWords(text);
      expect(r.clean).toBe(false);
      expect(r.hits.some((h) => h.word === root && h.category === 'en')).toBe(true);
    });

    it.each([
      'secure connection',
      'procure supplies',
      'curate the list',
      'obscure reference',
      'insecure state',
    ])('词边界：不误伤「%s」', (text) => {
      expect(scanBannedWords(text).clean).toBe(true);
    });

    it('大写 CURE 也命中', () => {
      const r = scanBannedWords('CURE ALL');
      expect(r.clean).toBe(false);
      expect(r.hits[0]!.word).toBe('cure');
    });
  });

  describe('混合场景', () => {
    it('中英混合多命中', () => {
      const r = scanBannedWords('医生诊断后开了处方，claims to cure everything');
      expect(r.clean).toBe(false);
      const words = r.hits.map((h) => h.word).sort();
      expect(words).toEqual(['cure', '处方', '诊断']);
    });

    it('hits 顺序按 index 升序返回', () => {
      const r = scanBannedWords('治疗 cure 处方');
      const indices = r.hits.map((h) => h.index);
      const sorted = [...indices].sort((a, b) => a - b);
      expect(indices).toEqual(sorted);
    });
  });

  describe('containsBannedWords 布尔短路', () => {
    it('clean 文本返回 false', () => {
      expect(containsBannedWords('一切正常')).toBe(false);
    });

    it('含禁词返回 true', () => {
      expect(containsBannedWords('这可以治疗')).toBe(true);
      expect(containsBannedWords('will cure')).toBe(true);
    });

    it('空输入返回 false', () => {
      expect(containsBannedWords('')).toBe(false);
    });
  });
});
