// file: src/lib/feedback/triggerRule.ts — 决定何时弹 FeedbackPrompt（北极星 §4）
//
// 默认低频规则：
// - 用户进入 chat 时检查
// - 如果 active person 的 currentSupplements 中有任何一款 lastFeedbackAt > 24h（或从未反馈且 startedAt > 24h）→ 触发
// - 同一 session 最多弹 1 次
// - 用户连续 3 次 skip → cooldown 升到 72h（per-supplement）

import type { Person } from '@/lib/profile/types';

const DEFAULT_COOLDOWN_HOURS = 24;
const SESSION_PROMPT_KEY = 'vitame:feedback-prompt-shown:';

export interface FeedbackTrigger {
  supplementId: string;
  supplementMention: string;
  questionVariant: 'taken' | 'feeling' | 'time-adjust';
  /** 上次什么时候问过这条 supplement */
  lastPromptedAt?: string;
}

/**
 * 计算应不应该弹 FeedbackPrompt。
 * 返回 trigger 数据 / null（不弹）
 */
export function computeTrigger(person: Person): FeedbackTrigger | null {
  if (typeof window === 'undefined') return null;
  if (person.currentSupplements.length === 0) return null;

  // 同一 session 最多弹 1 次
  const sessionKey = SESSION_PROMPT_KEY + person.id + ':' + new Date().toISOString().slice(0, 10);
  if (window.sessionStorage.getItem(sessionKey)) return null;

  const now = Date.now();
  const cooldownMs = DEFAULT_COOLDOWN_HOURS * 60 * 60 * 1000;

  // 找最久没反馈的 supplement
  const candidates = person.currentSupplements
    .map((s) => {
      const lastTs = s.lastFeedbackAt ?? s.startedAt;
      const elapsedMs = now - new Date(lastTs).getTime();
      return { s, elapsedMs };
    })
    .filter(({ elapsedMs }) => elapsedMs >= cooldownMs)
    .sort((a, b) => b.elapsedMs - a.elapsedMs);

  if (candidates.length === 0) return null;

  const target = candidates[0]!;

  // 简单 variant 选择：基于秒数 hash 选一种 question
  const variants: FeedbackTrigger['questionVariant'][] = ['taken', 'feeling', 'time-adjust'];
  const variant = variants[now % variants.length]!;

  return {
    supplementId: target.s.supplementId,
    supplementMention: target.s.mention,
    questionVariant: variant,
  };
}

/** 用户响应或跳过后调用，标记本 session 已弹过，避免循环 */
export function markPromptShown(personId: string): void {
  if (typeof window === 'undefined') return;
  const sessionKey = SESSION_PROMPT_KEY + personId + ':' + new Date().toISOString().slice(0, 10);
  window.sessionStorage.setItem(sessionKey, '1');
}

/** 严重异常关键词硬拦截（北极星 §4 倒数第二段） */
const URGENT_KEYWORDS = ['剧痛', '呼吸困难', '出血', '过敏休克', '晕倒', '抽搐', '昏迷', '心悸严重'];

export function detectUrgent(text: string): boolean {
  if (!text) return false;
  return URGENT_KEYWORDS.some((kw) => text.includes(kw));
}
