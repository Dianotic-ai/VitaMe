// file: src/lib/types/query.ts — Query Intake 层契约（文字 + 拍照双入口 → 归一 token → QuerySession）

import type { PersonRef } from './person';

export type QueryInputSource = 'text' | 'ocr';

/**
 * NormalizedToken = InputNormalizer 把一条用户输入（"鱼油"、"Doctor's Best 镁片"、
 * "Magnesium Bisglycinate 200mg"）切分 + 映射后产生的单元。
 * kind 标注这是成分 / 药物 / 产品名 / 不识别；DSLD 字典命中则 normalized=true。
 */
export interface NormalizedToken {
  raw: string;
  normalized: boolean;
  kind: 'ingredient' | 'medication' | 'product' | 'unknown';
  /** 命中 Ingredient.id 时填（'magnesium' / 'fish-oil' ...） */
  ingredientId?: string;
  /** 化学形式（甘氨酸镁/氧化镁 → 'glycinate' / 'oxide'） */
  form?: string;
  dose?: number;
  unit?: string;
  /** ProductMatcher 输出的置信度 0–1；<0.6 走 disambiguation */
  confidence: number;
}

/**
 * Question = IntakeOrchestrator 根据命中的 Ingredient 从预设模板挑出的结构化问题。
 * answerType 决定前端渲染形态：boolean = Yes/No；single/multi = 选项；text = 自由文本。
 */
export interface Question {
  id: string;                              // 'gastric-sensitivity' / 'current-medications' / 'pregnancy'
  promptZh: string;
  answerType: 'boolean' | 'single' | 'multi' | 'text';
  options?: string[];                      // answerType != 'text' 时候选值
  required: boolean;
  /** 给 UI 展示"为什么问这个"，增加信任感（User Journey J1 要求） */
  reasonHint?: string;
}

export interface ContextAnswer {
  questionId: string;
  value: boolean | string | string[];
}

/**
 * QueryContext = ContextCollector 归一化后的上下文，结构稳定、SafetyJudgment 直接可用。
 */
export interface QueryContext {
  medications: string[];
  conditions: string[];
  allergies: string[];
  specialGroups: string[];
  genes?: string[];
}

/**
 * QuerySession = 一次查询的完整状态。
 * 由 querySession.ts（内存 Map + TTL 30min）维护；SafetyJudgment 只以 sessionId 消费，不共享可变引用。
 * ready=true 之后才能被 /api/judgment 接受。
 */
export interface QuerySession {
  sessionId: string;
  createdAt: string;                       // ISO
  source: QueryInputSource;
  personRef?: PersonRef;
  tokens: NormalizedToken[];
  /** 解析完成的 ingredientId 列表（已去重，合并 D3 → 维D 等） */
  ingredients: string[];
  context: QueryContext;
  questions: Question[];
  answers: ContextAnswer[];
  ready: boolean;
}

/**
 * OcrExtractionResult = Minimax 多模态对瓶子图片的结构化输出契约。
 * Zod schema 在 ocrAdapter.ts 内定义；confidence < 0.7 走 manual fallback（不阻断）。
 */
export interface OcrExtractionResult {
  brand?: string;
  productName?: string;
  countryGuess?: ProductCountryGuess;
  ingredients: OcrIngredientLine[];
  /** 整体识别置信度 0–1 */
  confidence: number;
  /** 图片中无法识别的部分（给用户"手动补正" UI 用） */
  unreadableParts: string[];
}

export type ProductCountryGuess = 'US' | 'AU' | 'JP' | 'CN' | 'UNKNOWN';

export interface OcrIngredientLine {
  nameEn: string;
  amount?: number;
  unit?: string;
  form?: string;
}
