import { describe, expect, it, vi } from 'vitest';
import { createLLMClient } from '@/lib/adapters/llm/client';
import type { ChatBackend, LLMConfig } from '@/lib/adapters/llm/types';

const baseConfig: LLMConfig = {
  provider: 'minimax',
  model: 'MiniMax-M2.7',
  baseURL: 'https://api.minimaxi.com/anthropic',
  apiKey: 'sk-test',
};

function backendOk(text: string, finishReason: string | null = 'end_turn'): ChatBackend {
  return vi.fn().mockResolvedValue({ text, finishReason });
}

function backendThrow(err: unknown): ChatBackend {
  return vi.fn().mockRejectedValue(err);
}

describe('createLLMClient', () => {
  it('returns LLMResponse with provider/model/text/finishReason on backend success', async () => {
    const client = createLLMClient(baseConfig, backendOk('hello world'));
    const res = await client.chat({ messages: [{ role: 'user', content: 'hi' }] });

    expect('error' in res).toBe(false);
    if ('error' in res) return;
    expect(res.text).toBe('hello world');
    expect(res.provider).toBe('minimax');
    expect(res.model).toBe('MiniMax-M2.7');
    expect(res.finishReason).toBe('stop');
  });

  it('throws on construction when apiKey/baseURL/model is missing', () => {
    expect(() => createLLMClient({ ...baseConfig, apiKey: '' }, backendOk('x'))).toThrow(/apiKey/);
    expect(() => createLLMClient({ ...baseConfig, baseURL: '' }, backendOk('x'))).toThrow(/baseURL/);
    expect(() => createLLMClient({ ...baseConfig, model: '' }, backendOk('x'))).toThrow(/model/);
  });

  it('passes provider tag through to LLMResponse without entering if/else (Claude Code mode)', async () => {
    const c1 = createLLMClient({ ...baseConfig, provider: 'kimi' }, backendOk('a'));
    const c2 = createLLMClient({ ...baseConfig, provider: 'unknown-vendor-xyz' }, backendOk('b'));
    const r1 = await c1.chat({ messages: [{ role: 'user', content: 'x' }] });
    const r2 = await c2.chat({ messages: [{ role: 'user', content: 'x' }] });

    if ('error' in r1 || 'error' in r2) throw new Error('expected success');
    expect(r1.provider).toBe('kimi');
    expect(r2.provider).toBe('unknown-vendor-xyz');
  });

  it('forwards system + responseFormat to the backend (used by L3 Zod-validated translation)', async () => {
    const backend = backendOk('{"k":"v"}');
    const client = createLLMClient(baseConfig, backend);
    await client.chat({
      messages: [{ role: 'user', content: 'x' }],
      system: 'You are a careful translator.',
      responseFormat: 'json',
    });

    expect(backend).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'You are a careful translator.',
        responseFormat: 'json',
      }),
    );
  });

  it('classifies HTTP 401/403 backend errors as auth', async () => {
    const client = createLLMClient(baseConfig, backendThrow(Object.assign(new Error('Unauthorized'), { status: 401 })));
    const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });

    expect('error' in res).toBe(true);
    if (!('error' in res)) return;
    expect(res.error.kind).toBe('auth');
  });

  it('classifies HTTP 429 backend errors as rate_limit', async () => {
    const client = createLLMClient(baseConfig, backendThrow(Object.assign(new Error('Too Many Requests'), { status: 429 })));
    const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });

    expect('error' in res).toBe(true);
    if (!('error' in res)) return;
    expect(res.error.kind).toBe('rate_limit');
  });

  it('classifies ECONNREFUSED / ENOTFOUND as network errors', async () => {
    const client = createLLMClient(baseConfig, backendThrow(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })));
    const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });

    expect('error' in res).toBe(true);
    if (!('error' in res)) return;
    expect(res.error.kind).toBe('network');
  });

  it('classifies ETIMEDOUT / timeout messages as timeout', async () => {
    const client = createLLMClient(baseConfig, backendThrow(Object.assign(new Error('Request timeout'), { code: 'ETIMEDOUT' })));
    const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });

    expect('error' in res).toBe(true);
    if (!('error' in res)) return;
    expect(res.error.kind).toBe('timeout');
  });

  it('returns invalid_response when backend returns empty text', async () => {
    const client = createLLMClient(
      baseConfig,
      vi.fn().mockResolvedValue({ text: '', finishReason: 'end_turn' }),
    );
    const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });

    expect('error' in res).toBe(true);
    if (!('error' in res)) return;
    expect(res.error.kind).toBe('invalid_response');
  });

  it('maps Anthropic stop_reason to LLMResponse finishReason', async () => {
    const cases: { raw: string; expected: 'stop' | 'length' | 'error' }[] = [
      { raw: 'end_turn', expected: 'stop' },
      { raw: 'stop_sequence', expected: 'stop' },
      { raw: 'max_tokens', expected: 'length' },
      { raw: 'tool_use', expected: 'error' },
    ];
    for (const { raw, expected } of cases) {
      const client = createLLMClient(baseConfig, backendOk('truncated...', raw));
      const res = await client.chat({ messages: [{ role: 'user', content: 'x' }] });
      if ('error' in res) throw new Error(`expected success for stop_reason=${raw}`);
      expect(res.finishReason).toBe(expected);
    }
  });
});
