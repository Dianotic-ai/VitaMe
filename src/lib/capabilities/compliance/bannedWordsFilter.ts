// file: src/lib/capabilities/compliance/bannedWordsFilter.ts — §11.2 禁词扫描
//
// CLAUDE.md §11.2 红线：用户可见字符串不得含 治疗/治愈/处方/药效/根治/诊断 / diagnosis/prescribe/cure
// §10.4 合规中间件第二层「Banned」的实现。纯字符串扫描，无 LLM、无外部依赖。
// 本模块既服务 compliance middleware，也作为 TASK-4 TemplateFallback 的验收器。

export const BANNED_WORDS_ZH = ['治疗', '治愈', '处方', '药效', '根治', '诊断'] as const;
export const BANNED_WORDS_EN = ['diagnosis', 'prescribe', 'cure'] as const;

export type BannedWord =
  | (typeof BANNED_WORDS_ZH)[number]
  | (typeof BANNED_WORDS_EN)[number];

export interface BannedWordHit {
  word: BannedWord;
  index: number;
  category: 'zh' | 'en';
}

export interface BannedWordsScanResult {
  text: string;
  hits: readonly BannedWordHit[];
  clean: boolean;
}

// 英文变体 regex：词边界 + 常见屈折形式
// cure  → cure / cures / cured / curing（不含 cure-all / curate / procure / secure）
// prescribe → prescribe(s|d)? / prescribing / prescription
// diagnosis → diagnosis / diagnoses / diagnose(d)? / diagnosing
const EN_PATTERNS: ReadonlyArray<{ root: (typeof BANNED_WORDS_EN)[number]; regex: RegExp }> = [
  { root: 'cure', regex: /\bcur(?:e|es|ed|ing)\b/gi },
  { root: 'prescribe', regex: /\bprescrib(?:e|es|ed|ing)\b|\bprescription\b/gi },
  { root: 'diagnosis', regex: /\bdiagnos(?:is|es|e|ed|ing)\b/gi },
];

export function scanBannedWords(text: string): BannedWordsScanResult {
  const hits: BannedWordHit[] = [];

  for (const zh of BANNED_WORDS_ZH) {
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(zh, from);
      if (idx === -1) break;
      hits.push({ word: zh, index: idx, category: 'zh' });
      from = idx + zh.length;
    }
  }

  for (const { root, regex } of EN_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      hits.push({ word: root, index: m.index, category: 'en' });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  return { text, hits, clean: hits.length === 0 };
}

export function containsBannedWords(text: string): boolean {
  if (text.length === 0) return false;
  for (const zh of BANNED_WORDS_ZH) {
    if (text.includes(zh)) return true;
  }
  for (const { regex } of EN_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text)) return true;
  }
  return false;
}
