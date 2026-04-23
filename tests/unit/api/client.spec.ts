import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, postJudgment, postTranslation } from '@/lib/api/client';
import type { JudgmentResult, Risk, TranslationResult } from '@/lib/types/risk';

function fakeFetch(status: number, body: unknown, opts?: { rejectWith?: Error; nonJson?: boolean }): typeof fetch {
  return vi.fn(async () => {
    if (opts?.rejectWith) throw opts.rejectWith;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (opts?.nonJson) throw new Error('not JSON');
        return body;
      },
    } as Response;
  }) as unknown as typeof fetch;
}

const okJudgment: JudgmentResult = {
  sessionId: 's1',
  overallLevel: 'red',
  risks: [],
  partialData: false,
};

const okTranslation: TranslationResult = {
  sessionId: 's1',
  overallLevel: 'red',
  translatedRisks: [],
  disclaimer: 'd',
};

const sampleRisk: Risk = {
  level: 'red',
  dimension: 'drug_interaction',
  cta: 'stop_and_consult',
  ingredient: 'coq10',
  medication: 'warfarin',
  reasonCode: 'vk_like',
  reasonShort: '类维生素 K 效应',
  evidence: { sourceType: 'hardcoded', sourceRef: 'rule', confidence: 'high' },
};

describe('postJudgment', () => {
  it('returns parsed JudgmentResult on 200', async () => {
    const fetchImpl = fakeFetch(200, okJudgment);
    const out = await postJudgment(
      { sessionId: 's1', request: { ingredients: ['coq10'], medications: ['warfarin'], conditions: [] } },
      fetchImpl,
    );
    expect(out.sessionId).toBe('s1');
    expect(fetchImpl).toHaveBeenCalledWith('/api/judgment', expect.objectContaining({ method: 'POST' }));
  });

  it('throws ApiClientError(validation) on 400 with envelope', async () => {
    const fetchImpl = fakeFetch(400, { error: { kind: 'validation', message: 'sessionId required' } });
    await expect(
      postJudgment({ sessionId: '', request: { ingredients: [], medications: [], conditions: [] } }, fetchImpl),
    ).rejects.toMatchObject({ kind: 'validation', message: 'sessionId required' });
  });

  it('throws ApiClientError(internal) on 500 without envelope kind', async () => {
    const fetchImpl = fakeFetch(500, { error: { message: 'boom' } });
    await expect(
      postJudgment({ sessionId: 's1', request: { ingredients: [], medications: [], conditions: [] } }, fetchImpl),
    ).rejects.toMatchObject({ kind: 'internal', message: 'boom' });
  });

  it('throws ApiClientError(network) when fetch rejects', async () => {
    const fetchImpl = fakeFetch(0, null, { rejectWith: new Error('ECONNREFUSED') });
    const err = await postJudgment(
      { sessionId: 's1', request: { ingredients: [], medications: [], conditions: [] } },
      fetchImpl,
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect((err as ApiClientError).kind).toBe('network');
  });

  it('throws ApiClientError(invalid_response) on non-JSON body', async () => {
    const fetchImpl = fakeFetch(200, null, { nonJson: true });
    await expect(
      postJudgment({ sessionId: 's1', request: { ingredients: [], medications: [], conditions: [] } }, fetchImpl),
    ).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

describe('postTranslation', () => {
  it('returns parsed TranslationResult on 200', async () => {
    const fetchImpl = fakeFetch(200, okTranslation);
    const out = await postTranslation({ sessionId: 's1', risks: [sampleRisk] }, fetchImpl);
    expect(out.disclaimer).toBe('d');
    expect(fetchImpl).toHaveBeenCalledWith('/api/translation', expect.objectContaining({ method: 'POST' }));
  });

  it('forwards rate_limit kind from server', async () => {
    const fetchImpl = fakeFetch(429, { error: { kind: 'rate_limit', message: 'slow down' } });
    await expect(postTranslation({ sessionId: 's1', risks: [] }, fetchImpl)).rejects.toMatchObject({
      kind: 'rate_limit',
    });
  });
});
