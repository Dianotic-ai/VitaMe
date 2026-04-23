import { describe, expect, it, vi } from 'vitest';
import { handleTranslation } from '@/app/api/translation/route';
import { DISCLAIMER_TEXT } from '@/lib/capabilities/safetyTranslation/translateRisks';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';
import type { Risk, TranslationResult } from '@/lib/types/risk';

const okRisk: Risk = {
  level: 'red',
  dimension: 'drug_interaction',
  cta: 'stop_and_consult',
  ingredient: 'coq10',
  medication: 'warfarin',
  reasonCode: 'vitamin_k_like_effect',
  reasonShort: '类维生素 K 效应',
  evidence: { sourceType: 'hardcoded', sourceRef: 'VitaMe-rule-coQ10_warfarin', confidence: 'high' },
};

function fakeClient(text: string): LLMClient {
  return {
    chat: vi.fn().mockResolvedValue({
      text,
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      finishReason: 'stop',
    } satisfies LLMResult),
  };
}

describe('handleTranslation', () => {
  it('returns 200 + TranslationResult with disclaimer always non-empty', async () => {
    const client = fakeClient(JSON.stringify({ translation: '解释 A', avoidance: '建议 B' }));
    const res = await handleTranslation({ sessionId: 's1', risks: [okRisk] }, client);
    expect(res.status).toBe(200);
    const body = (await res.json()) as TranslationResult;
    expect(body.disclaimer).toBe(DISCLAIMER_TEXT);
    expect(body.disclaimer.length).toBeGreaterThan(0);
    expect(body.translatedRisks).toHaveLength(1);
    expect(body.overallLevel).toBe('red');
  });

  it('preserves sessionId from body', async () => {
    const client = fakeClient(JSON.stringify({ translation: 'a', avoidance: 'b' }));
    const res = await handleTranslation({ sessionId: 'abc-xyz', risks: [okRisk] }, client);
    const body = (await res.json()) as TranslationResult;
    expect(body.sessionId).toBe('abc-xyz');
  });

  it('returns 400 when sessionId is missing', async () => {
    const client = fakeClient('{}');
    const res = await handleTranslation({ risks: [okRisk] }, client);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.kind).toBe('validation');
  });

  it('returns 400 when risks is missing', async () => {
    const client = fakeClient('{}');
    const res = await handleTranslation({ sessionId: 'x' }, client);
    expect(res.status).toBe(400);
  });

  it('returns 400 when risks is not an array', async () => {
    const client = fakeClient('{}');
    const res = await handleTranslation({ sessionId: 'x', risks: 'oops' }, client);
    expect(res.status).toBe(400);
  });

  it('returns 400 when a risk is missing required fields', async () => {
    const client = fakeClient('{}');
    const broken = { ingredient: 'coq10' };
    const res = await handleTranslation({ sessionId: 'x', risks: [broken] }, client);
    expect(res.status).toBe(400);
  });

  it('returns 200 with empty translatedRisks when risks=[]', async () => {
    const client = fakeClient('{}');
    const res = await handleTranslation({ sessionId: 'x', risks: [] }, client);
    expect(res.status).toBe(200);
    const body = (await res.json()) as TranslationResult;
    expect(body.translatedRisks).toEqual([]);
    expect(body.overallLevel).toBe('gray');
    expect(body.disclaimer).toBe(DISCLAIMER_TEXT);
  });

  it('returns 400 when body is null', async () => {
    const client = fakeClient('{}');
    const res = await handleTranslation(null, client);
    expect(res.status).toBe(400);
  });
});
