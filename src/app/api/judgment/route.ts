// file: src/app/api/judgment/route.ts — POST /api/judgment：包 SafetyJudgment capability
//
// 入参：{ sessionId, request: LookupRequest }
// 出参：JudgmentResult（capability 已保证 schema）
// 错误：400 validation / 500 内部异常
// runtime：nodejs（CLAUDE.md §4 — audit log 需要 fs；adapter/db 走 'server-only'）

import { z } from 'zod';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';
import { jsonError, jsonOk } from '@/lib/api/errorEnvelope';

export const runtime = 'nodejs';

const stringArr = z.array(z.string());

const bodySchema = z.object({
  sessionId: z.string().min(1),
  request: z.object({
    ingredients: stringArr,
    medications: stringArr,
    conditions: stringArr,
    allergies: stringArr.optional(),
    specialGroups: stringArr.optional(),
    genes: stringArr.optional(),
    timings: stringArr.optional(),
    strategies: stringArr.optional(),
  }),
});

export async function handleJudgment(body: unknown): Promise<Response> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('validation', parsed.error.issues[0]?.message ?? 'invalid request body');
  }
  try {
    const result = await judge(parsed.data.sessionId, parsed.data.request);
    return jsonOk(result);
  } catch (err) {
    return jsonError('internal', err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonError('validation', 'request body is not valid JSON');
  }
  return handleJudgment(body);
}
