// file: src/lib/capabilities/queryIntake/clarify.ts — L0 clarify 模板包装（P0 deterministic-only）
//
// 对齐：design spec §d. clarify-style follow-up + CLAUDE.md §11.13（LLM 不判风险）。
//
// P0 决定：暂不调 LLM 包装措辞，全用预设模板。理由：
//   1) 模板措辞已 ≤40 字，符合 ClarifyingQuestionSchema；
//   2) 节省一次 LLM 调用 + 杜绝 LLM 加 choice 风险；
//   3) D9+ 若有时间再加一层 "LLM 微调措辞"（约束 buttonLabels 不变）。
//
// 输入：(topic, suggestedChoices?)。suggestedChoices 来自 slotResolver；若 2-4 条则采用，
//        其余（空 / >4）回到 CANONICAL 默认 4 选。
// 输出：ClarifyingQuestion，**保证**通过 ClarifyingQuestionSchema.parse。

import {
  ClarifyingQuestionSchema,
  type ClarifyTopic,
  type ClarifyingQuestion,
} from '@/lib/types/intent';

const CANONICAL: Record<ClarifyTopic, ClarifyingQuestion> = {
  medication_context: {
    question: '你目前在吃什么药?',
    choices: ['华法林', 'SSRI 抗抑郁', '降压药', '都没在吃'],
  },
  product_disambiguation: {
    question: '想查哪个补剂或成分?',
    choices: ['手动输入名字', '拍照配料表', '我不确定'],
  },
  symptom_specificity: {
    question: '更具体是哪类不适?',
    choices: ['睡眠', '精力', '消化', '免疫'],
  },
  special_group: {
    question: '属于哪类特殊人群?',
    choices: ['孕期', '哺乳期', '儿童', '老年'],
  },
};

export function clarify(
  topic: ClarifyTopic,
  suggestedChoices?: readonly string[],
): ClarifyingQuestion {
  const cleaned = (suggestedChoices ?? [])
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const choices =
    cleaned.length >= 2 && cleaned.length <= 4 ? cleaned : CANONICAL[topic].choices;

  // .strict() schema 会 reject 任何越权字段；choices 长度 / question 字数都在这里强制。
  return ClarifyingQuestionSchema.parse({
    question: CANONICAL[topic].question,
    choices,
  });
}
