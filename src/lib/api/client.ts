// file: src/lib/api/client.ts — 浏览器侧 fetch 包装：postJudgment / postTranslation / postIntent
//
// 契约（与 errorEnvelope.ts 对称）：
//   ok 路径返回反序列化后的 payload；非 2xx 抛 ApiClientError，body 形态固定 { error: { kind, message } }
//   网络异常（fetch reject）映射成 kind='network'；JSON 解析失败映射 kind='invalid_response'
//   客户端超时（AbortController）映射成 kind='timeout' — 服务端 hang 时浏览器不会永远转
// 用法：UI 层 try/catch 一次即可拿到 kind + message；不在这里做 toast，留给调用方决定降级。

import type { ApiErrorKind } from './errorEnvelope';
import type { JudgmentResult, Risk, TranslationResult } from '@/lib/types/risk';
import type { LookupRequest } from '@/lib/types/adapter';
import type { IntakeOutcome } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import type { ClarifyTurn } from '@/lib/types/intent';

export class ApiClientError extends Error {
  constructor(public readonly kind: ApiErrorKind, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type FetchLike = typeof fetch;

// 客户端 fetch 默认超时：35s。略高于 LLM SDK 的 30s timeout（已禁用 retry），
// 给服务端处理 + 网络往返一点缓冲；超过即认定 hang，UI 立即报错而非永远转圈。
const DEFAULT_TIMEOUT_MS = 35_000;

async function postJSON<T>(
  url: string,
  body: unknown,
  fetchImpl: FetchLike = fetch,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError('timeout', `request to ${url} exceeded ${timeoutMs}ms`);
    }
    throw new ApiClientError('network', err instanceof Error ? err.message : 'network failure');
  } finally {
    clearTimeout(timeoutId);
  }
  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new ApiClientError('invalid_response', `non-JSON response (status ${res.status})`);
  }
  if (!res.ok) {
    const env = parsed as { error?: { kind?: ApiErrorKind; message?: string } };
    const kind: ApiErrorKind = env?.error?.kind ?? 'internal';
    const message = env?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiClientError(kind, message);
  }
  return parsed as T;
}

export async function postJudgment(
  payload: { sessionId: string; request: LookupRequest },
  fetchImpl?: FetchLike,
): Promise<JudgmentResult> {
  return postJSON<JudgmentResult>('/api/judgment', payload, fetchImpl);
}

export async function postTranslation(
  payload: { sessionId: string; risks: Risk[] },
  fetchImpl?: FetchLike,
): Promise<TranslationResult> {
  return postJSON<TranslationResult>('/api/translation', payload, fetchImpl);
}

export async function postIntent(
  payload: {
    sessionId: string;
    rawQuery: string;
    imageOcrText?: string;
    history?: ClarifyTurn[];
  },
  fetchImpl?: FetchLike,
): Promise<IntakeOutcome> {
  return postJSON<IntakeOutcome>('/api/intent', payload, fetchImpl);
}
