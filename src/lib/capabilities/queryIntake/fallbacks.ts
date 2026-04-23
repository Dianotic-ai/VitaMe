// file: src/lib/capabilities/queryIntake/fallbacks.ts — L0 LLM 链路兜底文案（design spec §e）
//
// 3 条固定文案。任何 LLM 失败 / Zod reject / 越权字段都回到这里，
// 严禁透出 raw LLM 文本（CLAUDE.md §11.6 / §11.13）。

import type { ClarifyingQuestion } from '@/lib/types/intent';

/** 完全没听懂时的兜底问句（design spec §e 文案 1）。 */
export function parseIntentFallback(): ClarifyingQuestion {
  return {
    question: '没听懂,能换个说法吗?',
    choices: ['查某个补剂能不能吃', '某症状该补什么', '都不是'],
  };
}

/** 缺商品名时的兜底（design spec §e 文案 2）。P0 暂只在 slotResolver 用。 */
export function missingProductFallback(): ClarifyingQuestion {
  return {
    question: '想查哪个补剂或成分?',
    choices: ['手动输入名字', '拍照配料表', '我不确定'],
  };
}

/** 缺药物上下文时的兜底（design spec §e 文案 3）。P0 暂只在 slotResolver 用。 */
export function missingMedicationContextFallback(): ClarifyingQuestion {
  return {
    question: '你目前在吃什么药?',
    choices: ['华法林', 'SSRI 抗抑郁', '降压药', '都没在吃'],
  };
}
