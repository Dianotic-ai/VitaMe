// file: src/lib/profile/profileInjector.ts — 把 UserProfile 序列化为 ProfileSnapshot 注入 chat 请求
//
// 关键：按相关性筛字段（CLAUDE.md §14 坑 #8 防 prompt 爆炸）
// 当前 v0.3 简化策略：
//   - conditions / medications / allergies / specialGroups 全部带（量级小，<10 条）
//   - conversationSummaries 仅取最近 3 条作为 recent_topics
//   - ageRange / sex 总是带
// 未来优化：用 query keyword 跟 conditions 做 relevance 过滤

import type { ProfileSnapshot } from '@/lib/chat/types';
import type { UserProfile } from './types';

const MAX_RECENT_TOPICS = 3;

export function profileToSnapshot(p: UserProfile): ProfileSnapshot {
  // 仅在有内容时输出对应字段（避免空数组在 prompt 里看着像"用户没病史"，反而误导 LLM）
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
