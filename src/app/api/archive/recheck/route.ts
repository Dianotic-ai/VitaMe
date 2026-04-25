// file: src/app/api/archive/recheck/route.ts — POST /api/archive/recheck
//
// 逻辑：基于已保存的 archive context（客户端从 Zustand 传来）+ 新 ingredient/medication/condition，
//       调 L2 judge() 做重新判断。不重新问用户背景（§P1 Job：复查减少重复收集）。
// 入参：{ sessionId, archivedContext, newIngredient? , newMedication?, newCondition? }
// 出参：JudgmentResult（新完整 LookupRequest 下的风险）+ addedIngredients 字段

import { z } from 'zod';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';
import { jsonError, jsonOk } from '@/lib/api/errorEnvelope';
import { getAuditLogger } from '@/lib/capabilities/compliance/auditLogger';

export const runtime = 'nodejs';

const stringArr = z.array(z.string());

const bodySchema = z.object({
  sessionId: z.string().min(1),
  archivedContext: z.object({
    ingredients: stringArr,
    medications: stringArr,
    conditions: stringArr,
    allergies: stringArr.optional(),
    specialGroups: stringArr.optional(),
    genes: stringArr.optional(),
    timings: stringArr.optional(),
    strategies: stringArr.optional(),
  }),
  newIngredient: z.string().optional(),
  newMedication: z.string().optional(),
  newCondition: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonError('validation', 'request body is not valid JSON');
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('validation', parsed.error.issues[0]?.message ?? 'invalid request body');
  }
  const { sessionId, archivedContext, newIngredient, newMedication, newCondition } = parsed.data;

  // 合并：archived context + 新增项。去重由 Set 保证。
  const mergedIngredients = newIngredient
    ? [...new Set([...archivedContext.ingredients, newIngredient])]
    : archivedContext.ingredients;
  const mergedMedications = newMedication
    ? [...new Set([...archivedContext.medications, newMedication])]
    : archivedContext.medications;
  const mergedConditions = newCondition
    ? [...new Set([...archivedContext.conditions, newCondition])]
    : archivedContext.conditions;

  const audit = getAuditLogger();
  try {
    const result = await judge(sessionId, {
      ingredients: mergedIngredients,
      medications: mergedMedications,
      conditions: mergedConditions,
      allergies: archivedContext.allergies,
      specialGroups: archivedContext.specialGroups,
      genes: archivedContext.genes,
      timings: archivedContext.timings,
      strategies: archivedContext.strategies,
    });
    audit
      .log({
        event: 'archive_rechecked',
        sessionId,
        metadata: {
          addedIngredient: newIngredient ?? null,
          addedMedication: newMedication ?? null,
          addedCondition: newCondition ?? null,
          overallLevel: result.overallLevel,
        },
      })
      .catch((e: unknown) => console.error('[auditLogger] archive_rechecked write failed', e));
    return jsonOk({
      ...result,
      addedIngredients: newIngredient ? [newIngredient] : [],
      addedMedications: newMedication ? [newMedication] : [],
      addedConditions: newCondition ? [newCondition] : [],
    });
  } catch (err) {
    audit.log({ event: 'error', sessionId, metadata: { route: '/api/archive/recheck', err: String(err) } }).catch(() => undefined);
    return jsonError('internal', err instanceof Error ? err.message : String(err));
  }
}
