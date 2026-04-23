// file: src/app/api/translation/route.ts — POST /api/translation：包 SafetyTranslation capability
//
// 入参：{ sessionId, risks: Risk[] }（通常是 /api/judgment 的返回 risks 直接转发）
// 出参：TranslationResult（capability 内部已对单条 fallback；disclaimer 强非空 §11.1）
// 错误：400 validation / 500 LLM 客户端构造失败（env 缺失等）

import { z } from 'zod';
import type { LLMClient } from '@/lib/adapters/llm/types';
import { createLLMClient } from '@/lib/adapters/llm/client';
import { translateRisks } from '@/lib/capabilities/safetyTranslation/translateRisks';
import { jsonError, jsonOk } from '@/lib/api/errorEnvelope';

export const runtime = 'nodejs';

const evidenceSchema = z.object({
  sourceType: z.enum(['hardcoded', 'database', 'literature', 'limited', 'none']),
  sourceRef: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']),
});

const riskSchema = z.object({
  level: z.enum(['red', 'yellow', 'gray', 'green']),
  dimension: z.enum([
    'drug_interaction',
    'condition_contra',
    'population_caution',
    'dose_caution',
    'form_difference',
    'coverage_gap',
  ]),
  cta: z.enum([
    'stop_and_consult',
    'consult_if_needed',
    'recheck_with_more_context',
    'proceed_with_caution',
    'basic_ok',
  ]),
  ingredient: z.string().min(1),
  condition: z.string().optional(),
  medication: z.string().optional(),
  reasonCode: z.string().min(1),
  reasonShort: z.string().min(1),
  evidence: evidenceSchema,
  secondaryEvidence: z.array(evidenceSchema).optional(),
  conflictingSources: z.array(z.string()).optional(),
});

const bodySchema = z.object({
  sessionId: z.string().min(1),
  risks: z.array(riskSchema),
});

export async function handleTranslation(body: unknown, client: LLMClient): Promise<Response> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('validation', parsed.error.issues[0]?.message ?? 'invalid request body');
  }
  try {
    const result = await translateRisks(parsed.data, client);
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
  return handleTranslation(body, client);
}
