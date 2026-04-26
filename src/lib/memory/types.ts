// file: src/lib/memory/types.ts — MemoryEvent schema (北极星 §5)
//
// agent-readable context，事件流。每次 verify / reminder / feedback / observation / correction 都写一条。
// CLAUDE.md §9.8 + 北极星 §8: 全部仅 LocalStorage（privacyMode='local'），永不上服务端
//
// hermit / observation / 时间轴查询都基于这个事件流

export type EventType = 'verify' | 'reminder' | 'feedback' | 'observation' | 'correction';
export type PrivacyMode = 'local' | 'pseudonymous' | 'cloud_memory';

export interface MemoryEvent {
  /** nanoid，全局唯一 */
  eventId: string;
  /** ISO 时间，事件发生时刻 */
  occurredAt: string;
  /** 事件类型，决定时间轴 icon + Hermit 怎么解读 */
  eventType: EventType;
  /** 哪个 person 的事件（关联到 profile.people[].id） */
  personId: string;
  /** 涉及的实体 slug（supplement / drug / condition），用于过滤和关联查询 */
  entityRefs: string[];
  /** 用户原话（如果有） */
  userText?: string;
  /** Agent 输出摘要（如果有，verify/observation 用） */
  agentText?: string;
  /** 自由 tag，方便归类（如 'critical' / 'fishoil' / 'morning'） */
  tags: string[];
  /** 隐私级别。P0 全部 'local'，pseudonymous/cloud_memory 留给 P3+ */
  privacyMode: PrivacyMode;
  /** 任意 metadata，按 eventType 解读 */
  metadata?: Record<string, unknown>;
}

/** verify event metadata: 一次 chat turn 的安全检查 */
export interface VerifyEventMetadata {
  retrievedSourceIds?: string[]; // KB 命中的源 id
  criticalHits?: number; // 命中 critical 高危的数量
}

/** feedback event metadata: 用户对一次服用的反馈 */
export interface FeedbackEventMetadata {
  question: 'taken' | 'feeling' | 'skip' | 'time-adjust';
  answer: string; // 'yes' / 'better' / 'worse' / 'no-feeling' / 'skip' / etc.
  freeText?: string;
}

/** reminder event metadata: 一次提醒触达 + 用户响应 */
export interface ReminderEventMetadata {
  ruleId: string;
  ackAction: 'taken' | 'skip' | 'snooze' | 'reschedule';
}

/** observation event metadata: Hermit 周期归纳出的观察 */
export interface ObservationEventMetadata {
  observationType: 'pattern' | 'recheck' | 'reminder-adjust' | 'request-field';
  basedOnEventIds: string[]; // 基于哪些 event 归纳出的
  proposal?: string; // 提案（"调整提醒到饭后"）
  userAction?: 'accepted' | 'dismissed' | 'snoozed';
}

/** correction event metadata: 用户对 observation 的反馈 / 主动修正 profile */
export interface CorrectionEventMetadata {
  targetObservationId?: string; // 修正了哪个 observation
  freeText?: string;
}

/** 时间轴渲染时按天分组用 */
export interface EventGroup {
  date: string; // YYYY-MM-DD
  events: MemoryEvent[];
}
