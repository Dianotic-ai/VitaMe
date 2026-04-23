// file: src/lib/adapters/llm/client.ts — Claude Code 模式：单 client + Anthropic SDK + provider 仅作 audit tag
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatBackend,
  LLMClient,
  LLMConfig,
  LLMError,
  LLMRequest,
  LLMResult,
} from './types';

const DEFAULT_MAX_TOKENS = 4096;

export function createLLMClient(config: LLMConfig, backend?: ChatBackend): LLMClient {
  if (!config.apiKey) throw new Error('createLLMClient: apiKey is required');
  if (!config.baseURL) throw new Error('createLLMClient: baseURL is required');
  if (!config.model) throw new Error('createLLMClient: model is required');

  const call = backend ?? defaultBackend(config);

  return {
    async chat(req: LLMRequest): Promise<LLMResult> {
      try {
        const completion = await call({
          model: config.model,
          system: req.system,
          messages: req.messages,
          responseFormat: req.responseFormat,
          temperature: req.temperature,
          maxTokens: req.maxTokens,
        });
        if (!completion.text) {
          return { error: { kind: 'invalid_response', message: 'empty text in completion' } };
        }
        return {
          text: completion.text,
          provider: config.provider,
          model: config.model,
          finishReason: mapFinishReason(completion.finishReason),
        };
      } catch (err) {
        return { error: classifyError(err) };
      }
    },
  };
}

function defaultBackend(config: LLMConfig): ChatBackend {
  // Anthropic-compat 第三方网关（minimax / Kimi / 智谱）走 Bearer Authorization → 用 authToken 而非 apiKey
  // maxRetries: 0 — Anthropic SDK 默认 2 次重试，会让单次调用在 timeout/5xx 时叠加到 3×timeoutMs（90s）。
  // VitaMe 60s SLA 下不能容忍这个放大；让上层 capability 层自己决定要不要 fallback / template。
  const anthropic = new Anthropic({
    baseURL: config.baseURL,
    authToken: config.apiKey,
    timeout: config.timeoutMs ?? 30_000,
    maxRetries: 0,
  });
  return async (req) => {
    const message = await anthropic.messages.create({
      model: req.model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: req.messages,
      ...(req.system !== undefined ? { system: req.system } : {}),
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    });
    // Anthropic content 是 ContentBlock 数组；P0 只用 text 块（tool_use 暂不接）
    const text = message.content
      .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
      .map((block) => block.text)
      .join('');
    return {
      text,
      finishReason: message.stop_reason,
    };
  };
}

function mapFinishReason(raw: string | null | undefined): 'stop' | 'length' | 'error' {
  // Anthropic: end_turn | max_tokens | stop_sequence | tool_use
  if (raw === 'end_turn' || raw === 'stop_sequence') return 'stop';
  if (raw === 'max_tokens') return 'length';
  return 'error';
}

function classifyError(err: unknown): LLMError {
  if (err instanceof Error) {
    const e = err as Error & { status?: number; code?: string };
    if (e.status === 401 || e.status === 403) return { kind: 'auth', message: e.message };
    if (e.status === 429) return { kind: 'rate_limit', message: e.message };
    if (e.code === 'ETIMEDOUT' || e.message.toLowerCase().includes('timeout')) {
      return { kind: 'timeout', message: e.message };
    }
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      return { kind: 'network', message: e.message };
    }
    return { kind: 'invalid_response', message: e.message };
  }
  return { kind: 'invalid_response', message: String(err) };
}
