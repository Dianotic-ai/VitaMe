// file: src/lib/profile/profileStore.ts — v2 多 Person zustand persist
//
// CLAUDE.md §9.8: 仅 LocalStorage，永不上服务端。
// LocalStorage key = 'vitame-profile-v2'（v1 = 'vitame-profile-v1' 不动，作为历史/可恢复源）
// 加载时如检测到 v1 数据 → 自动迁移成 v2 people[0]='我自己'，v1 数据保留不删（用户可手动清）

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  emptyProfile,
  emptyPerson,
  type AgeRange,
  type Person,
  type ProfileAllergy,
  type ProfileCondition,
  type ProfileDelta,
  type ProfileMedication,
  type Relation,
  type Sex,
  type UserProfile,
  type UserProfileV1,
} from './types';

interface ProfileState {
  profile: UserProfile;

  /** 当前 active person 的快捷访问 */
  activePerson: () => Person;

  // ---- person 级操作 ----
  addPerson: (name: string, relation: Relation) => string;
  removePerson: (personId: string) => void;
  renamePerson: (personId: string, name: string) => void;
  setActivePersonId: (personId: string) => void;

  // ---- 当前 active person 的字段操作 ----
  applyDelta: (delta: ProfileDelta, sessionId: string) => void;
  removeCondition: (idx: number) => void;
  removeMedication: (idx: number) => void;
  removeAllergy: (idx: number) => void;
  addCondition: (mention: string) => void;
  addMedication: (mention: string, isLongTerm?: boolean) => void;
  addAllergy: (mention: string) => void;
  setBasic: (patch: Partial<Pick<Person, 'ageRange' | 'sex'>>) => void;

  // ---- 全局 ----
  /** 清空当前 active person 的全部条目（保留 person 本身和 sessionId） */
  clearActivePerson: () => void;
  /** 销毁全部 people（仅保留 sessionId 重建一个空"我自己"） */
  clearAll: () => void;
}

function dedupeByMention<T extends { mention: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = item.mention.toLowerCase().trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

function nowISO(): string {
  return new Date().toISOString();
}

function mutateActive(state: ProfileState, mut: (p: Person) => void): { profile: UserProfile } {
  const next = { ...state.profile };
  next.people = state.profile.people.map((p) => {
    if (p.id !== state.profile.activePersonId) return p;
    const np = { ...p };
    mut(np);
    np.updatedAt = nowISO();
    return np;
  });
  return { profile: next };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: (() => {
        const sid = nanoid();
        const pid = nanoid();
        return emptyProfile({ sessionId: sid, selfPersonId: pid });
      })(),

      activePerson: () => {
        const p = get().profile;
        return p.people.find((x) => x.id === p.activePersonId) ?? p.people[0]!;
      },

      addPerson: (name, relation) => {
        const id = nanoid();
        set((state) => ({
          profile: {
            ...state.profile,
            people: [...state.profile.people, emptyPerson({ id, name, relation })],
            activePersonId: id, // 新加自动切到这个人
          },
        }));
        return id;
      },

      removePerson: (personId) => set((state) => {
        if (state.profile.people.length <= 1) return state; // 至少留 1 个
        const remaining = state.profile.people.filter((p) => p.id !== personId);
        const nextActive = state.profile.activePersonId === personId
          ? (remaining[0]?.id ?? '')
          : state.profile.activePersonId;
        return {
          profile: {
            ...state.profile,
            people: remaining,
            activePersonId: nextActive,
          },
        };
      }),

      renamePerson: (personId, name) => set((state) => ({
        profile: {
          ...state.profile,
          people: state.profile.people.map((p) =>
            p.id === personId ? { ...p, name: name.trim() || p.name, updatedAt: nowISO() } : p
          ),
        },
      })),

      setActivePersonId: (personId) => set((state) => {
        if (!state.profile.people.find((p) => p.id === personId)) return state;
        return { profile: { ...state.profile, activePersonId: personId } };
      }),

      applyDelta: (delta, sessionId) => set((state) => mutateActive(state, (p) => {
        const now = nowISO();
        if (delta.newConditions?.length) {
          const adds: ProfileCondition[] = delta.newConditions.map((c) => ({ slug: c.slug, mention: c.mention, firstAt: now }));
          p.conditions = dedupeByMention([...p.conditions, ...adds]);
        }
        if (delta.newMedications?.length) {
          const adds: ProfileMedication[] = delta.newMedications.map((m) => ({
            slug: m.slug, mention: m.mention, isLongTerm: m.isLongTerm, firstAt: now,
          }));
          p.medications = dedupeByMention([...p.medications, ...adds]);
        }
        if (delta.newAllergies?.length) {
          const adds: ProfileAllergy[] = delta.newAllergies.map((a) => ({ mention: a.mention, firstAt: now }));
          p.allergies = dedupeByMention([...p.allergies, ...adds]);
        }
        if (delta.newSpecialGroups?.length) {
          p.specialGroups = Array.from(new Set([...p.specialGroups, ...delta.newSpecialGroups]));
        }
        if (delta.ageRange) p.ageRange = delta.ageRange;
        if (delta.sex) p.sex = delta.sex;

        if (delta.conversationSummary) {
          const exists = p.conversationSummaries.find((s) => s.sessionId === sessionId);
          if (exists) {
            exists.summary = delta.conversationSummary.summary;
            exists.topics = delta.conversationSummary.topics;
            exists.ts = now;
          } else {
            p.conversationSummaries = [
              ...p.conversationSummaries,
              { sessionId, summary: delta.conversationSummary.summary, topics: delta.conversationSummary.topics, ts: now },
            ].slice(-10);
          }
        }
      })),

      removeCondition: (idx) => set((state) => mutateActive(state, (p) => {
        p.conditions = p.conditions.filter((_, i) => i !== idx);
      })),
      removeMedication: (idx) => set((state) => mutateActive(state, (p) => {
        p.medications = p.medications.filter((_, i) => i !== idx);
      })),
      removeAllergy: (idx) => set((state) => mutateActive(state, (p) => {
        p.allergies = p.allergies.filter((_, i) => i !== idx);
      })),
      addCondition: (mention) => set((state) => mutateActive(state, (p) => {
        p.conditions = dedupeByMention([...p.conditions, { mention, firstAt: nowISO() }]);
      })),
      addMedication: (mention, isLongTerm) => set((state) => mutateActive(state, (p) => {
        p.medications = dedupeByMention([...p.medications, { mention, isLongTerm, firstAt: nowISO() }]);
      })),
      addAllergy: (mention) => set((state) => mutateActive(state, (p) => {
        p.allergies = dedupeByMention([...p.allergies, { mention, firstAt: nowISO() }]);
      })),
      setBasic: (patch) => set((state) => mutateActive(state, (p) => {
        if ('ageRange' in patch) p.ageRange = patch.ageRange as AgeRange | undefined;
        if ('sex' in patch) p.sex = patch.sex as Sex | undefined;
      })),

      clearActivePerson: () => set((state) => mutateActive(state, (p) => {
        p.conditions = [];
        p.medications = [];
        p.allergies = [];
        p.specialGroups = [];
        p.notes = [];
        p.conversationSummaries = [];
        p.ageRange = undefined;
        p.sex = undefined;
      })),

      clearAll: () => set((state) => {
        const sid = state.profile.sessionId;
        const pid = nanoid();
        return { profile: emptyProfile({ sessionId: sid, selfPersonId: pid }) };
      }),
    }),
    {
      name: 'vitame-profile-v2',
      version: 2,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
      // 兼容老 v1 数据：v2 第一次加载时如果发现 LocalStorage 还有 v1 key，把 v1 wrap 成 v2 people[0]='我自己'
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        if (typeof window === 'undefined') return;
        if (!state) return;
        const v1Raw = window.localStorage.getItem('vitame-profile-v1');
        if (!v1Raw) return;
        // 如果 v2 已经有用户填的内容，不覆盖
        const hasMeaningfulV2 = state.profile.people.some((p) =>
          p.conditions.length > 0 || p.medications.length > 0 || p.allergies.length > 0
        );
        if (hasMeaningfulV2) return;
        try {
          const parsed = JSON.parse(v1Raw) as { state?: { profile?: UserProfileV1 } };
          const v1 = parsed?.state?.profile;
          if (!v1) return;
          const selfId = nanoid();
          const selfPerson: Person = {
            id: selfId,
            name: '我自己',
            relation: 'self',
            conditions: v1.conditions ?? [],
            medications: v1.medications ?? [],
            allergies: v1.allergies ?? [],
            specialGroups: v1.specialGroups ?? [],
            ageRange: v1.ageRange,
            sex: v1.sex,
            notes: v1.notes ?? [],
            conversationSummaries: v1.conversationSummaries ?? [],
            createdAt: v1.updatedAt ?? nowISO(),
            updatedAt: v1.updatedAt ?? nowISO(),
          };
          state.profile = {
            schemaVersion: 2,
            sessionId: v1.sessionId ?? state.profile.sessionId,
            people: [selfPerson],
            activePersonId: selfId,
          };
        } catch {
          // 解析失败就当 v1 不存在
        }
      },
    }
  )
);
