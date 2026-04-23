import { describe, expect, it, vi } from 'vitest';
import { translateRisks, DISCLAIMER_TEXT } from '@/lib/capabilities/safetyTranslation/translateRisks';
import type { Risk } from '@/lib/types/risk';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';

const redRisk: Risk = {
  level: 'red',
  dimension: 'drug_interaction',
  cta: 'stop_and_consult',
  ingredient: 'coq10',
  medication: 'warfarin',
  reasonCode: 'vitamin_k_like_effect',
  reasonShort: '类维生素 K 效应',
  evidence: { sourceType: 'hardcoded', sourceRef: 'VitaMe-rule-coQ10_warfarin', confidence: 'high' },
};

const yellowRisk: Risk = {
  level: 'yellow',
  dimension: 'dose_caution',
  cta: 'consult_if_needed',
  ingredient: 'magnesium_oxide',
  reasonCode: 'mineral_competition_absorption',
  reasonShort: '矿物质吸收竞争',
  evidence: { sourceType: 'database', sourceRef: 'SUPP.AI:mag-oxi-001', confidence: 'medium' },
};

function clientReturning(text: string): LLMClient {
  return {
    chat: vi.fn().mockResolvedValue({
      text,
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      finishReason: 'stop',
    } satisfies LLMResult),
  };
}

function clientErroring(): LLMClient {
  return {
    chat: vi.fn().mockResolvedValue({
      error: { kind: 'network', message: 'ECONNREFUSED' },
    } satisfies LLMResult),
  };
}

describe('translateRisks', () => {
  it('returns TranslationResult with disclaimer always non-empty', async () => {
    const client = clientReturning(JSON.stringify({ translation: '解释 A', avoidance: '建议 B' }));
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    expect(out.disclaimer).toBe(DISCLAIMER_TEXT);
    expect(out.disclaimer.length).toBeGreaterThan(0);
  });

  it('uses LLM output when JSON is valid and clean', async () => {
    const client = clientReturning(JSON.stringify({ translation: '辅酶 Q10 与华法林同服可能影响指标。', avoidance: '建议先咨询医生。' }));
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    expect(out.translatedRisks).toHaveLength(1);
    expect(out.translatedRisks[0]!.translation).toContain('辅酶');
    expect(out.translatedRisks[0]!.fallbackUsed).toBe(false);
  });

  it('falls back to template when LLM returns LLMError', async () => {
    const client = clientErroring();
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    expect(out.translatedRisks[0]!.fallbackUsed).toBe(true);
    expect(out.translatedRisks[0]!.translation.length).toBeGreaterThan(0);
    expect(out.translatedRisks[0]!.avoidance.length).toBeGreaterThan(0);
  });

  it('falls back when LLM returns malformed JSON', async () => {
    const client = clientReturning('This is not JSON at all.');
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    expect(out.translatedRisks[0]!.fallbackUsed).toBe(true);
  });

  it('falls back when LLM output contains banned word (治疗)', async () => {
    const client = clientReturning(JSON.stringify({ translation: '该成分可以治疗骨质疏松。', avoidance: '建议咨询医生。' }));
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    expect(out.translatedRisks[0]!.fallbackUsed).toBe(true);
  });

  it('preserves original Risk fields on the TranslatedRisk', async () => {
    const client = clientReturning(JSON.stringify({ translation: 'a', avoidance: 'b' }));
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk] }, client);
    const t = out.translatedRisks[0]!;
    expect(t.level).toBe('red');
    expect(t.dimension).toBe('drug_interaction');
    expect(t.cta).toBe('stop_and_consult');
    expect(t.ingredient).toBe('coq10');
    expect(t.reasonCode).toBe('vitamin_k_like_effect');
  });

  it('overallLevel takes the strictest among risks (red > yellow > gray > green)', async () => {
    const client = clientReturning(JSON.stringify({ translation: 'a', avoidance: 'b' }));
    const out = await translateRisks({ sessionId: 's1', risks: [yellowRisk, redRisk] }, client);
    expect(out.overallLevel).toBe('red');
  });

  it('overallLevel is gray when given empty risks (defensive)', async () => {
    const client = clientReturning(JSON.stringify({ translation: 'a', avoidance: 'b' }));
    const out = await translateRisks({ sessionId: 's1', risks: [] }, client);
    expect(out.overallLevel).toBe('gray');
    expect(out.translatedRisks).toHaveLength(0);
  });

  it('per-risk fallback does not infect other risks', async () => {
    let n = 0;
    const client: LLMClient = {
      chat: vi.fn().mockImplementation(async () => {
        n += 1;
        if (n === 1) return { error: { kind: 'timeout', message: 't' } } as LLMResult;
        return { text: JSON.stringify({ translation: '正常', avoidance: '建议' }), provider: 'm', model: 'x', finishReason: 'stop' } as LLMResult;
      }),
    };
    const out = await translateRisks({ sessionId: 's1', risks: [redRisk, yellowRisk] }, client);
    expect(out.translatedRisks[0]!.fallbackUsed).toBe(true);
    expect(out.translatedRisks[1]!.fallbackUsed).toBe(false);
    expect(out.translatedRisks[1]!.translation).toBe('正常');
  });

  it('includes sessionId on the result', async () => {
    const client = clientReturning(JSON.stringify({ translation: 'a', avoidance: 'b' }));
    const out = await translateRisks({ sessionId: 'abc-123', risks: [redRisk] }, client);
    expect(out.sessionId).toBe('abc-123');
  });
});
