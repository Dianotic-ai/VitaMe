import { describe, expect, it } from 'vitest';
import { SUPPAI_BY_PAIR } from '@/lib/db/suppai-interactions';
import { suppaiAdapter } from '@/lib/adapters/suppaiAdapter';
import type { LookupRequest } from '@/lib/types/adapter';

const emptyReq: LookupRequest = {
  ingredients: [],
  medications: [],
  conditions: [],
};

const mediumPairKey = 'biotin|adenosine-triphosphate';
const highPairKey = 'calcium|thyroxine';
const secondHighPairKey = 'calcium|sevelamer';
const secondMediumPairKey = 'calcium|lanthanum-carbonate';

function requirePair(key: string) {
  const pair = SUPPAI_BY_PAIR.get(key);
  if (!pair) {
    throw new Error(`Missing SUPPAI fixture for ${key}`);
  }
  return pair;
}

const mediumPair = requirePair(mediumPairKey);
const highPair = requirePair(highPairKey);
const secondHighPair = requirePair(secondHighPairKey);
const secondMediumPair = requirePair(secondMediumPairKey);

describe('suppaiAdapter', () => {
  it('exposes the suppai adapter source name', () => {
    expect(suppaiAdapter.name).toBe('suppai');
  });

  it('returns an empty non-partial response for an empty request', async () => {
    const res = await suppaiAdapter.lookup(emptyReq);

    expect(res.risks).toEqual([]);
    expect(res.partialData).toBe(false);
    expect(res.source).toBe('suppai');
    expect(res).not.toHaveProperty('error');
  });

  it('maps a real SUPPAI ingredient x medication hit into one yellow risk', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [mediumPair.substanceA.id],
      medications: [mediumPair.substanceB.id],
      conditions: [],
    });

    expect(res.risks).toHaveLength(1);
    const risk = res.risks[0]!;

    expect(risk.level).toBe('yellow');
    expect(risk.ingredient).toBe(mediumPair.substanceA.id);
    expect(risk.medication).toBe(mediumPair.substanceB.id);
    expect(risk.reasonCode).toBe(mediumPair.reasonCode);
    expect(risk.reasonShort).toBe(mediumPair.reason);
    expect(risk.evidence.sourceType).toBe('database');
    expect(risk.evidence.sourceRef).toBe(mediumPair.sourceRef.id);
    expect(risk.evidence.confidence).toBe('medium');
  });

  it('only returns matched medication pairs when one ingredient is checked against many medications', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id],
      medications: [highPair.substanceB.id, secondHighPair.substanceB.id, 'no-such-medication'],
      conditions: [],
    });

    expect(res.risks).toHaveLength(2);
    expect(res.risks.map((risk) => risk.medication).sort()).toEqual(
      [highPair.substanceB.id, secondHighPair.substanceB.id].sort(),
    );
  });

  it('returns no risks when the ingredient exists but none of the requested medications match', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id],
      medications: ['no-such-medication', 'still-no-match'],
      conditions: [],
    });

    expect(res.risks).toEqual([]);
    expect(res.partialData).toBe(false);
  });

  it('sets dimension and cta from the expected helper defaults for SUPPAI drug pairs', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id],
      medications: [highPair.substanceB.id],
      conditions: [],
    });

    expect(res.risks).toHaveLength(1);
    const risk = res.risks[0]!;
    expect(risk.dimension).toBe('drug_interaction');
    expect(risk.cta).toBe('consult_if_needed');
  });

  it('emits database evidence with non-empty source refs and both confidence tiers', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id],
      medications: [
        highPair.substanceB.id,
        secondHighPair.substanceB.id,
        secondMediumPair.substanceB.id,
      ],
      conditions: [],
    });

    expect(res.risks).toHaveLength(3);
    for (const risk of res.risks) {
      expect(risk.evidence.sourceType).toBe('database');
      expect(risk.evidence.sourceRef.length).toBeGreaterThan(0);
      expect(['high', 'medium']).toContain(risk.evidence.confidence);
    }
    expect([...new Set(res.risks.map((risk) => risk.evidence.confidence))].sort()).toEqual([
      'high',
      'medium',
    ]);
  });

  it('always returns partialData=false and omits the response error field', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id],
      medications: [highPair.substanceB.id],
      conditions: [],
    });

    expect(res.partialData).toBe(false);
    expect(res).not.toHaveProperty('error');
  });

  it('does not duplicate risks when repeated ingredients or medications are supplied', async () => {
    const res = await suppaiAdapter.lookup({
      ingredients: [highPair.substanceA.id, highPair.substanceA.id],
      medications: [highPair.substanceB.id, highPair.substanceB.id, secondHighPair.substanceB.id],
      conditions: [],
    });

    expect(res.risks).toHaveLength(2);
    expect(res.risks.map((risk) => risk.medication).sort()).toEqual(
      [highPair.substanceB.id, secondHighPair.substanceB.id].sort(),
    );
  });
});
