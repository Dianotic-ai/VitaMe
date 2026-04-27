// file: src/components/memory/HermitButton.tsx — 触发 Hermit 周期归纳
// 在 /memory 页用，点击后调 /api/hermit，返回的 observation 写入 eventStore
'use client';

import { useState } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import { PlusLineIcon } from '@/components/brand/Icons';

interface ObservationOutput {
  observationType: 'pattern' | 'recheck' | 'reminder-adjust' | 'request-field';
  text: string;
  proposal?: string;
  basedOnEventIds?: string[];
  entityRefs?: string[];
}

export function HermitButton({ personId }: { personId: string }) {
  const profile = useProfileStore((s) => s.profile);
  const events = useEventStore((s) => s.events.filter((e) => e.personId === personId));
  const appendEvent = useEventStore((s) => s.appendEvent);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number; ts: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const person = profile.people.find((p) => p.id === personId);
  if (!person) return null;

  const hasObservation = events.some((e) => e.eventType === 'observation');

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hermit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: person?.name,
          personRelation: person?.relation,
          events: events.slice(-50).map((e) => ({
            eventType: e.eventType,
            occurredAt: e.occurredAt,
            entityRefs: e.entityRefs,
            userText: e.userText,
            agentText: e.agentText,
            tags: e.tags,
            metadata: e.metadata,
          })),
          currentSupplements: person?.currentSupplements ?? [],
        }),
      });
      const data: { observations?: ObservationOutput[]; error?: string } = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const observations = data.observations ?? [];
      let count = 0;
      for (const obs of observations) {
        appendEvent({
          eventType: 'observation',
          personId,
          entityRefs: obs.entityRefs ?? [],
          agentText: obs.text,
          tags: [obs.observationType],
          metadata: {
            observationType: obs.observationType,
            proposal: obs.proposal,
            basedOnEventIds: obs.basedOnEventIds,
            // 用户可见可确认范围（北极星 §7）— 默认 pending，等用户 accept/dismiss
            userAction: 'pending',
          },
        });
        count++;
      }
      setLastResult({ count, ts: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (events.length === 0) {
    return (
      <div className="bg-bg-warm border border-border-subtle rounded-card px-3 py-2.5 text-[12px] text-text-tertiary">
        还没有 Memory 事件 — 先聊几次 / 设几个提醒，让 Hermit 有数据可看
      </div>
    );
  }

  return (
    <div className="bg-disclaimer-bg/30 border border-disclaimer-border/50 rounded-card px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div>
          <h4 className="text-[13px] font-medium text-text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-disclaimer-text" />
            Hermit 周期归纳
          </h4>
          <p className="text-[10.5px] text-text-tertiary mt-0.5">
            扫描 {events.length} 条事件，找模式 / 提复查 / 调提醒。北极星 §6 — 不诊断不归因
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-disclaimer-text text-bg-warm text-[12px] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-2 h-2 rounded-full bg-bg-warm animate-pulse" />
              分析中…
            </>
          ) : (
            <>
              <PlusLineIcon className="w-3 h-3" />
              {hasObservation ? '再归纳一次' : '帮我看看'}
            </>
          )}
        </button>
      </div>
      {lastResult && (
        <p className="text-[11px] text-text-secondary mt-1.5">
          ✓ 上次归纳：{lastResult.count > 0 ? `产生 ${lastResult.count} 条观察` : '没找到值得说的（这是好事）'}
        </p>
      )}
      {error && <p className="text-[11px] text-risk-red mt-1.5">归纳失败：{error}</p>}
    </div>
  );
}
