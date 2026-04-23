// file: src/lib/types/intent.ts — L0 Query Intake 跨子模块契约
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md
//      + CLAUDE.md §3.1（4 层架构）/ §10.0（L0 rules）/ §11.13（L0 LLM 不判风险）
//
// 这里集中定义 4 个子模块（parseIntent / groundMentions / slotResolver / clarify）的输入输出，
// 保证跨子模块契约一致。每个子模块**只**实现自己的函数，不重复定义类型。

import { z } from 'zod';
import type { LookupRequest } from '@/lib/types/adapter';

// ──────────────────────────────────────────────────────────────────────────
// Intent type 枚举（7 种；P0 实装 4 个 handler，详见 design spec §f）
// ──────────────────────────────────────────────────────────────────────────

export const IntentTypeEnum = z.enum([
  'product_safety_check',      // "Swisse 葡萄籽现在能吃吗？"
  'photo_label_parse',         // 拍了张瓶子图（前端归此类）
  'symptom_goal_query',        // "我最近老觉得累"
  'ingredient_translation',    // "EPA 是什么？"
  'contraindication_followup', // "刚才说的 Q10 + 华法林，那如果只吃半量呢？"
  'profile_update',            // "我现在不吃 SSRI 了"
  'unclear',                   // 兜底
]);
export type IntentType = z.infer<typeof IntentTypeEnum>;

// ──────────────────────────────────────────────────────────────────────────
// MissingSlot 枚举（slotResolver 输入；parseIntent 也可能直接给）
// ──────────────────────────────────────────────────────────────────────────

export const MissingSlotEnum = z.enum([
  'product_or_ingredient', // 没说在问哪个东西
  'medication_context',    // 高风险类问题但没说在吃什么药
  'special_group',         // 缺孕期/婴幼儿等关键人群信息
  'symptom_specificity',   // symptom 型但太笼统
]);
export type MissingSlot = z.infer<typeof MissingSlotEnum>;

// ──────────────────────────────────────────────────────────────────────────
// ClarifyingQuestion（clarify 单轮问句 + 选项）
// 严禁 LLM 自由发挥添加选项；choices 长度由业务决定，question 措辞由 LLM 包装。
// ──────────────────────────────────────────────────────────────────────────

export const ClarifyingQuestionSchema = z
  .object({
    question: z.string().min(4).max(40), // ≤40 字（DESIGN.md 移动端约束）
    choices: z.array(z.string()).min(2).max(4), // 2-4 选项 + UI 自动追加 "其他"
  })
  .strict();
export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;

// ──────────────────────────────────────────────────────────────────────────
// IntentResult — parseIntent 输出，Zod .strict() 锁死防 LLM 越权
// 红线 §11.13：严禁出现 level / safe / dangerous / risk_level 等风险判断字段
// ──────────────────────────────────────────────────────────────────────────

export const IntentResultSchema = z
  .object({
    intent: IntentTypeEnum,
    productMentions: z.array(z.string()).max(10),
    ingredientMentions: z.array(z.string()).max(10),
    medicationMentions: z.array(z.string()).max(10),
    conditionMentions: z.array(z.string()).max(10),
    specialGroupMentions: z.array(z.string()).max(5),
    symptomMentions: z.array(z.string()).max(5),
    missingSlots: z.array(MissingSlotEnum),
    clarifyingQuestion: ClarifyingQuestionSchema.nullable(),
  })
  .strict();
export type IntentResult = z.infer<typeof IntentResultSchema>;

// ──────────────────────────────────────────────────────────────────────────
// ClarifyTurn — 多轮 clarify 历史（前端往后传，parseIntent 二轮重新解析）
// ──────────────────────────────────────────────────────────────────────────

export interface ClarifyTurn {
  topic: string; // slotResolver 给的 clarifyTopic
  userChoice: string; // 用户选了哪个 choice 或自由文本
}

// ──────────────────────────────────────────────────────────────────────────
// ParseIntentInput — parseIntent 入参
// ──────────────────────────────────────────────────────────────────────────

export interface ParseIntentInput {
  rawQuery: string;
  imageOcrText?: string; // OCR 路径下 ocrAdapter 输出的纯文本
  history?: ClarifyTurn[]; // 多轮 clarify 历史
}

// ──────────────────────────────────────────────────────────────────────────
// GroundedMentions — groundMentions 输出
// ungroundedMentions 给 UI 展示候选 / 询问用户
// ──────────────────────────────────────────────────────────────────────────

export type UngroundedKind = 'ingredient' | 'medication' | 'condition' | 'specialGroup';

export interface UngroundedMention {
  raw: string;
  kind: UngroundedKind;
  candidates: string[]; // L1 fuzzy 找到的近似 slug，UI 给候选
}

export interface GroundedMentions {
  ingredientSlugs: string[];
  medicationSlugs: string[];
  conditionSlugs: string[];
  specialGroupSlugs: string[];
  ungroundedMentions: UngroundedMention[];
}

// ──────────────────────────────────────────────────────────────────────────
// SlotDecision — slotResolver 输出
// shouldClarify=true 时 clarifyTopic + clarifyChoices 必填
// shouldClarify=false 时 passThrough 必填（直接给 L2 的 LookupRequest）
// ──────────────────────────────────────────────────────────────────────────

export type ClarifyTopic =
  | 'medication_context'
  | 'special_group'
  | 'product_disambiguation'
  | 'symptom_specificity';

export interface SlotDecision {
  shouldClarify: boolean;
  clarifyTopic: ClarifyTopic | null;
  clarifyChoices: string[]; // 业务给候选；clarify.ts 的 LLM 把它们包装成自然问句
  passThrough: LookupRequest | null;
}
