// file: tests/unit/queryIntake/intakeOrchestrator.spec.ts — L0 4 handler 路由 TDD
//
// 用 fake LLMClient 注入受控 IntentResult，验证 4 类 intent 各自走对分支。

import { describe, it, expect, vi } from 'vitest';
import { intakeOrchestrator } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';
import type { IntentResult } from '@/lib/types/intent';

function fakeLLM(intentResult: IntentResult): LLMClient {
  const result: LLMResult = {
    text: JSON.stringify(intentResult),
    provider: 'fake',
    model: 'fake-model',
    finishReason: 'stop',
  };
  return {
    chat: vi.fn().mockResolvedValue(result),
  };
}

const baseIntent: IntentResult = {
  intent: 'product_safety_check',
  productMentions: [],
  ingredientMentions: [],
  medicationMentions: [],
  conditionMentions: [],
  specialGroupMentions: [],
  symptomMentions: [],
  missingSlots: [],
  clarifyingQuestion: null,
};

describe('intakeOrchestrator — 4 handler 路由', () => {
  it('product_safety_check + ingredient + medication → pass_through 给 L2', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'product_safety_check',
      ingredientMentions: ['辅酶 Q10'],
      medicationMentions: ['华法林'],
    });
    const res = await intakeOrchestrator('s1', { rawQuery: '辅酶 Q10 + 华法林能一起吃吗?' }, { llmClient: llm });
    expect(res.kind).toBe('pass_through');
    if (res.kind !== 'pass_through') return;
    expect(res.sessionId).toBe('s1');
    expect(res.lookupRequest.ingredients).toContain('coenzyme-q10');
    expect(res.lookupRequest.medications).toContain('warfarin');
  });

  it('product_safety_check + product 名 + 缺成分 → clarify product_disambiguation', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'product_safety_check',
      productMentions: ['Doctor\'s Best 镁片'],
      ingredientMentions: [],
    });
    const res = await intakeOrchestrator('s2', { rawQuery: 'Doctor\'s Best 镁片能吃吗?' }, { llmClient: llm });
    expect(res.kind).toBe('clarify_needed');
    if (res.kind !== 'clarify_needed') return;
    expect(res.topic).toBe('product_disambiguation');
    expect(res.question.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('product_safety_check + 高风险 ingredient + 无 context → clarify medication_context', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'product_safety_check',
      ingredientMentions: ['辅酶 Q10'],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
    });
    const res = await intakeOrchestrator('s3', { rawQuery: '辅酶 Q10 能吃吗?' }, { llmClient: llm });
    expect(res.kind).toBe('clarify_needed');
    if (res.kind !== 'clarify_needed') return;
    expect(res.topic).toBe('medication_context');
    expect(res.question.choices).toContain('华法林');
  });

  it('symptom_goal_query + recognized symptom → symptom_candidates', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'symptom_goal_query',
      symptomMentions: ['失眠'],
    });
    const res = await intakeOrchestrator('s4', { rawQuery: '我老是失眠' }, { llmClient: llm });
    expect(res.kind).toBe('symptom_candidates');
    if (res.kind !== 'symptom_candidates') return;
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0]!.symptomSlug).toBe('insomnia');
    expect(res.matched[0]!.candidates.length).toBeGreaterThan(0);
  });

  it('symptom_goal_query + 笼统词（"累"）→ slotResolver 通常会让 parseIntent 返 vague，但这里直接给"累" → unmatched → clarify symptom_specificity', async () => {
    // "累" 不在 SYMPTOM_INGREDIENTS_BY_ZH 也不是任何 entry 的 zh/synonym 子串
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'symptom_goal_query',
      symptomMentions: ['累'],
    });
    const res = await intakeOrchestrator('s5', { rawQuery: '我妈最近老觉得累' }, { llmClient: llm });
    // 注意 "累" 是 "疲劳" 的同义词，疲劳同义词列表含 "总觉得累" 但不含 "累" 单字
    // → unmatched → fallback clarify
    if (res.kind === 'symptom_candidates') {
      // 若未来 synonyms 加入"累"单字，这条也算合理
      expect(res.matched.length).toBeGreaterThan(0);
    } else {
      expect(res.kind).toBe('clarify_needed');
      if (res.kind !== 'clarify_needed') return;
      expect(res.topic).toBe('symptom_specificity');
    }
  });

  it('symptom_goal_query + 完全无 symptomMentions → clarify symptom_specificity', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'symptom_goal_query',
      symptomMentions: [],
    });
    const res = await intakeOrchestrator('s6', { rawQuery: '我想补点东西' }, { llmClient: llm });
    expect(res.kind).toBe('clarify_needed');
    if (res.kind !== 'clarify_needed') return;
    expect(res.topic).toBe('symptom_specificity');
  });

  it('unclear → clarify product_disambiguation 用 parseIntent 自带的 clarifyingQuestion', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'unclear',
      clarifyingQuestion: { question: '没听懂,能换个说法吗?', choices: ['A', 'B', 'C'] },
    });
    const res = await intakeOrchestrator('s7', { rawQuery: 'asdfghjkl' }, { llmClient: llm });
    expect(res.kind).toBe('clarify_needed');
    if (res.kind !== 'clarify_needed') return;
    expect(res.topic).toBe('product_disambiguation');
    expect(res.question.question).toBe('没听懂,能换个说法吗?');
  });

  it('未支持 intent (ingredient_translation) → unsupported', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'ingredient_translation',
      ingredientMentions: ['EPA'],
    });
    const res = await intakeOrchestrator('s8', { rawQuery: 'EPA 是什么?' }, { llmClient: llm });
    expect(res.kind).toBe('unsupported');
    if (res.kind !== 'unsupported') return;
    expect(res.intent).toBe('ingredient_translation');
  });

  it('photo_label_parse → unsupported（P0 OCR 单独走 ocrAdapter）', async () => {
    const llm = fakeLLM({ ...baseIntent, intent: 'photo_label_parse' });
    const res = await intakeOrchestrator('s9', { rawQuery: '[图片]', imageOcrText: '配料: ...' }, { llmClient: llm });
    expect(res.kind).toBe('unsupported');
  });

  it('parseIntent 失败（无 llmClient）→ intent=unclear → clarify product_disambiguation', async () => {
    const res = await intakeOrchestrator('s10', { rawQuery: '随便说点啥' });
    expect(res.kind).toBe('clarify_needed');
    if (res.kind !== 'clarify_needed') return;
    expect(res.topic).toBe('product_disambiguation');
    // fallback 文案
    expect(res.question.question.length).toBeGreaterThanOrEqual(4);
  });

  it('sessionId 原样透传到 outcome', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'unclear',
      clarifyingQuestion: { question: '没听懂,能换个说法吗?', choices: ['A', 'B'] },
    });
    const res = await intakeOrchestrator('abc-123', { rawQuery: 'xyz' }, { llmClient: llm });
    expect(res.sessionId).toBe('abc-123');
  });

  it('outcome 不含任何风险字段（§11.13 红线）', async () => {
    const llm = fakeLLM({
      ...baseIntent,
      intent: 'product_safety_check',
      ingredientMentions: ['维生素 D'],
      medicationMentions: [],
    });
    const res = await intakeOrchestrator('s11', { rawQuery: '维生素 D 能吃吗' }, { llmClient: llm });
    const json = JSON.stringify(res);
    expect(json).not.toMatch(/"level"\s*:/);
    expect(json).not.toMatch(/"safe"\s*:/);
    expect(json).not.toMatch(/"dangerous"\s*:/);
    expect(json).not.toMatch(/"risk_level"\s*:/);
  });
});
