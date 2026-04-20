// file: src/lib/types/interaction.ts — L2 判断层交互契约（SUPP.AI / DDInter / 硬编码禁忌 三路统一形态）

import type { SourceRef } from './sourceRef';

/**
 * Substance = 交互涉及的一方。8 类覆盖 50 条硬编码禁忌全部 slug 语义。
 * - supplement:     补剂（Ingredient.id，如 fish-oil、magnesium）
 * - drug:           单个药物（warfarin、amlodipine、metformin、levothyroxine）
 * - drugClass:      药物集合/大类（ssri-use、antihypertensive-stack、diabetes-medications）
 * - condition:      病史/体质（kidney-stone-history、gastric-ulcer、diarrhea-prone、active-hepatitis）
 * - gene:           基因（apoe4）
 * - specialGroup:   特殊人群（pregnancy）
 * - usageTiming:    时序窗口（coffee-window、no-fat-meal、bedtime-use、iron-window-overlap）
 * - usageStrategy:  使用策略（polystack-self-start、long-term-high-dose、single-dose-over-500mg）
 */
export type SubstanceKind =
  | 'supplement'
  | 'drug'
  | 'drugClass'
  | 'condition'
  | 'gene'
  | 'specialGroup'
  | 'usageTiming'
  | 'usageStrategy';

export interface Substance {
  /** 稳定 slug，与 Ingredient.id / 药物词表 / 病史 code 一致 */
  id: string;
  kind: SubstanceKind;
  nameZh?: string;
  nameEn?: string;
}

/**
 * Interaction = 一条交互规则。3 个 adapter（hardcoded / suppai / ddinter）都产出这个形态。
 * reasonCode 是稳定机器标识，templateFallback.ts 按 reasonCode 做 1-对-1 翻译兜底。
 * reason 是该规则的短中文描述，可进入 BannedPhraseFilter 走过滤。
 */
export interface Interaction {
  id: string;                              // 'vm-rule-coQ10_warfarin' / 'suppai-pair-1234'
  substanceA: Substance;
  substanceB: Substance;
  severity: InteractionSeverity;
  /** 机器可读的原因码（'vitamin_k_like_effect' / 'serotonergic_synergy_high_dose' ...） */
  reasonCode: string;
  /** 短中文描述，如 "增加出血风险（类维生素 K 效应）" */
  reason: string;
  /** 触发剂量门槛，如 '>3g/天' 或 'high_dose' */
  doseThreshold?: string;
  /** 相关特殊人群（与 substanceB.kind === 'specialGroup' 的场景互补） */
  specialGroups?: string[];
  sourceRef: SourceRef;
}

export type InteractionSeverity = 'red' | 'yellow' | 'gray' | 'green';

/**
 * ReviewerCredential = 审核人资质枚举（决定 Demo Banner 是否挂出）。
 * 只有 licensed-pharmacist / clinical-pharmacist / medical-doctor 被视为临床合规审核。
 * self-review 是 PM 自审，Demo 可用但必须挂 Banner。
 */
export type ReviewerCredential =
  | 'licensed-pharmacist'
  | 'clinical-pharmacist'
  | 'registered-dietitian'
  | 'medical-doctor'
  | 'self-review';

/**
 * Contraindication = 硬编码的人工审核禁忌规则（50 条）。
 * 是 Interaction 的子集，severity 必为 red/yellow（gray/green 不会被硬编码）。
 *
 * Demo Banner 判定规则（DemoBannerInjector 读取）：
 *   clinicallyReviewed = pharmacistReviewed === true
 *                     && reviewerCredential !== undefined
 *                     && reviewerCredential !== 'self-review'
 * 任一 Contraindication 命中且 clinicallyReviewed === false → 挂 Demo Banner。
 */
export interface Contraindication extends Interaction {
  severity: 'red' | 'yellow';
  /** 是否已过审核（合规底线，T-5.2 compliance-audit 会断言） */
  pharmacistReviewed: boolean;
  /** ISO 日期，未审核时为 undefined */
  reviewedAt?: string;
  reviewerName?: string;
  /** 审核人资质：决定是否算临床合规审核 */
  reviewerCredential?: ReviewerCredential;
}
