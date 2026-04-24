// file: src/lib/types/adapter.ts — 3 路 SafetyAdapter 的统一契约
//
// 依据：docs/engineering/specs/safety-judgment.md §Components / §Data Flow
// 3 路实现：hardcodedAdapter（50 条禁忌）/ suppaiAdapter（~1500 条）/ ddinterAdapter（P0 空桩）
// 设计原则（§10.2 L2 红线）：
//  - 输入/输出均为结构化数据，禁自然语言解释（"请咨询医生" 留给 L3）
//  - 无 LLM 调用，纯确定性查表
//  - Promise 形态允许未来切换到网络/DB 驱动，不改契约

import type { Risk } from './risk';

/**
 * LookupRequest = JudgmentEngine 给各 adapter 的查询载荷。
 * 所有字段都是已标准化的 slug（与 Ingredient.id / Substance.id 对齐）。
 * 由 queryIntake → ContextCollector 归一后送入。
 */
export interface LookupRequest {
  /** Ingredient.id，如 'fish-oil' / 'magnesium' / 'coenzyme-q10' */
  ingredients: string[];
  /** drug / drugClass slug，如 'warfarin' / 'ssri-use' / 'diabetes-medications' */
  medications: string[];
  /** condition slug（病史/体质） */
  conditions: string[];
  /** 过敏原 slug（P0 未用于硬编码匹配，保留契约给未来） */
  allergies?: string[];
  /** specialGroup slug，如 'pregnancy' */
  specialGroups?: string[];
  /** gene slug，如 'apoe4' */
  genes?: string[];
  /** usageTiming slug，如 'coffee-window' / 'no-fat-meal' / 'bedtime-use' */
  timings?: string[];
  /** usageStrategy slug，如 'long-term-high-dose' / 'polystack-self-start' / 'single-dose-over-500mg' */
  strategies?: string[];
}

/**
 * LookupResponse = adapter 统一返回形态。
 * partialData=true 会让 JudgmentEngine 在 JudgmentResult.partialData 上合并，前端标注"数据源降级"。
 */
export interface LookupResponse {
  risks: Risk[];
  partialData: boolean;
  /** adapter 自称的来源名（log / audit / UI 徽章使用） */
  source: AdapterSource;
  /** 异常路径的诊断串（不进 UI，仅 audit） */
  error?: string;
}

export type AdapterSource = 'hardcoded' | 'suppai' | 'ddinter';

/**
 * SafetyAdapter = 统一契约，3 路 adapter 全部实现。
 * name 字段供 audit / 诊断；lookup 必须异步（保留未来网络化扩展）。
 */
export interface SafetyAdapter {
  readonly name: AdapterSource;
  lookup(req: LookupRequest): Promise<LookupResponse>;
}
