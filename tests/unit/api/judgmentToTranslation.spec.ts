// 端到端：handleJudgment → handleTranslation 串起来跑一道真种子（CoQ10 + 华法林）
// 不连真 LLM，用 fake client；目的是验证：
//   (a) JudgmentResult.risks 能直接喂给 /api/translation 通过 Zod 校验
//   (b) overallLevel 在两端一致
//   (c) disclaimer + translatedRisks 形态完整
import { describe, expect, it, vi } from 'vitest';
import { handleJudgment } from '@/app/api/judgment/route';
import { handleTranslation } from '@/app/api/translation/route';
import type { JudgmentResult, TranslationResult } from '@/lib/types/risk';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';

const fakeClient: LLMClient = {
  chat: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      translation: '辅酶 Q10 与华法林同服可能影响指标稳定。',
      avoidance: '建议先咨询医生。',
    }),
    provider: 'minimax',
    model: 'MiniMax-M2.7',
    finishReason: 'stop',
  } satisfies LLMResult),
};

describe('end-to-end: judgment → translation', () => {
  it('CoQ10 + warfarin: red verdict survives end-to-end with disclaimer', async () => {
    const j = await handleJudgment({
      sessionId: 'e2e-1',
      request: { ingredients: ['coenzyme-q10'], medications: ['warfarin'], conditions: [] },
    });
    expect(j.status).toBe(200);
    const judgment = (await j.json()) as JudgmentResult;

    const t = await handleTranslation({ sessionId: judgment.sessionId, risks: judgment.risks }, fakeClient);
    expect(t.status).toBe(200);
    const translation = (await t.json()) as TranslationResult;

    expect(translation.sessionId).toBe('e2e-1');
    expect(translation.overallLevel).toBe(judgment.overallLevel);
    expect(translation.disclaimer.length).toBeGreaterThan(0);
    expect(translation.translatedRisks.length).toBeGreaterThan(0);
    for (const tr of translation.translatedRisks) {
      expect(tr.translation.length).toBeGreaterThan(0);
      expect(tr.avoidance.length).toBeGreaterThan(0);
      expect(typeof tr.fallbackUsed).toBe('boolean');
    }
  });

  it('unknown ingredient: gray no_data flows through and gets a fallback translation', async () => {
    const j = await handleJudgment({
      sessionId: 'e2e-2',
      request: { ingredients: ['totally-fake-ingredient-xyz'], medications: [], conditions: [] },
    });
    const judgment = (await j.json()) as JudgmentResult;
    expect(judgment.overallLevel).toBe('gray');

    const t = await handleTranslation({ sessionId: judgment.sessionId, risks: judgment.risks }, fakeClient);
    const translation = (await t.json()) as TranslationResult;
    expect(translation.translatedRisks.length).toBeGreaterThan(0);
    expect(translation.disclaimer.length).toBeGreaterThan(0);
  });
});
