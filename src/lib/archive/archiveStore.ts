// file: src/lib/archive/archiveStore.ts — 客户端 Zustand persist store（LocalStorage 持久化）
// 注意：仅客户端使用（'use client' 组件里 import）。纯函数逻辑在 saveFlow.ts，方便单测。
// 隐私：Archive 数据只在浏览器 LocalStorage，不上传服务器（Memory 未来才考虑云同步）。

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Archive, ArchiveEntry } from '@/lib/types/archive';
import type { Risk, RiskLevel } from '@/lib/types/risk';
import type { QueryContext, QueryInputSource } from '@/lib/types/query';
import {
  ARCHIVE_SCHEMA_VERSION,
  addArchiveEntry,
  emptyArchive,
  ensurePerson,
  listEntriesForPerson,
} from './saveFlow';

interface ArchiveState {
  archive: Archive;
  saveEntry: (input: {
    entryId: string;
    personId: string;
    personLabel?: string;
    sessionId: string;
    source: QueryInputSource;
    ingredients: string[];
    contextSnapshot: QueryContext;
    risks: Risk[];
    overallLevel: RiskLevel;
  }) => ArchiveEntry;
  listByPerson: (personId: string) => ArchiveEntry[];
  getEntry: (entryId: string) => ArchiveEntry | undefined;
  clearAll: () => void;
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      archive: emptyArchive(),
      saveEntry: (input) => {
        const state = get().archive;
        const withPerson = ensurePerson(state, input.personId, input.personLabel ?? '自己');
        const next = addArchiveEntry(
          withPerson,
          {
            personId: input.personId,
            sessionId: input.sessionId,
            queryInput: {
              source: input.source,
              ingredients: input.ingredients,
              contextSnapshot: input.contextSnapshot,
            },
            risks: input.risks,
            overallLevel: input.overallLevel,
          },
          input.entryId,
        );
        set({ archive: next });
        return next.entries.find((e) => e.id === input.entryId)!;
      },
      listByPerson: (personId) => listEntriesForPerson(get().archive, personId),
      getEntry: (entryId) => get().archive.entries.find((e) => e.id === entryId),
      clearAll: () => set({ archive: emptyArchive() }),
    }),
    {
      name: 'vitame-archive-v1',
      version: ARCHIVE_SCHEMA_VERSION,
    },
  ),
);
