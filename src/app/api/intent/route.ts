// file: src/app/api/intent/route.ts — POST /api/intent：包 L0 intakeOrchestrator
//
// 入参：{ sessionId, rawQuery, imageOcrText?, history? }
// 出参：IntakeOutcome（discriminated union by `kind`）
// 错误：400 validation / 500 LLM 客户端构造失败
// runtime：nodejs（与 /api/judgment、/api/translation 一致，便于复用 LLMClient + audit log）

import { z } from 'zod';
import type { LLMClient } from '@/lib/adapters/llm/types';
import { createLLMClient } from '@/lib/adapters/llm/client';
import { intakeOrchestrator } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import { jsonError, jsonOk } from '@/lib/api/errorEnvelope';
import { getAuditLogger } from '@/lib/capabilities/compliance/auditLogger';

export const runtime = 'nodejs';

const clarifyTurnSchema = z.object({
  topic: z.string().min(1),
  userChoice: z.string().min(1),
});

const bodySchema = z.object({
  sessionId: z.string().min(1),
  rawQuery: z.string().min(1).max(500),
  imageOcrText: z.string().max(2000).optional(),
  history: z.array(clarifyTurnSchema).max(2).optional(),
});

export async function handleIntent(body: unknown, client: LLMClient): Promise<Response> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('validation', parsed.error.issues[0]?.message ?? 'invalid request body');
  }
  try {
    const result = await intakeOrchestrator(
      parsed.data.sessionId,
      {
        rawQuery: parsed.data.rawQuery,
        imageOcrText: parsed.data.imageOcrText,
        history: parsed.data.history,
      },
      { llmClient: client },
    );
    return jsonOk(result);
  } catch (err) {
    return jsonError('internal', err instanceof Error ? err.message : String(err));
  }
}

function defaultClient(): LLMClient {
  return createLLMClient({
    provider: process.env.LLM_PROVIDER ?? 'minimax',
    model: process.env.LLM_MODEL ?? '',
    baseURL: process.env.LLM_BASE_URL ?? '',
    apiKey: process.env.LLM_API_KEY ?? '',
  });
}

export async function POST(req: Request): Promise<Response> {
  const audit = getAuditLogger();
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonError('validation', 'request body is not valid JSON');
  }
  let client: LLMClient;
  try {
    client = defaultClient();
  } catch (err) {
    return jsonError('internal', err instanceof Error ? err.message : 'LLM client init failed');
  }
  // 审计：intent_parsed 事件（§11.10）。失败时仍要写 error 事件。
  const sessionId = typeof (body as Record<string, unknown>)?.sessionId === 'string' ? (body as { sessionId: string }).sessionId : 'unknown';
  const rawQuery = typeof (body as Record<string, unknown>)?.rawQuery === 'string' ? (body as { rawQuery: string }).rawQuery : '';
  const res = await handleIntent(body, client);
  audit
    .log({
      event: res.status === 200 ? 'intent_parsed' : 'error',
      sessionId,
      inputHash: audit.hash(rawQuery),
      metadata: { route: '/api/intent', status: res.status },
    })
    .catch((e: unknown) => console.error('[auditLogger] intent write failed', e));
  return res;
}
