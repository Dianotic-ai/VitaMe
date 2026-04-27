// file: src/app/reminders/page.tsx — v0.4 D10 提醒中心
//
// 北极星 §3：用户看得见自己今天该吃什么 + 历史 / 暂停 / 降频 / 跨档案管理
// 数据：rules 来自 reminderStore；今日 ack 状态从 eventStore 的今日 reminder events 推断
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useReminderStore } from '@/lib/reminder/store';
import { useEventStore } from '@/lib/memory/eventStore';
import type { Person, Relation } from '@/lib/profile/types';
import type { ReminderRule } from '@/lib/reminder/types';
import { VitaMeLogo } from '@/components/brand/VitaMeLogo';
import { PersonMark } from '@/components/brand/PersonMark';
import { ChevronLeftLineIcon, CheckLineIcon, CloseLineIcon } from '@/components/brand/Icons';
import { ReminderRuleEditor } from '@/components/reminder/ReminderRuleEditor';

const RELATION_LABEL: Record<Relation, string> = {
  self: '我自己',
  mother: '妈妈',
  father: '爸爸',
  spouse: '伴侣',
  child: '孩子',
  other: '其他',
};

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

type TodayStatus = 'taken' | 'snoozed' | 'skipped' | 'missed' | 'pending';

interface TodayItem {
  rule: ReminderRule;
  supplementMention: string;
  supplementDosage?: string;
  status: TodayStatus;
}

function todayDow(): number {
  // 1=Mon..7=Sun
  const d = new Date();
  return ((d.getDay() + 6) % 7) + 1;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

function minsUntil(hhmm: string): number {
  return timeToMinutes(hhmm) - nowMinutes();
}

function fmtCountdown(mins: number): string {
  if (mins <= 0) return '现在';
  if (mins < 60) return `${mins} 分钟后`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} 小时后` : `${h}h ${m}m 后`;
}

export default function RemindersPage() {
  const profileHydrated = useProfileStore((s) => s.profile.people.length > 0);
  const reminderHydrated = useReminderStore((s) => s.hasHydrated);
  const eventHydrated = useEventStore((s) => s.hasHydrated);

  if (!profileHydrated || !reminderHydrated || !eventHydrated) {
    return (
      <div className="min-h-screen bg-bg-warm-2 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">载入中…</p>
      </div>
    );
  }
  return <RemindersBody />;
}

function RemindersBody() {
  const profile = useProfileStore((s) => s.profile);
  const setActivePersonId = useProfileStore((s) => s.setActivePersonId);
  const rules = useReminderStore((s) => s.rules);
  const events = useEventStore((s) => s.events);
  const [tick, setTick] = useState(0);

  // 每分钟刷新倒计时
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const active: Person =
    profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;

  // ---- 今日时间表 ----
  const dow = todayDow();
  const todayDate = new Date().toISOString().slice(0, 10);

  // 防御：v0.4 D2 之前的旧 LocalStorage 可能没 currentSupplements
  const activeSupplements = active.currentSupplements ?? [];

  const todayItems: TodayItem[] = rules
    .filter((r) => r.personId === active.id)
    .filter((r) => !r.paused)
    .filter((r) => Array.isArray(r.daysOfWeek) && r.daysOfWeek.includes(dow))
    .filter((r) => {
      if ((r.frequencyMultiplier ?? 1.0) >= 1.0) return true;
      const lastTrig = r.lastTriggeredAt ? new Date(r.lastTriggeredAt).getTime() : 0;
      const daysSince = (Date.now() - lastTrig) / (24 * 60 * 60 * 1000);
      return daysSince >= 1 / (r.frequencyMultiplier || 1.0);
    })
    .map<TodayItem>((rule) => {
      const supp = activeSupplements.find((s) => s.supplementId === rule.supplementId);
      const supplementMention = supp?.mention ?? '(已删除的保健品)';
      const supplementDosage = supp?.dosage;

      // 今日 ack 来自 reminder MemoryEvent
      const todayAck = events
        .filter((e) => e.personId === active.id && e.eventType === 'reminder')
        .filter((e) => e.occurredAt.slice(0, 10) === todayDate)
        .filter((e) => (e.metadata?.ruleId as string | undefined) === rule.ruleId)
        .filter((e) => e.tags.some((t) => ['taken', 'skip', 'snooze'].includes(t)))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];

      let status: TodayStatus;
      if (todayAck) {
        const action = todayAck.tags.find((t) => ['taken', 'skip', 'snooze'].includes(t));
        if (action === 'taken') status = 'taken';
        else if (action === 'snooze') status = 'snoozed';
        else status = 'skipped';
      } else if (timeToMinutes(rule.timeOfDay) <= nowMinutes()) {
        status = 'missed';
      } else {
        status = 'pending';
      }
      return { rule, supplementMention, supplementDosage, status };
    })
    .sort((a, b) => a.rule.timeOfDay.localeCompare(b.rule.timeOfDay));

  const takenCount = todayItems.filter((i) => i.status === 'taken').length;
  const skippedCount = todayItems.filter((i) => i.status === 'skipped').length;
  const missedCount = todayItems.filter((i) => i.status === 'missed').length;
  const pendingCount = todayItems.filter((i) => i.status === 'pending').length;

  // ---- 全部规则按 supplement 分组 ----
  const supplementsForActive = activeSupplements;
  const ruleCountByPerson = (pid: string) =>
    rules.filter((r) => r.personId === pid && !r.paused).length;

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
                <h1 className="font-serif text-base font-semibold text-text-primary leading-tight">
                  提醒中心
                </h1>
                <span className="text-[9px] font-mono font-bold text-seed bg-seed-soft px-1 py-px rounded-sm tracking-wider">
                  LOCAL
                </span>
              </div>
              <p className="text-[10.5px] text-text-tertiary mt-0.5">
                今日 {todayItems.length} 条 · 已吃 {takenCount} · 待提醒 {pendingCount}
                {missedCount > 0 && ` · 已过期 ${missedCount}`}
                {skippedCount > 0 && ` · 跳过 ${skippedCount}`}
              </p>
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
                <span
                  className={
                    isActive
                      ? 'text-white/70 text-[10.5px]'
                      : 'text-text-tertiary text-[10.5px]'
                  }
                >
                  {ruleCountByPerson(p.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-6">
        {/* 今日时间表 */}
        <section>
          <h2 className="font-serif text-[14px] font-semibold text-text-primary mb-2">
            今日时间表
            <span className="text-[11px] font-normal text-text-tertiary ml-2">
              {RELATION_LABEL[active.relation]} · {active.name}
            </span>
          </h2>

          {todayItems.length === 0 ? (
            <EmptyToday />
          ) : (
            <ul className="space-y-1.5">
              {todayItems.map((item) => (
                <TodayRow key={item.rule.ruleId} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* 全部规则 */}
        <section>
          <h2 className="font-serif text-[14px] font-semibold text-text-primary mb-2">
            全部规则
            <span className="text-[11px] font-normal text-text-tertiary ml-2">
              按保健品分组管理
            </span>
          </h2>

          {supplementsForActive.length === 0 ? (
            <div className="bg-surface border border-border-subtle rounded-card px-3 py-3 text-[12.5px] text-text-tertiary">
              {active.name} 还没添加保健品。先去{' '}
              <Link href="/profile" className="text-forest underline">
                档案
              </Link>{' '}
              加上，或者直接在{' '}
              <Link href="/chat" className="text-forest underline">
                对话
              </Link>{' '}
              里说"X 每天 X 点提醒我"。
            </div>
          ) : (
            <div className="space-y-2.5">
              {supplementsForActive.map((s) => (
                <div
                  key={s.supplementId}
                  className="bg-surface border border-border-subtle rounded-card px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-[13px] font-medium text-text-primary truncate">
                      {s.mention}
                      {s.dosage && (
                        <span className="ml-1.5 text-text-tertiary text-[11px] font-normal">
                          {s.dosage}
                        </span>
                      )}
                    </h3>
                  </div>
                  <ReminderRuleEditor
                    personId={active.id}
                    supplementId={s.supplementId}
                    supplementName={s.mention}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyToday() {
  return (
    <div className="bg-surface border border-border-subtle rounded-card px-3 py-4 text-center">
      <p className="text-[13px] text-text-secondary">今天没有提醒</p>
      <p className="text-[11px] text-text-tertiary mt-1">
        在{' '}
        <Link href="/chat" className="text-forest underline">
          对话
        </Link>{' '}
        里说"X 每天 X 点提醒我" → 自动创建
      </p>
    </div>
  );
}

function TodayRow({ item }: { item: TodayItem }) {
  const ackRule = useReminderStore((s) => s.ackRule);
  const markSupplementFedback = useProfileStore((s) => s.markSupplementFedback);
  const appendEvent = useEventStore((s) => s.appendEvent);

  function handleAck(action: 'taken' | 'skip' | 'snooze') {
    ackRule(item.rule.ruleId, action);
    if (action === 'taken') markSupplementFedback(item.rule.supplementId);
    appendEvent({
      eventType: 'reminder',
      personId: item.rule.personId,
      entityRefs: [item.rule.supplementId],
      tags: [action, 'via-reminders-page'],
      metadata: {
        ruleId: item.rule.ruleId,
        ackAction: action,
        timeOfDay: item.rule.timeOfDay,
      },
    });
  }

  const { rule, status, supplementMention, supplementDosage } = item;
  const isPast = timeToMinutes(rule.timeOfDay) <= nowMinutes();
  const countdown = !isPast ? fmtCountdown(minsUntil(rule.timeOfDay)) : null;

  // 状态视觉
  const statusConfig: Record<TodayStatus, { color: string; label: string; icon: string }> = {
    taken: { color: 'text-forest', label: '已吃', icon: '✓' },
    snoozed: { color: 'text-stream', label: '今天稍后', icon: '⏱' },
    skipped: { color: 'text-text-tertiary', label: '跳过', icon: '⊘' },
    missed: { color: 'text-disclaimer-text', label: '已过期', icon: '⚠' },
    pending: { color: 'text-text-secondary', label: '待提醒', icon: '○' },
  };
  const cfg = statusConfig[status];

  return (
    <li
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-card border',
        status === 'taken'
          ? 'bg-forest-soft/30 border-forest/20'
          : status === 'missed'
          ? 'bg-disclaimer-bg/30 border-disclaimer-border/40'
          : status === 'skipped' || status === 'snoozed'
          ? 'bg-bg-warm border-border-subtle'
          : 'bg-surface border-border-subtle',
      ].join(' ')}
    >
      <div className="shrink-0 flex flex-col items-center">
        <span className={`font-mono text-[14px] font-semibold ${status === 'taken' ? 'text-forest' : 'text-text-primary'}`}>
          {rule.timeOfDay}
        </span>
        {countdown && (
          <span className="text-[9.5px] text-text-tertiary mt-0.5">{countdown}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[13px] font-medium ${status === 'taken' ? 'text-forest' : 'text-text-primary'} truncate`}>
            {supplementMention}
          </span>
          {supplementDosage && (
            <span className="text-[10.5px] text-text-tertiary">{supplementDosage}</span>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 text-[10.5px] mt-0.5 ${cfg.color}`}>
          <span aria-hidden>{cfg.icon}</span>
          {cfg.label}
          {rule.frequencyMultiplier < 1.0 && (
            <span className="ml-1.5 text-[9px] text-disclaimer-text bg-disclaimer-bg px-1 rounded-sm">
              降频
            </span>
          )}
        </span>
      </div>

      {/* 操作：仅 missed / pending 可点 */}
      {(status === 'missed' || status === 'pending') && (
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={() => handleAck('taken')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest text-white text-[11px] hover:bg-forest-2"
          >
            <CheckLineIcon className="w-2.5 h-2.5" />
            吃了
          </button>
          {status === 'pending' && (
            <button
              onClick={() => handleAck('snooze')}
              className="px-2 py-1 rounded-full text-text-tertiary text-[11px] hover:bg-bg-warm"
              title="今天不再提"
            >
              稍后
            </button>
          )}
          <button
            onClick={() => handleAck('skip')}
            className="p-1 rounded-full text-text-tertiary hover:text-risk-red"
            aria-label="跳过"
            title="跳过这次"
          >
            <CloseLineIcon className="w-3 h-3" />
          </button>
        </div>
      )}
    </li>
  );
}
