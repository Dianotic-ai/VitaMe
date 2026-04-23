import { describe, expect, it } from 'vitest';
import { handleJudgment } from '@/app/api/judgment/route';
import type { JudgmentResult } from '@/lib/types/risk';

describe('handleJudgment', () => {
  it('returns 200 + JudgmentResult shape on valid body', async () => {
    const res = await handleJudgment({
      sessionId: 'sess-1',
      request: { ingredients: ['coenzyme-q10'], medications: ['warfarin'], conditions: [] },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as JudgmentResult;
    expect(body.sessionId).toBe('sess-1');
    expect(Array.isArray(body.risks)).toBe(true);
    expect(['red', 'yellow', 'gray', 'green']).toContain(body.overallLevel);
    expect(typeof body.partialData).toBe('boolean');
  });

  it('returns 400 when sessionId is missing', async () => {
    const res = await handleJudgment({ request: { ingredients: ['fish-oil'], medications: [], conditions: [] } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.kind).toBe('validation');
  });

  it('returns 400 when request is missing', async () => {
    const res = await handleJudgment({ sessionId: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when request.ingredients is not an array', async () => {
    const res = await handleJudgment({ sessionId: 'x', request: { ingredients: 'fish-oil', medications: [], conditions: [] } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.kind).toBe('validation');
  });

  it('returns 400 when body is not an object', async () => {
    const res = await handleJudgment(null);
    expect(res.status).toBe(400);
  });

  it('falls back to gray no_data risk when ingredient is unknown', async () => {
    const res = await handleJudgment({
      sessionId: 's2',
      request: { ingredients: ['totally-fake-ingredient-xyz'], medications: [], conditions: [] },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as JudgmentResult;
    expect(body.risks.length).toBeGreaterThanOrEqual(1);
    expect(body.risks.find((r) => r.ingredient === 'totally-fake-ingredient-xyz')?.level).toBe('gray');
  });
});
