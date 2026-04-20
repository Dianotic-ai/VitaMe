// file: src/lib/types/archive.ts — Archive & Recheck 契约（LocalStorage + Zustand persist）

import type { Person } from './person';
import type { QueryContext, QueryInputSource } from './query';
import type { Risk, RiskLevel } from './risk';

/**
 * ArchiveEntry = 一次查询的档案快照。
 * 归属某个 Person（mom/dad/self）；RecheckOrchestrator 下次复查时会拉出 contextSnapshot 做交叉检查。
 */
export interface ArchiveEntry {
  id: string;                              // uuid
  personId: string;
  sessionId: string;
  createdAt: string;                       // ISO
  /** 这次查询用户实际输入的简化快照 */
  queryInput: ArchiveQueryInput;
  /** 这次查询产生的全部 Risk（保留未翻译 Risk，便于跨会话对比） */
  risks: Risk[];
  overallLevel: RiskLevel;
}

export interface ArchiveQueryInput {
  source: QueryInputSource;
  /** 命中的 ingredientId 列表 */
  ingredients: string[];
  /** 当时的上下文（病史 / 药物 / 过敏 / 特殊群体），用于后续复查对比 */
  contextSnapshot: QueryContext;
}

/**
 * Archive = LocalStorage 的根对象。
 * version 字段用于后续 schema 迁移（P1 改表结构时 archiveStore 按 version 做一次性迁移）。
 */
export interface Archive {
  version: number;
  persons: Person[];
  entries: ArchiveEntry[];
}
