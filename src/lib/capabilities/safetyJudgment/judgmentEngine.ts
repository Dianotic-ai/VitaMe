// file: src/lib/capabilities/safetyJudgment/judgmentEngine.ts — L2 并发编排器
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md §Architecture / §Data Flow
//      + CLAUDE.md §10.2 v2.8（no-data ≠ no-risk 红线）
// 流程：
//   1) 并发 3 路 adapter（hardcoded / suppai / ddinter）
//   2) flatMap 所有 risks → mergeRisks 去重/冲突合并
//   3) 给"未被任何 adapter 命中"的 ingredient 补兜底，按 KB 命中拆两类：
//        - KB 已知 → green (no_known_risk)，"已检查未见风险"
//        - KB 未收录 → gray (no_data)，"未收录"
//   4) pickOverallLevel 取最严级别；partialData 取 OR

import type { LookupRequest } from '@/lib/types/adapter';
import type { JudgmentResult, Risk } from '@/lib/types/risk';
import { hardcodedAdapter } from '@/lib/adapters/hardcodedAdapter';
import { suppaiAdapter } from '@/lib/adapters/suppaiAdapter';
import { ddinterAdapter } from '@/lib/adapters/ddinterAdapter';
import { mergeRisks, pickOverallLevel } from './riskLevelMerger';
import { isInKnowledgeBase } from './knowledgeBaseLookup';

/** KB 未收录 → gray no_data；表示"我们没收录这个成分" */
function buildNoDataRisk(ingredientId: string): Risk {
  return {
    level: 'gray',
    dimension: 'coverage_gap',
    cta: 'recheck_with_more_context',
    ingredient: ingredientId,
    reasonCode: 'no_data',
    reasonShort: '未在已烘焙数据源中命中，证据有限',
    evidence: {
      sourceType: 'none',
      sourceRef: `no-data:${ingredientId}`,
      confidence: 'unknown',
    },
  };
}

/** KB 已知 + 三路 adapter 全部 no-hit → green no_known_risk；表示"已检查未见风险" */
function buildNoKnownRiskRisk(ingredientId: string): Risk {
  return {
    level: 'green',
    dimension: 'coverage_gap',
    cta: 'basic_ok',
    ingredient: ingredientId,
    reasonCode: 'no_known_risk',
    reasonShort: '已知成分，当前条件下未见已知风险',
    evidence: {
      sourceType: 'none',
      sourceRef: `no-known-risk:${ingredientId}`,
      confidence: 'unknown',
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

  // 给未命中的 ingredient 补兜底：KB 已知走 green no_known_risk，KB 未收录走 gray no_data
  const coveredIngredients = new Set(merged.map((r) => r.ingredient));
  const uniqueInputs = [...new Set(req.ingredients)];
  const fallbackFills = uniqueInputs
    .filter((id) => !coveredIngredients.has(id))
    .map((id) => (isInKnowledgeBase(id) ? buildNoKnownRiskRisk(id) : buildNoDataRisk(id)));

  const risks = [...merged, ...fallbackFills];
  const overallLevel = pickOverallLevel(risks);
  const partialData = hc.partialData || sa.partialData || dd.partialData;

  // partialReason：固定白名单码（UI 可见），供前端做"哪一路降级了"细粒度提示。
  // 契约：adapter.ts:45 规定 LookupResponse.error 是诊断串，不进 UI。因此这里**不**透出
  // hc.error / sa.error / dd.error，后者只进 audit log（AuditLogger 另行消费）。
  const downgradedReasons = [
    hc.partialData ? 'hardcoded_partial' : null,
    sa.partialData ? 'suppai_partial' : null,
    dd.partialData ? 'ddinter_partial' : null,
  ].filter((x): x is string => x !== null);
  const partialReason = downgradedReasons.length > 0 ? downgradedReasons.join(',') : null;

  return {
    sessionId,
    overallLevel,
    risks,
    partialData,
    partialReason,
  };
}
