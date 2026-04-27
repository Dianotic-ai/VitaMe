// file: src/lib/reminder/store.ts — 客户端 zustand persist Reminder rules
// LocalStorage key = 'vitame-reminder-v1'

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AckAction, ReminderRule } from './types';

interface ReminderState {
  rules: ReminderRule[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  addRule: (input: Omit<ReminderRule, 'ruleId' | 'paused' | 'frequencyMultiplier' | 'consecutiveSkips' | 'createdAt'>) => string;
  updateRule: (ruleId: string, patch: Partial<ReminderRule>) => void;
  removeRule: (ruleId: string) => void;
  removeBySupplement: (supplementId: string) => void;
  removeByPerson: (personId: string) => void;
  ackRule: (ruleId: string, action: AckAction) => void;
  /** 给 D4 banner 用：当前 person 有哪些 rule 该触发 */
  computeDueRules: (personId: string, nowISO?: string) => ReminderRule[];
}

function nowISO(): string {
  return new Date().toISOString();
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      rules: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      addRule: (input) => {
        const ruleId = nanoid();
        set((state) => ({
          rules: [
            ...state.rules,
            {
              ruleId,
              personId: input.personId,
              supplementId: input.supplementId,
              timeOfDay: input.timeOfDay,
              daysOfWeek: input.daysOfWeek,
              paused: false,
              frequencyMultiplier: 1.0,
              consecutiveSkips: 0,
              createdAt: nowISO(),
              lastTriggeredAt: input.lastTriggeredAt,
              lastAckAt: input.lastAckAt,
            },
          ],
        }));
        return ruleId;
      },

      updateRule: (ruleId, patch) => set((state) => ({
        rules: state.rules.map((r) => (r.ruleId === ruleId ? { ...r, ...patch } : r)),
      })),

      removeRule: (ruleId) => set((state) => ({
        rules: state.rules.filter((r) => r.ruleId !== ruleId),
      })),

      removeBySupplement: (supplementId) => set((state) => ({
        rules: state.rules.filter((r) => r.supplementId !== supplementId),
      })),

      removeByPerson: (personId) => set((state) => ({
        rules: state.rules.filter((r) => r.personId !== personId),
      })),

      ackRule: (ruleId, action) => set((state) => ({
        rules: state.rules.map((r) => {
          if (r.ruleId !== ruleId) return r;
          const now = nowISO();
          const next: ReminderRule = { ...r, lastAckAt: now };
          if (action === 'taken') {
            next.consecutiveSkips = 0;
            next.frequencyMultiplier = Math.min(1.0, r.frequencyMultiplier + 0.25);
          } else if (action === 'skip') {
            next.consecutiveSkips = r.consecutiveSkips + 1;
            // 连续 3 次 skip → 降频；连续 5 次 → 严重降频
            if (next.consecutiveSkips >= 5) next.frequencyMultiplier = 0.25;
            else if (next.consecutiveSkips >= 3) next.frequencyMultiplier = 0.5;
          } else if (action === 'snooze') {
            // 不更新 consecutive，只更新 lastTriggeredAt 让今日不再弹
          }
          next.lastTriggeredAt = now;
          return next;
        }),
      })),

      computeDueRules: (personId, atIso) => {
        const now = atIso ? new Date(atIso) : new Date();
        const today = now.toISOString().slice(0, 10);
        const dow = ((now.getDay() + 6) % 7) + 1; // 周一=1

        return get().rules.filter((r) => {
          if (r.personId !== personId) return false;
          if (r.paused) return false;
          if (!r.daysOfWeek.includes(dow)) return false;

          // 频率倍数 — 如果 < 1，按倍数判断今天该不该触发（基于天数）
          if (r.frequencyMultiplier < 1.0) {
            const lastTrig = r.lastTriggeredAt ? new Date(r.lastTriggeredAt).getTime() : 0;
            const daysSince = (now.getTime() - lastTrig) / (24 * 60 * 60 * 1000);
            const requiredGap = 1 / r.frequencyMultiplier; // 0.5 → 2 天；0.25 → 4 天
            if (daysSince < requiredGap) return false;
          }

          // 已经在今天 ack 过 → 不再触发
          if (r.lastAckAt && r.lastAckAt.slice(0, 10) === today) return false;

          // 检查时间是否到了
          const [hStr, mStr] = r.timeOfDay.split(':');
          const ruleTime = (Number(hStr ?? 0) * 60) + Number(mStr ?? 0);
          const nowMin = now.getHours() * 60 + now.getMinutes();
          return nowMin >= ruleTime;
        });
      },
    }),
    {
      name: 'vitame-reminder-v1',
      version: 1,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
      partialize: (state) => ({ rules: state.rules }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
