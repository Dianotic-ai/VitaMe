// file: src/lib/chat/types.ts — v0.3 chat path 共享类型
//
// 设计原则：
// - 跟 v0.2 老代码 0 依赖（除了 SourceRef，因为 L1 db 数据是 v0.2 baked 的）
// - 客户端和服务端共用（不带 server-only / browser-only 副作用）

import type { SourceRef } from '@/lib/types/sourceRef';

// ---- 消息 ----

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ---- RAG 检索结果 ----

/** Fact 类别，决定在 system prompt 里怎么引用 */
export type FactCategory =
  | 'dosage'           // 剂量数据（NIH/LPI/DRI），引证必带
  | 'mechanism'        // 机制 / 功能描述（LPI），引证可选
  | 'interaction'      // 补×药相互作用（SUPP.AI），引证必带
  | 'contraindication' // 硬编码禁忌（CRITICAL，必须命中后强制注入），引证必带
  | 'symptom'          // 症状→候选成分映射，引证必带
  | 'product';         // 区域注册产品（DSLD/TGA/JP/蓝帽子），引证必带

export interface Fact {
  /** 全局唯一，retrieved 时生成（如 "contraindication:fishoil-warfarin"） */
  id: string;
  /** 命中类别 */
  category: FactCategory;
  /** 注入 prompt 的中文文本（已格式化好） */
  content: string;
  /** 引证源（必有，CLAUDE.md §9.4） */
  sourceRef: SourceRef;
  /** 是否 critical 高危（决定 prompt 是否走硬路由） */
  isCritical?: boolean;
}

/** retriever 返回值 */
export interface RetrievedFacts {
  facts: Fact[];
  /** 命中的 ingredient slug 列表 */
  ingredientSlugs: string[];
  /** 命中的 medication slug 列表 */
  medicationSlugs: string[];
  /** 命中的 condition slug 列表 */
  conditionSlugs: string[];
  /** Critical 命中数（>0 时 prompt 走强警告分支） */
  criticalHits: number;
}

// ---- 请求 / 响应 ----

/** POST /api/chat 入参 */
export interface ChatRequest {
  /** 客户端 sessionId（zustand 持久化的 UUID） */
  sessionId: string;
  /** 多轮 history + 本轮 user message（最后一条必须是 user） */
  messages: ChatMessage[];
  /** 客户端 user profile 快照（CLAUDE.md §9.8 不在服务端持久化） */
  profile?: ProfileSnapshot;
}

/** profile 在 chat request 中的轻量序列化（不含 conversationSummaries 全量） */
export interface ProfileSnapshot {
  conditions?: { slug?: string; mention: string; firstAt: string }[];
  medications?: { slug?: string; mention: string; isLongTerm?: boolean }[];
  allergies?: { mention: string; firstAt: string }[];
  specialGroups?: string[];
  ageRange?: string;
  sex?: 'M' | 'F';
  recentTopics?: string[];
}
