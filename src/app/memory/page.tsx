// file: src/app/memory/page.tsx — Memory 时间轴页（北极星 §5）
'use client';

import Link from 'next/link';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import type { Person, Relation } from '@/lib/profile/types';
import { VitaMeLogo } from '@/components/brand/VitaMeLogo';
import { PersonMark } from '@/components/brand/PersonMark';
import { ChevronLeftLineIcon, TrashLineIcon } from '@/components/brand/Icons';
import { MemoryTimeline } from '@/components/memory/MemoryTimeline';
import { HermitButton } from '@/components/memory/HermitButton';

const RELATION_LABEL: Record<Relation, string> = {
  self: '我自己',
  mother: '妈妈',
  father: '爸爸',
  spouse: '伴侣',
  child: '孩子',
  other: '其他',
};

export default function MemoryPage() {
  const profile = useProfileStore((s) => s.profile);
  const setActivePersonId = useProfileStore((s) => s.setActivePersonId);
  const hasHydrated = useEventStore((s) => s.hasHydrated);
  const events = useEventStore((s) => s.events);
  const removeByPerson = useEventStore((s) => s.removeByPerson);

  const active: Person = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;

  const eventCountForActive = events.filter((e) => e.personId === active.id).length;

  function handleClearActive() {
    if (window.confirm(`清空 "${active.name}" 的全部事件记录？该操作不可撤回。`)) {
      removeByPerson(active.id);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-bg-warm-2 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">载入中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-warm-2 pb-20">
      <header className="bg-surface border-b border-border-subtle px-4 py-2.5 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
              aria-label="返回对话"
            >
              <ChevronLeftLineIcon className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-base font-semibold text-text-primary leading-tight">Memory 时间轴</h1>
                <span className="text-[9px] font-mono font-bold text-seed bg-seed-soft px-1 py-px rounded-sm tracking-wider">
                  LOCAL
                </span>
              </div>
              <p className="text-[10.5px] text-text-tertiary mt-0.5">{eventCountForActive} 条事件 · 仅存本机</p>
            </div>
          </div>
          <VitaMeLogo size={20} withWordmark={false} />
        </div>
      </header>

      {/* Person tabs */}
      <div className="bg-surface border-b border-border-subtle px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {profile.people.map((p) => {
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePersonId(p.id)}
                className={
                  isActive
                    ? 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest text-white text-[12.5px]'
                    : 'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-warm border border-border-subtle text-text-secondary text-[12.5px]'
                }
              >
                <PersonMark
                  relation={p.relation}
                  size={14}
                  className={isActive ? '[&_path]:stroke-white [&_circle]:fill-white' : ''}
                />
                <span>{p.name}</span>
                <span className={isActive ? 'text-white/70 text-[10.5px]' : 'text-text-tertiary text-[10.5px]'}>
                  {events.filter((e) => e.personId === p.id).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4" style={{ ['--sticky-top' as string]: '94px' }}>
        <HermitButton personId={active.id} />

        <MemoryTimeline personId={active.id} />

        {eventCountForActive > 0 && (
          <div className="mt-8 pt-4 border-t border-border-subtle">
            <button
              onClick={handleClearActive}
              className="flex items-center gap-1.5 text-[12px] text-risk-red/80 hover:text-risk-red"
            >
              <TrashLineIcon className="w-3.5 h-3.5" />
              清空 "{active.name}" 的全部事件
            </button>
            <p className="text-[10.5px] text-text-tertiary mt-2">
              {RELATION_LABEL[active.relation]}的事件流不可撤回；profile 字段不受影响（在 /profile 单独清理）
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
