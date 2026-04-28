// file: src/lib/reminder/slot.ts — v0.4 D14 timeOfDay → 药盒 4 slot 映射
//
// Kevin 设计契约 (DESIGN.md §11.5 + 品牌视觉规范 §11)：
//   药盒 = 4 格容器：早 / 中 / 晚 / 睡前
//   药丸 = 种子，落到对应格里
//
// 不改 ReminderRule 数据模型（任意 timeOfDay 仍合法）— 只在渲染时分桶。
// 边界设计避开"无桶可归"的死区：
//   - 早 04:00–11:00（覆盖早餐）
//   - 中 11:00–16:00（覆盖午餐 + 下午茶）
//   - 晚 16:00–21:00（覆盖晚餐）
//   - 睡前 21:00–04:00 next day（跨午夜，覆盖深夜服药）

import type { ReminderRule } from './types';
import { isoToLocalDateKey, localDateKey } from '@/lib/time/localDate';

export type SlotKey = 'morning' | 'midday' | 'evening' | 'bedtime';

export interface SlotMeta {
  key: SlotKey;
  label: '早' | '中' | '晚' | '睡前';
  startHour: number;
  endHour: number; // exclusive；若 < startHour 表示跨午夜
}

export const SLOTS: readonly SlotMeta[] = [
  { key: 'morning', label: '早', startHour: 4, endHour: 11 },
  { key: 'midday', label: '中', startHour: 11, endHour: 16 },
  { key: 'evening', label: '晚', startHour: 16, endHour: 21 },
  { key: 'bedtime', label: '睡前', startHour: 21, endHour: 4 }, // wraps midnight
] as const;

/** "08:30" → 'morning' */
export function bucketSlot(timeOfDay: string): SlotKey {
  const [hStr] = timeOfDay.split(':');
  const hour = Math.max(0, Math.min(23, Number(hStr ?? 0)));
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 21) return 'evening';
  return 'bedtime'; // 21-23 + 0-3
}

/**
 * 把 person 的所有未暂停 rule 按 4 slot 分组。
 * 同 slot 内多 rule 按 timeOfDay 升序。
 */
export function groupRulesBySlot(rules: ReminderRule[]): Record<SlotKey, ReminderRule[]> {
  const out: Record<SlotKey, ReminderRule[]> = {
    morning: [],
    midday: [],
    evening: [],
    bedtime: [],
  };
  for (const r of rules) {
    if (r.paused) continue;
    out[bucketSlot(r.timeOfDay)].push(r);
  }
  for (const key of Object.keys(out) as SlotKey[]) {
    out[key].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
  }
  return out;
}

/** 今天的本地日期 (YYYY-MM-DD) — slot ack 状态判断用 */
export function todayISODate(now = new Date()): string {
  return localDateKey(now);
}

/** 某 rule 今天是否已 ack (taken)，从 lastAckAt 推断 */
export function isRuleAckedToday(rule: ReminderRule, now = new Date()): boolean {
  if (!rule.lastAckAt) return false;
  return isoToLocalDateKey(rule.lastAckAt) === todayISODate(now);
}
