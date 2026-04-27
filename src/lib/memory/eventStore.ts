// file: src/lib/memory/eventStore.ts — 客户端 zustand persist 事件流
//
// LocalStorage key = 'vitame-memory-v1'
// 不限大小（理论上）— 但默认仅保留最近 500 条；超过后从最旧的开始 prune
// CLAUDE.md §9.8: 仅本地，永不上服务端

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { EventGroup, EventType, MemoryEvent, PrivacyMode } from './types';

const MAX_EVENTS = 500;

interface EventState {
  events: MemoryEvent[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  /** 写入新事件。返回新事件的 eventId */
  appendEvent: (input: Omit<MemoryEvent, 'eventId' | 'occurredAt' | 'privacyMode'> & { privacyMode?: PrivacyMode }) => string;

  /** 删除指定 eventId */
  removeEvent: (eventId: string) => void;

  /** 删除指定 person 的全部事件（用户清空档案时调用） */
  removeByPerson: (personId: string) => void;

  /** 清空全部事件 */
  clearAll: () => void;

  /** 查询：按 person + 可选 eventType 过滤 */
  query: (opts: { personId?: string; eventTypes?: EventType[]; entitySlug?: string; sinceISO?: string }) => MemoryEvent[];

  /** 查询：按天分组（用于时间轴展示） */
  groupByDay: (opts: { personId?: string }) => EventGroup[];
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      appendEvent: (input) => {
        const eventId = nanoid();
        const ev: MemoryEvent = {
          eventId,
          occurredAt: new Date().toISOString(),
          eventType: input.eventType,
          personId: input.personId,
          entityRefs: input.entityRefs ?? [],
          userText: input.userText,
          agentText: input.agentText,
          tags: input.tags ?? [],
          privacyMode: input.privacyMode ?? 'local',
          metadata: input.metadata,
        };
        set((state) => {
          const next = [...state.events, ev];
          // prune 最旧的事件，避免 LocalStorage 撑爆
          const pruned = next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
          return { events: pruned };
        });
        return eventId;
      },

      removeEvent: (eventId) => set((state) => ({
        events: state.events.filter((e) => e.eventId !== eventId),
      })),

      removeByPerson: (personId) => set((state) => ({
        events: state.events.filter((e) => e.personId !== personId),
      })),

      clearAll: () => set({ events: [] }),

      query: ({ personId, eventTypes, entitySlug, sinceISO }) => {
        const all = get().events;
        return all.filter((e) => {
          if (personId && e.personId !== personId) return false;
          if (eventTypes && !eventTypes.includes(e.eventType)) return false;
          if (entitySlug && !e.entityRefs.includes(entitySlug)) return false;
          if (sinceISO && e.occurredAt < sinceISO) return false;
          return true;
        });
      },

      groupByDay: ({ personId }) => {
        const events = get().events.filter((e) => !personId || e.personId === personId);
        // sort 倒序（最新在前）
        const sorted = [...events].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
        const map = new Map<string, MemoryEvent[]>();
        for (const e of sorted) {
          const day = e.occurredAt.slice(0, 10);
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push(e);
        }
        return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
      },
    }),
    {
      name: 'vitame-memory-v1',
      version: 1,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
      partialize: (state) => ({ events: state.events }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
