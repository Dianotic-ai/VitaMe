// file: src/lib/profile/profileStore.ts — 客户端 zustand persist UserProfile
//
// CLAUDE.md §9.8: 仅 LocalStorage，永不上传服务端持久化。
// key = 'vitame-profile-v1'

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  emptyProfile,
  type ProfileDelta,
  type UserProfile,
  type ProfileCondition,
  type ProfileMedication,
  type ProfileAllergy,
} from './types';

interface ProfileState {
  profile: UserProfile;
  /** Memory extractor 抽出新事实后调用，merge 进 profile */
  applyDelta: (delta: ProfileDelta, sessionId: string) => void;
  /** 用户在 /profile 页手动操作 */
  removeCondition: (idx: number) => void;
  removeMedication: (idx: number) => void;
  removeAllergy: (idx: number) => void;
  addCondition: (mention: string) => void;
  addMedication: (mention: string, isLongTerm?: boolean) => void;
  addAllergy: (mention: string) => void;
  setBasic: (patch: Partial<Pick<UserProfile, 'ageRange' | 'sex'>>) => void;
  /** 一键清空（CLAUDE.md §9.8 硬要求） */
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

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: emptyProfile(nanoid()),

      applyDelta: (delta, sessionId) => set((state) => {
        const now = new Date().toISOString();
        const next = { ...state.profile };

        if (delta.newConditions?.length) {
          const adds: ProfileCondition[] = delta.newConditions.map((c) => ({
            slug: c.slug,
            mention: c.mention,
            firstAt: now,
          }));
          next.conditions = dedupeByMention([...next.conditions, ...adds]);
        }
        if (delta.newMedications?.length) {
          const adds: ProfileMedication[] = delta.newMedications.map((m) => ({
            slug: m.slug,
            mention: m.mention,
            isLongTerm: m.isLongTerm,
            firstAt: now,
          }));
          next.medications = dedupeByMention([...next.medications, ...adds]);
        }
        if (delta.newAllergies?.length) {
          const adds: ProfileAllergy[] = delta.newAllergies.map((a) => ({
            mention: a.mention,
            firstAt: now,
          }));
          next.allergies = dedupeByMention([...next.allergies, ...adds]);
        }
        if (delta.newSpecialGroups?.length) {
          const merged = new Set([...next.specialGroups, ...delta.newSpecialGroups]);
          next.specialGroups = Array.from(merged);
        }
        if (delta.ageRange) next.ageRange = delta.ageRange;
        if (delta.sex) next.sex = delta.sex;

        if (delta.conversationSummary) {
          const exists = next.conversationSummaries.find((s) => s.sessionId === sessionId);
          if (exists) {
            exists.summary = delta.conversationSummary.summary;
            exists.topics = delta.conversationSummary.topics;
            exists.ts = now;
          } else {
            next.conversationSummaries = [
              ...next.conversationSummaries,
              { sessionId, summary: delta.conversationSummary.summary, topics: delta.conversationSummary.topics, ts: now },
            ].slice(-10); // 仅保留最近 10 条
          }
        }

        next.updatedAt = now;
        return { profile: next };
      }),

      removeCondition: (idx) => set((state) => ({
        profile: { ...state.profile, conditions: state.profile.conditions.filter((_, i) => i !== idx), updatedAt: new Date().toISOString() },
      })),
      removeMedication: (idx) => set((state) => ({
        profile: { ...state.profile, medications: state.profile.medications.filter((_, i) => i !== idx), updatedAt: new Date().toISOString() },
      })),
      removeAllergy: (idx) => set((state) => ({
        profile: { ...state.profile, allergies: state.profile.allergies.filter((_, i) => i !== idx), updatedAt: new Date().toISOString() },
      })),
      addCondition: (mention) => set((state) => ({
        profile: {
          ...state.profile,
          conditions: dedupeByMention([...state.profile.conditions, { mention, firstAt: new Date().toISOString() }]),
          updatedAt: new Date().toISOString(),
        },
      })),
      addMedication: (mention, isLongTerm) => set((state) => ({
        profile: {
          ...state.profile,
          medications: dedupeByMention([...state.profile.medications, { mention, isLongTerm, firstAt: new Date().toISOString() }]),
          updatedAt: new Date().toISOString(),
        },
      })),
      addAllergy: (mention) => set((state) => ({
        profile: {
          ...state.profile,
          allergies: dedupeByMention([...state.profile.allergies, { mention, firstAt: new Date().toISOString() }]),
          updatedAt: new Date().toISOString(),
        },
      })),
      setBasic: (patch) => set((state) => ({
        profile: { ...state.profile, ...patch, updatedAt: new Date().toISOString() },
      })),

      clearAll: () => set((state) => ({
        // 保留 sessionId，其他全清
        profile: emptyProfile(state.profile.sessionId),
      })),
    }),
    {
      name: 'vitame-profile-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
    }
  )
);
