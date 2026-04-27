// file: src/components/reminder/ReminderBanner.tsx — 顶部 in-app reminder 提示
'use client';

import { useEffect, useState } from 'react';
import { useReminderStore } from '@/lib/reminder/store';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import type { AckAction, ReminderRule } from '@/lib/reminder/types';
import { CheckLineIcon, CloseLineIcon } from '@/components/brand/Icons';

export function ReminderBanner() {
  const profile = useProfileStore((s) => s.profile);
  const active = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const computeDueRules = useReminderStore((s) => s.computeDueRules);
  const ackRule = useReminderStore((s) => s.ackRule);
  const markSupplementFedback = useProfileStore((s) => s.markSupplementFedback);
  const appendEvent = useEventStore((s) => s.appendEvent);
  const hasHydrated = useReminderStore((s) => s.hasHydrated);
  const [tick, setTick] = useState(0);

  // 每分钟重算一次（浏览器内 banner，没 push）
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!hasHydrated) return null;

  const due = computeDueRules(active.id);
  if (due.length === 0) return null;

  // 每次只展示最早的一条（按 timeOfDay 升序）
  const top = [...due].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay))[0]!;
  const supplement = active.currentSupplements.find((s) => s.supplementId === top.supplementId);
  if (!supplement) return null; // 数据不一致防护

  function handleAck(action: AckAction) {
    ackRule(top.ruleId, action);
    if (action === 'taken') {
      markSupplementFedback(top.supplementId);
    }
    appendEvent({
      eventType: 'reminder',
      personId: active.id,
      entityRefs: [top.supplementId],
      tags: [action],
      metadata: {
        ruleId: top.ruleId,
        ackAction: action,
        timeOfDay: top.timeOfDay,
      },
    });
    void tick; // 强制 re-render 看下一条
  }

  return (
    <div className="bg-stream-soft border-b border-stream/30 px-4 py-2 flex items-center justify-between gap-2 animate-slide-up">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-stream">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" />
            <path d="M8 5 L 8 8 L 10.5 9.5" />
          </svg>
        </span>
        <span className="text-[12.5px] text-text-primary truncate">
          <span className="font-semibold">{top.timeOfDay}</span>
          <span className="mx-1.5 text-text-tertiary">·</span>
          该吃 <span className="font-medium text-stream">{supplement.mention}</span>
          {supplement.dosage && <span className="text-text-tertiary ml-1">{supplement.dosage}</span>}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => handleAck('taken')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stream text-white text-[11.5px] hover:bg-stream/90"
        >
          <CheckLineIcon className="w-3 h-3" />
          吃了
        </button>
        <button
          onClick={() => handleAck('snooze')}
          className="px-2 py-1 rounded-full text-text-secondary text-[11.5px] hover:bg-stream/10"
          title="今天不再提"
        >
          稍后
        </button>
        <button
          onClick={() => handleAck('skip')}
          className="p-1 rounded-full text-text-tertiary hover:text-risk-red"
          title="跳过这次"
          aria-label="跳过"
        >
          <CloseLineIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
