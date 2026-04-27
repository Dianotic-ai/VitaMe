// file: src/lib/reminder/types.ts — Reminder schema (北极星 §3)

export interface ReminderRule {
  ruleId: string;
  personId: string;
  /** 关联到 Person.currentSupplements[].supplementId */
  supplementId: string;
  /** "08:00" 等 24h 制，单次每天提醒一次 */
  timeOfDay: string;
  /** 1=周一 ... 7=周日 */
  daysOfWeek: number[];
  paused: boolean;
  /** 1.0=正常；0.5=连续 skip 后降频；0.25=很少 */
  frequencyMultiplier: number;
  lastTriggeredAt?: string;
  lastAckAt?: string;
  consecutiveSkips: number;
  createdAt: string;
}

export type AckAction = 'taken' | 'skip' | 'snooze';
