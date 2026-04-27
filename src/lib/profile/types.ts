// file: src/lib/profile/types.ts — UserProfile schema v2（多人档案）
//
// v2 设计动机：v1 单档案会把"我自己"和"我妈/我爸"的健康信息混进同一份 profile，
// 导致 LLM 推荐时引用错位（如把妈的高血压算到自己头上）。
// v2 改为 people[]，每个 Person 一份独立档案，chat 注入只发 activePerson 的 snapshot。
//
// CLAUDE.md §3.5 + §9.8: 全部仅 LocalStorage，永不上服务端。

export type SpecialGroup = 'pregnancy' | 'breastfeeding' | 'infant' | 'elderly';
export type AgeRange = '<18' | '18-30' | '30-45' | '45-60' | '60+';
export type Sex = 'M' | 'F';

export type Relation = 'self' | 'mother' | 'father' | 'spouse' | 'child' | 'other';

export interface ProfileCondition {
  slug?: string;
  mention: string;
  /** 首次提及时间 ISO，CLAUDE.md §9.8 硬要求 */
  firstAt: string;
  lastConfirmedAt?: string;
}

export interface ProfileMedication {
  slug?: string;
  mention: string;
  isLongTerm?: boolean;
  firstAt: string;
  lastConfirmedAt?: string;
}

/** 用户在吃的补剂（区别于 medications 处方药）— 北极星 §3 Reminder 的数据来源 */
export interface ProfileSupplement {
  /** 唯一 id（用于 Reminder rule 关联） */
  supplementId: string;
  slug?: string;
  /** 用户原话 "汤臣倍健 鱼油 1000mg" */
  mention: string;
  brand?: string;
  /** "1000mg/天" */
  dosage?: string;
  /** "早餐后" / "睡前" */
  schedule?: string;
  startedAt: string;
  /** 上次反馈时间，feedback ritual 用来决定是否弹 prompt */
  lastFeedbackAt?: string;
}

export interface ProfileAllergy {
  mention: string;
  firstAt: string;
}

export interface ConversationSummary {
  sessionId: string;
  summary: string;
  topics: string[];
  ts: string;
}

/** 单个家庭成员的档案 */
export interface Person {
  id: string;
  /** 显示名（"我自己" / "妈妈" / "爸爸" / 自定义） */
  name: string;
  /** 关系，影响默认 specialGroups 推断（如 'mother' 默认偏 elderly 区间） */
  relation: Relation;
  conditions: ProfileCondition[];
  medications: ProfileMedication[];
  /** 北极星 §3 Reminder 数据源：用户在吃的补剂 */
  currentSupplements: ProfileSupplement[];
  allergies: ProfileAllergy[];
  specialGroups: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  notes: string[];
  conversationSummaries: ConversationSummary[];
  createdAt: string;
  updatedAt: string;
}

/** v2 schema：多 Person + activePersonId */
export interface UserProfile {
  schemaVersion: 2;
  /** 永久 sessionId，跨所有 person 共享（用于 audit log 关联浏览器实例） */
  sessionId: string;
  people: Person[];
  /** 当前 chat 注入哪个 person 的档案 */
  activePersonId: string;
}

export function emptyPerson(opts: { id: string; name: string; relation: Relation }): Person {
  const now = new Date().toISOString();
  return {
    id: opts.id,
    name: opts.name,
    relation: opts.relation,
    conditions: [],
    medications: [],
    currentSupplements: [],
    allergies: [],
    specialGroups: [],
    notes: [],
    conversationSummaries: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyProfile(opts: { sessionId: string; selfPersonId: string }): UserProfile {
  return {
    schemaVersion: 2,
    sessionId: opts.sessionId,
    people: [emptyPerson({ id: opts.selfPersonId, name: '我自己', relation: 'self' })],
    activePersonId: opts.selfPersonId,
  };
}

/** Memory extractor 输出 */
export interface ProfileDelta {
  newConditions?: { mention: string; slug?: string }[];
  newMedications?: { mention: string; slug?: string; isLongTerm?: boolean }[];
  newSupplements?: { mention: string; slug?: string; brand?: string; dosage?: string }[];
  newAllergies?: { mention: string }[];
  newSpecialGroups?: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  conversationSummary?: { summary: string; topics: string[] };
}

// ---------- v1 → v2 迁移用类型（只读历史 LocalStorage） ----------

/** v1 schema（单档案，遗留） */
export interface UserProfileV1 {
  sessionId: string;
  conditions: ProfileCondition[];
  medications: ProfileMedication[];
  allergies: ProfileAllergy[];
  specialGroups: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  notes: string[];
  conversationSummaries: ConversationSummary[];
  updatedAt: string;
}
