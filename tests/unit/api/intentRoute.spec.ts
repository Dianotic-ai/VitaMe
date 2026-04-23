// file: tests/unit/api/intentRoute.spec.ts — POST /api/intent route TDD

import { describe, expect, it, vi } from 'vitest';
import { handleIntent } from '@/app/api/intent/route';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';
import type { IntakeOutcome } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import type { IntentResult } from '@/lib/types/intent';

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

function fakeClient(intentResult: IntentResult): LLMClient {
  const result: LLMResult = {
    text: JSON.stringify(intentResult),
    provider: 'fake',
    model: 'fake-model',
    finishReason: 'stop',
  };
  return { chat: vi.fn().mockResolvedValue(result) };
}

describe('handleIntent — POST /api/intent', () => {
  it('200 + pass_through when intent has ingredients + medication', async () => {
    const client = fakeClient({
      ...baseIntent,
      ingredientMentions: ['辅酶 Q10'],
      medicationMentions: ['华法林'],
    });
    const res = await handleIntent(
      { sessionId: 's1', rawQuery: '辅酶 Q10 + 华法林能一起吃吗?' },
      client,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as IntakeOutcome;
    expect(body.kind).toBe('pass_through');
    expect(body.sessionId).toBe('s1');
  });

  it('200 + clarify_needed when intent=unclear', async () => {
    const client = fakeClient({
      ...baseIntent,
      intent: 'unclear',
      clarifyingQuestion: { question: '没听懂,能换个说法吗?', choices: ['A', 'B'] },
    });
    const res = await handleIntent({ sessionId: 's2', rawQuery: 'asdfgh' }, client);
    expect(res.status).toBe(200);
    const body = (await res.json()) as IntakeOutcome;
    expect(body.kind).toBe('clarify_needed');
  });

  it('400 when sessionId missing', async () => {
    const client = fakeClient(baseIntent);
    const res = await handleIntent({ rawQuery: 'x' }, client);
    expect(res.status).toBe(400);
  });

  it('400 when rawQuery missing', async () => {
    const client = fakeClient(baseIntent);
    const res = await handleIntent({ sessionId: 's' }, client);
    expect(res.status).toBe(400);
  });

  it('400 when rawQuery is empty string', async () => {
    const client = fakeClient(baseIntent);
    const res = await handleIntent({ sessionId: 's', rawQuery: '' }, client);
    expect(res.status).toBe(400);
  });

  it('400 when rawQuery > 500 chars', async () => {
    const client = fakeClient(baseIntent);
    const long = 'x'.repeat(501);
    const res = await handleIntent({ sessionId: 's', rawQuery: long }, client);
    expect(res.status).toBe(400);
  });

  it('history accepted when ≤2 turns', async () => {
    const client = fakeClient(baseIntent);
    const res = await handleIntent(
      {
        sessionId: 's',
        rawQuery: 'x',
        history: [
          { topic: 'product_disambiguation', userChoice: 'A' },
          { topic: 'medication_context', userChoice: 'B' },
        ],
      },
      client,
    );
    expect(res.status).toBe(200);
  });

  it('400 when history > 2 turns（design spec §c P0 上限 2 轮）', async () => {
    const client = fakeClient(baseIntent);
    const res = await handleIntent(
      {
        sessionId: 's',
        rawQuery: 'x',
        history: [
          { topic: 'a', userChoice: 'a' },
          { topic: 'b', userChoice: 'b' },
          { topic: 'c', userChoice: 'c' },
        ],
      },
      client,
    );
    expect(res.status).toBe(400);
  });

  it('200 + symptom_candidates when intent=symptom_goal_query + recognized symptom', async () => {
    const client = fakeClient({
      ...baseIntent,
      intent: 'symptom_goal_query',
      symptomMentions: ['失眠'],
    });
    const res = await handleIntent({ sessionId: 's', rawQuery: '我老失眠' }, client);
    expect(res.status).toBe(200);
    const body = (await res.json()) as IntakeOutcome;
    expect(body.kind).toBe('symptom_candidates');
  });
});
