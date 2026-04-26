// file: src/components/chat/ProfileBadge.tsx — chat header 上方"已注入 N 条档案"badge
//
// 让用户感知到："我的档案在被实时使用"
// 同时引导未填档案的用户去填
'use client';

import Link from 'next/link';
import type { UserProfile } from '@/lib/profile/types';

interface ProfileBadgeProps {
  profile: UserProfile;
}

export function ProfileBadge({ profile }: ProfileBadgeProps) {
  const count =
    profile.conditions.length +
    profile.medications.length +
    profile.allergies.length +
    profile.specialGroups.length +
    (profile.ageRange ? 1 : 0) +
    (profile.sex ? 1 : 0);

  if (count === 0) {
    return (
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-[11px] text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100"
      >
        📋 添加档案让推荐更准 →
      </Link>
    );
  }

  // 简短摘要：列出第一条 condition + medication（如果有）
  const summary: string[] = [];
  if (profile.conditions[0]) summary.push(profile.conditions[0].mention);
  if (profile.medications[0]) summary.push(profile.medications[0].mention);
  const more = count - summary.length;
  const text = summary.join('、') + (more > 0 ? ` +${more}` : '');

  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
      title={`已注入 ${count} 条档案条目，每次提问都会带给 AI`}
    >
      📋 已记住 {count} 条 · {text}
    </Link>
  );
}
