// file: src/components/chat/PersonSwitcher.tsx — chat header 触发器（pill 风格）
// PR-PLAN.md §3.5：trigger only，sheet 由 PersonSwitcherSheet 实现
'use client';

import { useState } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import { PersonMark } from '@/components/brand/PersonMark';
import { ChevronDownLineIcon } from '@/components/brand/Icons';
import { PersonSwitcherSheet } from './PersonSwitcherSheet';

export function PersonSwitcher() {
  const profile = useProfileStore((s) => s.profile);
  const active = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-seed-soft border border-seed/30 text-[12px] hover:bg-seed-soft/80 transition-colors"
        title="切换咨询对象（每人独立健康档案）"
      >
        <PersonMark relation={active.relation} size={16} />
        <span className="text-text-primary font-medium">{active.name}</span>
        <ChevronDownLineIcon className="w-2.5 h-2.5 text-text-tertiary" />
      </button>
      {open && <PersonSwitcherSheet onClose={() => setOpen(false)} />}
    </>
  );
}
