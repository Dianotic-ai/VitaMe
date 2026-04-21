// file: src/lib/capabilities/safetyJudgment/riskDefaults.ts — Risk.dimension / Risk.cta 默认映射
//
// 依据：kevin-risk-matrix.md §5（dimension）+ kevin-api-contract.md §1.6（cta）
// 角色：3 个 adapter + judgmentEngine（no_data 兜底）共用这两个映射，避免重复实现 / 漂移。
// 边界：仅生成默认值；adapter 可在生成 Risk 时覆盖（例如 form_difference 维度的 yellow
//       不强制 'consult_if_needed'，可改为 'proceed_with_caution'）。

import type { RiskCta, RiskDimension, RiskLevel } from '@/lib/types/risk';
import type { SubstanceKind } from '@/lib/types/interaction';

/**
 * 按 SubstanceKind 推断 RiskDimension。
 * - drug / drugClass / supplement → drug_interaction（补剂×药、补剂×补剂）
 * - condition                     → condition_contra
 * - specialGroup / gene           → population_caution
 * - usageTiming / usageStrategy   → dose_caution
 */
export function dimensionForSubstanceKind(kind: SubstanceKind): RiskDimension {
  switch (kind) {
    case 'drug':
    case 'drugClass':
    case 'supplement':
      return 'drug_interaction';
    case 'condition':
      return 'condition_contra';
    case 'specialGroup':
    case 'gene':
      return 'population_caution';
    case 'usageTiming':
    case 'usageStrategy':
      return 'dose_caution';
  }
}

/**
 * 按 RiskLevel 推断 RiskCta 默认值。
 * - red    → stop_and_consult
 * - yellow → consult_if_needed
 * - gray   → recheck_with_more_context（信息不足，请补充上下文重查）
 * - green  → basic_ok
 */
export function ctaForLevel(level: RiskLevel): RiskCta {
  switch (level) {
    case 'red':
      return 'stop_and_consult';
    case 'yellow':
      return 'consult_if_needed';
    case 'gray':
      return 'recheck_with_more_context';
    case 'green':
      return 'basic_ok';
  }
}
