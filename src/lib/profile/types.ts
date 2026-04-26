// file: src/lib/profile/types.ts — UserProfile schema（CLAUDE.md §3.5 + §9.8）
//
// 客户端独有，永不上服务端持久化。
// 每条 condition / medication 必含 firstAt（CLAUDE.md §9.8 硬要求）。

export type SpecialGroup = 'pregnancy' | 'breastfeeding' | 'infant' | 'elderly';
export type AgeRange = '<18' | '18-30' | '30-45' | '45-60' | '60+';
export type Sex = 'M' | 'F';

export interface ProfileCondition {
  /** 已知 slug（如 'diabetes'）；自由 mention 时为空 */
  slug?: string;
  /** 用户原话（如 '糖尿病' / '我妈有高血压'） */
  mention: string;
  /** 首次提及时间 ISO，CLAUDE.md §9.8 硬要求 */
  firstAt: string;
  /** 用户最近一次确认（用于 prompt "30 天前的字段礼貌确认是否仍有效"） */
  lastConfirmedAt?: string;
}

export interface ProfileMedication {
  slug?: string;
  mention: string;
  /** 长期用药 vs 短期 */
  isLongTerm?: boolean;
  firstAt: string;
  lastConfirmedAt?: string;
}

export interface ProfileAllergy {
  mention: string;
  firstAt: string;
}

/** 一次会话结束后的简要 summary，跨会话作为 recent_topics 引用 */
export interface ConversationSummary {
  sessionId: string;
  /** 一句话摘要（如 "讨论 Q10 + 他汀，确认剂量 100mg/天"） */
  summary: string;
  /** 关键 topic tag（"Q10"、"他汀"、"剂量"） */
  topics: string[];
  /** 当时 ISO 时间 */
  ts: string;
}

export interface UserProfile {
  /** 永久 sessionId，首访生成 UUID 存 LocalStorage */
  sessionId: string;
  conditions: ProfileCondition[];
  medications: ProfileMedication[];
  allergies: ProfileAllergy[];
  specialGroups: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  /** 用户在 /profile 页手动添加的备注 */
  notes: string[];
  /** 跨会话历史 summary（Memory extractor 写入） */
  conversationSummaries: ConversationSummary[];
  /** profile 更新时间 */
  updatedAt: string;
}

export function emptyProfile(sessionId: string): UserProfile {
  const now = new Date().toISOString();
  return {
    sessionId,
    conditions: [],
    medications: [],
    allergies: [],
    specialGroups: [],
    notes: [],
    conversationSummaries: [],
    updatedAt: now,
  };
}

/** Memory extractor 输出（部分字段，用于 merge） */
export interface ProfileDelta {
  newConditions?: { mention: string; slug?: string }[];
  newMedications?: { mention: string; slug?: string; isLongTerm?: boolean }[];
  newAllergies?: { mention: string }[];
  newSpecialGroups?: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  conversationSummary?: { summary: string; topics: string[] };
}
