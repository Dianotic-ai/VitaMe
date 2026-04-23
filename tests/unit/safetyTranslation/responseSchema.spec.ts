import { describe, expect, it } from 'vitest';
import { parseLLMResponse, MAX_TRANSLATION_LEN, MAX_AVOIDANCE_LEN } from '@/lib/capabilities/safetyTranslation/responseSchema';

describe('parseLLMResponse', () => {
  it('parses a clean JSON string with translation + avoidance', () => {
    const raw = JSON.stringify({ translation: '辅酶 Q10 与华法林同服可能影响指标稳定。', avoidance: '建议先咨询医生再决定。' });
    const r = parseLLMResponse(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.translation).toContain('辅酶');
    expect(r.value.avoidance).toContain('医生');
  });

  it('strips ```json fences and parses inner JSON', () => {
    const raw = '```json\n{"translation":"a","avoidance":"b"}\n```';
    const r = parseLLMResponse(raw);
    expect(r.ok).toBe(true);
  });

  it('rejects when translation is missing', () => {
    const r = parseLLMResponse(JSON.stringify({ avoidance: 'x' }));
    expect(r.ok).toBe(false);
  });

  it('rejects when avoidance is missing', () => {
    const r = parseLLMResponse(JSON.stringify({ translation: 'x' }));
    expect(r.ok).toBe(false);
  });

  it('rejects when translation is empty string', () => {
    const r = parseLLMResponse(JSON.stringify({ translation: '', avoidance: 'x' }));
    expect(r.ok).toBe(false);
  });

  it('rejects when text is not parseable JSON', () => {
    const r = parseLLMResponse('Sorry, I cannot help with that.');
    expect(r.ok).toBe(false);
  });

  it('rejects when fields exceed length limits', () => {
    const tooLong = 'x'.repeat(MAX_TRANSLATION_LEN + 1);
    const r = parseLLMResponse(JSON.stringify({ translation: tooLong, avoidance: 'ok' }));
    expect(r.ok).toBe(false);
  });

  it('exposes positive length limits', () => {
    expect(MAX_TRANSLATION_LEN).toBeGreaterThan(0);
    expect(MAX_AVOIDANCE_LEN).toBeGreaterThan(0);
  });
});
