// file: src/lib/archive/saveFlow.ts — 纯函数 helpers：addArchiveEntry / mergePersonContext
// 客户端 Zustand store 和服务端 audit 都会复用这些。纯函数，无 LocalStorage 直接调用。

import type { Archive, ArchiveEntry } from '@/lib/types/archive';
import type { Person } from '@/lib/types/person';
import type { Risk, RiskLevel } from '@/lib/types/risk';

export const ARCHIVE_SCHEMA_VERSION = 1;

export function emptyArchive(): Archive {
  return { version: ARCHIVE_SCHEMA_VERSION, persons: [], entries: [] };
}

/** 首次见 personId 时自动插 self 人物；返回更新后的 archive 快照（不 mutate 入参）。 */
export function ensurePerson(
  archive: Archive,
  personId: string,
  label: string = '自己',
  role: Person['role'] = 'self',
): Archive {
  if (archive.persons.some((p) => p.id === personId)) return archive;
  const now = new Date().toISOString();
  const newPerson: Person = {
    id: personId,
    role,
    label,
    conditions: [],
    medications: [],
    allergies: [],
    specialGroups: [],
    createdAt: now,
    updatedAt: now,
  };
  return { ...archive, persons: [...archive.persons, newPerson] };
}

export interface AddEntryInput {
  personId: string;
  sessionId: string;
  queryInput: ArchiveEntry['queryInput'];
  risks: Risk[];
  overallLevel: RiskLevel;
}

/** 追加 entry；自动合并 person.conditions / medications（去重）。不 mutate。 */
export function addArchiveEntry(archive: Archive, input: AddEntryInput, entryId: string): Archive {
  const now = new Date().toISOString();
  const entry: ArchiveEntry = {
    id: entryId,
    personId: input.personId,
    sessionId: input.sessionId,
    createdAt: now,
    queryInput: input.queryInput,
    risks: input.risks,
    overallLevel: input.overallLevel,
  };
  // 更新 person 的上下文（把本次 contextSnapshot 合进 person，便于跨次复查）
  const persons = archive.persons.map((p) => {
    if (p.id !== input.personId) return p;
    return {
      ...p,
      conditions: dedupMerge(p.conditions, input.queryInput.contextSnapshot.conditions),
      medications: dedupMerge(p.medications, input.queryInput.contextSnapshot.medications),
      allergies: dedupMerge(p.allergies, input.queryInput.contextSnapshot.allergies ?? []),
      specialGroups: dedupMerge(p.specialGroups, input.queryInput.contextSnapshot.specialGroups ?? []),
      updatedAt: now,
    };
  });
  return { ...archive, persons, entries: [...archive.entries, entry] };
}

function dedupMerge(a: string[], b: string[]): string[] {
  const seen = new Set(a);
  const out = [...a];
  for (const x of b) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

export function listEntriesForPerson(archive: Archive, personId: string): ArchiveEntry[] {
  return archive.entries
    .filter((e) => e.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
