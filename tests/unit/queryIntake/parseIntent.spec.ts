// file: tests/unit/queryIntake/parseIntent.spec.ts — L0 parseIntent 强 TDD（CLAUDE.md §13.1）
//
// 对齐 docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md §a / §Error Handling / §Testing 场景 1/4/6
// 重点验证：
//   - 场景 1（happy path 自然语言 → mention）
//   - 场景 4（LLM 越权字段 level/safe → Zod .strict() reject → fallback；红线 §11.13）
//   - 场景 6（完全噪音 → unclear + clarifyingQuestion）
//   - LLM error / 非 JSON / 风险字段 → 一律走 parseIntentFallback，不透 raw text

import { describe, expect, it, vi } from 'vitest';
import { parseIntent } from '@/lib/capabilities/queryIntake/parseIntent';
import { parseIntentFallback } from '@/lib/capabilities/queryIntake/fallbacks';
import type { LLMClient, LLMResult } from '@/lib/adapters/llm/types';

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

function clientErroring(kind: 'timeout' | 'network' | 'auth' = 'timeout'): LLMClient {
  return {
    chat: vi.fn().mockResolvedValue({
      error: { kind, message: 'mocked' },
    } satisfies LLMResult),
  };
}

describe('parseIntent — L0 LLM 调用 + Zod .strict() 校验 + fallback', () => {
  it('场景 1 / happy path：自然语言 → product_safety_check + mention 完整', async () => {
    const llmJson = JSON.stringify({
      intent: 'product_safety_check',
      productMentions: ['维生素 AD 软胶囊'],
      ingredientMentions: ['维生素 A', '维生素 D'],
      medicationMentions: [],
      conditionMentions: ['感冒'],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: null,
    });
    const client = clientReturning(llmJson);

    const res = await parseIntent(
      { rawQuery: '感冒期间可以吃维生素 AD 软胶囊吗?' },
      { llmClient: client },
    );

    expect(res.intent).toBe('product_safety_check');
    expect(res.productMentions).toEqual(['维生素 AD 软胶囊']);
    expect(res.ingredientMentions).toEqual(['维生素 A', '维生素 D']);
    expect(res.conditionMentions).toEqual(['感冒']);
    expect(res.medicationMentions).toEqual([]);
    expect(res.specialGroupMentions).toEqual([]);
    expect(res.symptomMentions).toEqual([]);
    expect(res.missingSlots).toEqual([]);
    expect(res.clarifyingQuestion).toBeNull();
  });

  it('场景 4 / LLM 越权：返回 level=green 字段 → Zod .strict() reject → fallback（红线 §11.13）', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const llmJson = JSON.stringify({
      intent: 'product_safety_check',
      productMentions: [],
      ingredientMentions: ['鱼油'],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: null,
      level: 'green', // 红线：LLM 不许判风险
      safe: true,
    });
    const client = clientReturning(llmJson);

    const res = await parseIntent({ rawQuery: '鱼油能吃吗?' }, { llmClient: client });

    expect(res.intent).toBe('unclear');
    expect(res.ingredientMentions).toEqual([]);
    expect(res.clarifyingQuestion).toEqual(parseIntentFallback());
    expect(warnSpy).toHaveBeenCalled();
    const calls = warnSpy.mock.calls.flat().join(' ');
    // 越权专用 audit 码（CLAUDE.md §11.13）
    expect(calls).toContain('intent_llm_overreach');
    warnSpy.mockRestore();
  });

  it('场景 6 / 完全噪音：LLM 返 valid intent=unclear → clarifyingQuestion 非空透传', async () => {
    const fb = parseIntentFallback();
    const llmJson = JSON.stringify({
      intent: 'unclear',
      productMentions: [],
      ingredientMentions: [],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: fb,
    });
    const client = clientReturning(llmJson);

    const res = await parseIntent({ rawQuery: 'asdfasdfasdf' }, { llmClient: client });

    expect(res.intent).toBe('unclear');
    expect(res.clarifyingQuestion).not.toBeNull();
    expect(res.clarifyingQuestion!.question.length).toBeGreaterThanOrEqual(4);
    expect(res.clarifyingQuestion!.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('LLM 返回非 JSON 文本（"我不知道呀"）→ JSON parse 失败 → fallback', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = clientReturning('我不知道呀');

    const res = await parseIntent({ rawQuery: '随便问问' }, { llmClient: client });

    expect(res.intent).toBe('unclear');
    expect(res.clarifyingQuestion).toEqual(parseIntentFallback());
    const calls = warnSpy.mock.calls.flat().join(' ');
    expect(calls).toContain('intent_zod_fail');
    warnSpy.mockRestore();
  });

  it('LLM 返回 safe=true 风险字段 → reject + fallback（红线 §11.13）', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const llmJson = JSON.stringify({
      intent: 'ingredient_translation',
      productMentions: [],
      ingredientMentions: ['EPA'],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: null,
      safe: true,
    });
    const client = clientReturning(llmJson);

    const res = await parseIntent({ rawQuery: 'EPA 是什么?' }, { llmClient: client });

    expect(res.intent).toBe('unclear');
    const calls = warnSpy.mock.calls.flat().join(' ');
    expect(calls).toContain('intent_llm_overreach');
    warnSpy.mockRestore();
  });

  it('LLM 返回 LLMError（timeout）→ fallback', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = clientErroring('timeout');

    const res = await parseIntent({ rawQuery: '随便问问' }, { llmClient: client });

    expect(res.intent).toBe('unclear');
    expect(res.clarifyingQuestion).toEqual(parseIntentFallback());
    const calls = warnSpy.mock.calls.flat().join(' ');
    expect(calls).toContain('intent_llm_timeout');
    warnSpy.mockRestore();
  });

  it('prompt 包含 rawQuery 和 history 插值', async () => {
    const llmJson = JSON.stringify({
      intent: 'unclear',
      productMentions: [],
      ingredientMentions: [],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: parseIntentFallback(),
    });
    const chatSpy = vi.fn().mockResolvedValue({
      text: llmJson,
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      finishReason: 'stop',
    } satisfies LLMResult);
    const client: LLMClient = { chat: chatSpy };

    await parseIntent(
      {
        rawQuery: '辅酶 Q10 现在能吃吗?',
        history: [{ topic: 'medication_context', userChoice: '都没在吃' }],
      },
      { llmClient: client },
    );

    expect(chatSpy).toHaveBeenCalledTimes(1);
    const call = chatSpy.mock.calls[0]![0] as { messages: { content: string }[]; system?: string; responseFormat?: 'json' | 'text' };
    const userContent = call.messages[0]!.content;
    expect(userContent).toContain('辅酶 Q10 现在能吃吗?');
    expect(userContent).toContain('medication_context');
    expect(userContent).toContain('都没在吃');
    // 必须显式要 JSON
    expect(call.responseFormat).toBe('json');
    // system prompt 需有"只识别不判断"约束
    expect(call.system ?? '').toContain('只做识别');
  });

  it('fallback path 不透出 raw LLM text（防 §11.6 红线被绕过）', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const leakingText = '__SECRET_RAW_LLM_PAYLOAD__请勿出现在 IntentResult 任何字段里';
    const client = clientReturning(leakingText);

    const res = await parseIntent({ rawQuery: '???' }, { llmClient: client });

    const serialized = JSON.stringify(res);
    expect(serialized).not.toContain('__SECRET_RAW_LLM_PAYLOAD__');
    expect(serialized).not.toContain('请勿出现在');
    expect(res.intent).toBe('unclear');
  });

  it('LLM 返回带 ```json 围栏 → 仍能解析（容错）', async () => {
    const llmJson = JSON.stringify({
      intent: 'product_safety_check',
      productMentions: [],
      ingredientMentions: ['鱼油'],
      medicationMentions: [],
      conditionMentions: [],
      specialGroupMentions: [],
      symptomMentions: [],
      missingSlots: [],
      clarifyingQuestion: null,
    });
    const client = clientReturning('```json\n' + llmJson + '\n```');

    const res = await parseIntent({ rawQuery: '鱼油能吃吗?' }, { llmClient: client });

    expect(res.intent).toBe('product_safety_check');
    expect(res.ingredientMentions).toEqual(['鱼油']);
  });
});
