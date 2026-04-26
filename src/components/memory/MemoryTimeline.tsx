// file: src/components/memory/MemoryTimeline.tsx — 时间轴展示 events
'use client';

import { useEventStore } from '@/lib/memory/eventStore';
import { EventCard } from './EventCard';

interface Props {
  personId: string;
}

function formatDay(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return '今天';
  if (iso === yesterday) return '昨天';
  // 同年只显示月日
  const thisYear = new Date().getFullYear();
  const d = new Date(iso);
  if (d.getFullYear() === thisYear) {
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }
  return iso;
}

export function MemoryTimeline({ personId }: Props) {
  const groupByDay = useEventStore((s) => s.groupByDay);
  const groups = groupByDay({ personId });

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-text-tertiary">还没有事件记录</p>
        <p className="text-[11px] text-text-tertiary mt-1">跟 VitaMe 聊一次补剂安全 → 这里会自动出现 verify 事件</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.date}>
          <h3 className="font-serif text-[13px] font-semibold text-text-primary mb-2 px-0.5 sticky top-[var(--sticky-top,0)] bg-bg-warm-2 py-1 z-10">
            {formatDay(group.date)}
            <span className="ml-2 text-[10.5px] text-text-tertiary font-normal font-mono">
              {String(group.events.length).padStart(2, '0')}
            </span>
          </h3>
          <div className="space-y-1.5">
            {group.events.map((ev) => (
              <EventCard key={ev.eventId} event={ev} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
