// file: src/lib/profile/profileInjector.ts — 把 active Person 序列化为 ProfileSnapshot
//
// CLAUDE.md §3.5 + §14 坑 #8: profile 注入过多致 prompt 爆炸 → 仅注入 active person 的相关字段
// CLAUDE.md §9.8 + 多 person 设计：chat 注入只发当前 active person 的 snapshot，避免家人档案串扰

import type { ProfileSnapshot } from '@/lib/chat/types';
import type { Person } from './types';

const MAX_RECENT_TOPICS = 3;

export function personToSnapshot(p: Person): ProfileSnapshot {
  const snap: ProfileSnapshot = {};

  if (p.conditions.length) {
    snap.conditions = p.conditions.map((c) => ({
      slug: c.slug,
      mention: c.mention,
      firstAt: c.firstAt,
    }));
  }
  if (p.medications.length) {
    snap.medications = p.medications.map((m) => ({
      slug: m.slug,
      mention: m.mention,
      isLongTerm: m.isLongTerm,
    }));
  }
  // Codex #4: 当前在吃的保健品也要给 chat 看（避免推荐已在吃的、冲突检查时漏掉）
  const supps = p.currentSupplements ?? [];
  if (supps.length) {
    snap.currentSupplements = supps.map((s) => ({
      slug: s.slug,
      mention: s.mention,
      dosage: s.dosage,
      schedule: s.schedule,
      startedAt: s.startedAt,
    }));
  }
  if (p.allergies.length) {
    snap.allergies = p.allergies.map((a) => ({
      mention: a.mention,
      firstAt: a.firstAt,
    }));
  }
  if (p.specialGroups.length) {
    snap.specialGroups = [...p.specialGroups];
  }
  if (p.ageRange) snap.ageRange = p.ageRange;
  if (p.sex) snap.sex = p.sex;

  if (p.conversationSummaries.length) {
    const recent = [...p.conversationSummaries]
      .sort((a, b) => (a.ts < b.ts ? 1 : -1))
      .slice(0, MAX_RECENT_TOPICS);
    snap.recentTopics = recent.flatMap((s) => s.topics).slice(0, 6);
  }

  return snap;
}

/** 兼容旧名 / 旧调用点（v0.3 polish #4 之前调的是 profileToSnapshot(profile)） */
export const profileToSnapshot = personToSnapshot;
