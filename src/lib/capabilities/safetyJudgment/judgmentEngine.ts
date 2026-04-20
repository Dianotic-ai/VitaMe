// file: src/lib/capabilities/safetyJudgment/judgmentEngine.ts — L2 并发编排器
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md §Architecture / §Data Flow
// 流程：
//   1) 并发 3 路 adapter（hardcoded / suppai / ddinter）
//   2) flatMap 所有 risks → mergeRisks 去重/冲突合并
//   3) 给"未被任何 adapter 命中"的 ingredient 补 gray(no_data) 兜底（§Error Handling）
//   4) pickOverallLevel 取最严级别；partialData 取 OR

import type { LookupRequest } from '@/lib/types/adapter';
import type { JudgmentResult, Risk } from '@/lib/types/risk';
import { hardcodedAdapter } from '@/lib/adapters/hardcodedAdapter';
import { suppaiAdapter } from '@/lib/adapters/suppaiAdapter';
import { ddinterAdapter } from '@/lib/adapters/ddinterAdapter';
import { mergeRisks, pickOverallLevel } from './riskLevelMerger';

function buildNoDataRisk(ingredientId: string): Risk {
  return {
    level: 'gray',
    ingredient: ingredientId,
    reasonCode: 'no_data',
    reasonShort: '未在已烘焙数据源中命中，证据有限',
    evidence: {
      sourceType: 'limited',
      sourceRef: `no-data:${ingredientId}`,
      confidence: 'low',
    },
  };
}

export async function judge(sessionId: string, req: LookupRequest): Promise<JudgmentResult> {
  const [hc, sa, dd] = await Promise.all([
    hardcodedAdapter.lookup(req),
    suppaiAdapter.lookup(req),
    ddinterAdapter.lookup(req),
  ]);

  const allRaw: Risk[] = [...hc.risks, ...sa.risks, ...dd.risks];
  const merged = mergeRisks(allRaw);

  // 给未命中的 ingredient 补 gray(no_data)
  const coveredIngredients = new Set(merged.map((r) => r.ingredient));
  const uniqueInputs = [...new Set(req.ingredients)];
  const grayFills = uniqueInputs
    .filter((id) => !coveredIngredients.has(id))
    .map(buildNoDataRisk);

  const risks = [...merged, ...grayFills];
  const overallLevel = pickOverallLevel(risks);
  const partialData = hc.partialData || sa.partialData || dd.partialData;

  return {
    sessionId,
    overallLevel,
    risks,
    partialData,
  };
}
