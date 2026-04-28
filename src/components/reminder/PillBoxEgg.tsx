// file: src/components/reminder/PillBoxEgg.tsx — v0.4 D18 浮标小药盒（彩蛋入口）
//
// 视觉契约（mockup v4 + spec_lock）：
//   浮标 = 4 格胶囊小药盒（pill shape，米色 + forest 绿描边 + 棕仓盖 + 高亮金边）
//   点击 → popover 展开 → N 格按当日药数动态显示
//   每格 4 状态：upcoming(浅灰待) / due(闪烁提醒) / done(开花已吃) / missed(枯萎错过)
//   长按胶囊 1s → ack 已服用 + vibrate 微震动 + bloom 动画
//
// 数据来源：
//   - useReminderStore: rules + ackRule
//   - useProfileStore: currentSupplements 拿药名
//   - slot.ts: SLOTS / bucketSlot / isRuleAckedToday
//
// 不复用 PillBoxStrip — 那个是 4 时段抽象 strip；这个是 N 颗药动态格子
// PillBoxStrip / ReminderBanner 仍保留，待用户 verify PillBoxEgg 后再删（CLAUDE.md §17 谨慎）
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useReminderStore } from '@/lib/reminder/store';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import { bucketSlot, isRuleAckedToday } from '@/lib/reminder/slot';
import type { SlotKey } from '@/lib/reminder/slot';
import type { ReminderRule } from '@/lib/reminder/types';
import { renderBloomInline } from '@/components/brand/SeedSproutStage';

// ============================================================
//  状态计算
// ============================================================

type CellStatus = 'upcoming' | 'due' | 'done' | 'missed';

interface PillCellModel {
  rule: ReminderRule;
  supplementName: string;
  status: CellStatus;
  /** 用于排序 = timeOfDay 转分钟 */
  minutes: number;
}

const DUE_WINDOW_MIN = 60; // 到点 60 分钟内未 ack = due；之后 = missed

function timeToMinutes(timeOfDay: string): number {
  const [h, m] = timeOfDay.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

function classifyRule(rule: ReminderRule, now: Date, supplementName: string): PillCellModel {
  const ruleMin = timeToMinutes(rule.timeOfDay);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const acked = isRuleAckedToday(rule, now);

  let status: CellStatus;
  if (acked) status = 'done';
  else if (nowMin < ruleMin) status = 'upcoming';
  else if (nowMin <= ruleMin + DUE_WINDOW_MIN) status = 'due';
  else status = 'missed';

  return { rule, supplementName, status, minutes: ruleMin };
}

/** FAB 的 4 仓状态 — 同 slot 多 rule 取最严重状态 */
function aggregateSlotStatus(cells: PillCellModel[]): CellStatus | 'empty' {
  if (cells.length === 0) return 'empty';
  // 优先级：due > missed > upcoming > done
  if (cells.some((c) => c.status === 'due')) return 'due';
  if (cells.some((c) => c.status === 'missed')) return 'missed';
  if (cells.some((c) => c.status === 'upcoming')) return 'upcoming';
  return 'done';
}

// ============================================================
//  浮标 FAB SVG（4 格胶囊小药盒，pill shape）
// ============================================================

interface FabProps {
  slotStatuses: Record<SlotKey, CellStatus | 'empty'>;
  hasDue: boolean;
  dueCount: number;
  onClick: () => void;
}

function PillBoxFab({ slotStatuses, hasDue, dueCount, onClick }: FabProps) {
  const strokeColor = hasDue ? '#D4933A' : '#2D5A3D';
  // 4 仓盖 x 偏移
  const slotKeys: SlotKey[] = ['morning', 'midday', 'evening', 'bedtime'];
  const capX = [4, 22, 40, 58];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="打开药盒"
      className="relative group transition-transform hover:scale-[1.04] active:scale-[0.98]"
    >
      <svg
        viewBox="0 0 80 40"
        width="84"
        height="42"
        className={hasDue ? 'animate-glow' : ''}
        style={{ filter: hasDue ? 'drop-shadow(0 4px 12px rgba(212,147,58,.45))' : 'drop-shadow(0 3px 8px rgba(0,0,0,.12))' }}
      >
        {/* 胶囊外壳 */}
        <rect
          x="2" y="6" width="76" height="28" rx="14" ry="14"
          fill="#F5EFE3" stroke={strokeColor} strokeWidth="1.5"
        />
        <rect
          x="4" y="8" width="72" height="24" rx="12" ry="12"
          fill="none" stroke="#8B6B4A" strokeWidth="0.5" opacity="0.35"
        />
        {/* 中线高光 — 胶囊接缝感 */}
        <line x1="14" y1="20" x2="66" y2="20" stroke="rgba(255,255,255,.55)" strokeWidth="0.4" />
        {/* 4 格分隔线 */}
        <line x1="22" y1="11" x2="22" y2="29" stroke="#8B6B4A" strokeWidth="0.6" opacity="0.5" />
        <line x1="40" y1="11" x2="40" y2="29" stroke="#8B6B4A" strokeWidth="0.6" opacity="0.5" />
        <line x1="58" y1="11" x2="58" y2="29" stroke="#8B6B4A" strokeWidth="0.6" opacity="0.5" />

        {/* 4 仓盖 */}
        {slotKeys.map((key, i) => {
          const status = slotStatuses[key];
          const x = capX[i]!;
          if (status === 'empty') {
            return (
              <rect key={key} x={x} y="14" width="14" height="6" rx="3"
                    fill="#8B6B4A" stroke="#5C4A2E" strokeWidth="0.4" opacity="0.25" />
            );
          }
          if (status === 'done') {
            // 仓盖打开 + 露金点
            return (
              <g key={key} opacity="0.7">
                <g transform={`rotate(-30 ${x + 14} 18)`}>
                  <rect x={x} y="14" width="14" height="6" rx="3"
                        fill="#8B6B4A" stroke="#5C4A2E" strokeWidth="0.4" opacity="0.85" />
                </g>
                <circle cx={x + 7} cy={26} r="2.5" fill="#D4933A" opacity="0.85" />
              </g>
            );
          }
          if (status === 'due') {
            // 仓盖闪烁掀开 + 金色
            return (
              <g key={key}>
                <g style={{ transformOrigin: `${x + 14}px 17px`, animation: 'pillbox-lid-blink 1.4s ease-in-out infinite' }}>
                  <rect x={x} y="14" width="14" height="6" rx="3"
                        fill="#D4933A" stroke="#B07A28" strokeWidth="0.4" />
                </g>
                <circle cx={x + 7} cy={26} r="2.5" fill="#D4933A" />
              </g>
            );
          }
          if (status === 'missed') {
            // 仓盖灰暗
            return (
              <rect key={key} x={x} y="14" width="14" height="6" rx="3"
                    fill="#5C4A2E" stroke="#3A2E1E" strokeWidth="0.4" opacity="0.4" />
            );
          }
          // upcoming
          return (
            <rect key={key} x={x} y="14" width="14" height="6" rx="3"
                  fill="#8B6B4A" stroke="#5C4A2E" strokeWidth="0.4" />
          );
        })}
      </svg>
      {dueCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#C44A4A] text-white text-[10px] font-semibold w-4 h-4 grid place-items-center rounded-full pointer-events-none">
          {dueCount}
        </span>
      )}
    </button>
  );
}

// ============================================================
//  单颗药格子 — 含长按交互
// ============================================================

interface CellProps {
  cell: PillCellModel;
  onAck: (ruleId: string) => void;
}

const HOLD_MS = 1000;

function PillCell({ cell, onAck }: CellProps) {
  const { status, supplementName, rule } = cell;
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function startHold() {
    if (status !== 'due' && status !== 'upcoming') return; // 只有 due/upcoming 可 ack
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      // 完成
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
      onAck(rule.ruleId);
      setHolding(false);
    }, HOLD_MS);
  }

  function cancelHold() {
    clearTimer();
    setHolding(false);
  }

  useEffect(() => () => clearTimer(), []);

  const ackable = status === 'due' || status === 'upcoming';

  return (
    <div className="flex flex-col items-center">
      <div
        onPointerDown={ackable ? startHold : undefined}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        className={`relative w-full aspect-square rounded-xl grid place-items-center bg-[#FAF7F2] border border-[#E8E4DA] transition-all ${
          ackable ? 'cursor-pointer' : ''
        } ${holding ? 'scale-110' : ''}`}
        style={{ touchAction: 'none', opacity: status === 'done' ? 0.6 : status === 'missed' ? 0.5 : status === 'upcoming' ? 0.85 : 1 }}
        role={ackable ? 'button' : undefined}
        aria-label={ackable ? `按住 1 秒标记吃过 ${supplementName}` : `${supplementName} ${status}`}
        tabIndex={ackable ? 0 : -1}
      >
        {/* 蓄力进度环 */}
        {holding && (
          <svg viewBox="0 0 60 60" className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(45,90,61,.12)" strokeWidth="2.5" />
            <circle cx="30" cy="30" r="26" fill="none" stroke="#2D5A3D" strokeWidth="2.5"
                    strokeDasharray="163.36" strokeDashoffset="163.36" strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                    style={{ animation: 'pillcell-charge 1s linear forwards' }} />
          </svg>
        )}

        {/* 内容 */}
        {status === 'done' && (
          <svg viewBox="0 0 60 60" className="w-3/4 h-3/4">
            {renderBloomInline(30, 22, 8)}
          </svg>
        )}
        {status === 'missed' && (
          <svg viewBox="0 0 60 60" className="w-3/4 h-3/4">
            {/* 枯萎花 — 暗色 + 下垂 */}
            <line x1="30" y1="56" x2="33" y2="32" stroke="#5C4A2E" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            <g transform="translate(32, 26) rotate(15)" opacity="0.5">
              {[20, 95, 175, 245].map((deg) => (
                <ellipse key={deg} cx="0" cy="-7" rx="2.5" ry="5" fill="#5C4A2E" opacity="0.7" transform={`rotate(${deg})`} />
              ))}
              <circle cx="0" cy="0" r="2.5" fill="#3A2E1E" />
            </g>
          </svg>
        )}
        {(status === 'due' || status === 'upcoming') && (
          <svg viewBox="0 0 60 30" className={`w-[70%] ${status === 'due' ? 'animate-wiggle' : ''}`}>
            <ellipse
              cx="30" cy="15" rx="22" ry="8"
              fill={status === 'due' ? '#D4933A' : '#8B6B4A'}
              transform="rotate(-22 30 15)"
            />
            <line x1="20" y1="15" x2="40" y2="15"
                  stroke={status === 'due' ? 'rgba(255,255,255,.55)' : '#FAF7F2'}
                  strokeWidth="0.5"
                  transform="rotate(-22 30 15)"
                  opacity={status === 'due' ? 1 : 0.5} />
          </svg>
        )}
        {status === 'due' && (
          <span className="absolute top-1 right-1 bg-[#C44A4A] text-white text-[8.5px] font-semibold w-3.5 h-3.5 grid place-items-center rounded-full">!</span>
        )}
      </div>
      <div className="text-[10.5px] mt-1.5 text-center text-[#1A1A1A] truncate w-full font-medium" style={{ opacity: status === 'done' || status === 'missed' ? 0.6 : 1 }}>
        {supplementName}
      </div>
      <div className="text-[9.5px] text-[#8A8A8A]">{rule.timeOfDay}</div>
    </div>
  );
}

// ============================================================
//  Popover 内容
// ============================================================

interface PopoverProps {
  cells: PillCellModel[];
  nextDue: PillCellModel | null;
  hoursUntilNext: number | null;
  onAck: (ruleId: string) => void;
  onClose: () => void;
}

function PillBoxPopover({ cells, nextDue, hoursUntilNext, onAck, onClose }: PopoverProps) {
  // 按时间升序，最多 8 颗（超过堆叠 / 滚动）
  const sorted = useMemo(() => [...cells].sort((a, b) => a.minutes - b.minutes), [cells]);
  const cols = Math.min(Math.max(sorted.length, 1), 5); // 最多 5 列

  // 副文：还有 X 小时 Y 分
  let timeHint = '';
  if (nextDue && hoursUntilNext !== null) {
    if (hoursUntilNext < 0) timeHint = '已到点';
    else {
      const h = Math.floor(hoursUntilNext);
      const m = Math.round((hoursUntilNext - h) * 60);
      timeHint = h > 0 ? `还有 ${h} 小时 ${m} 分` : `还有 ${m} 分钟`;
    }
  }

  return (
    <div
      role="dialog"
      aria-label="今日药盒"
      className="rounded-2xl p-4 shadow-2xl"
      style={{
        background: '#F5EFE3',
        border: '1.5px solid #2D5A3D',
        minWidth: 280,
        maxWidth: 'min(420px, calc(100vw - 24px))',
      }}
    >
      {/* 大字标题区 */}
      {nextDue ? (
        <div className="text-center mb-4">
          <div className="text-[10.5px] tracking-[0.14em] uppercase text-[#8A8A8A]">下一颗</div>
          <div className="font-serif text-[22px] font-semibold mt-1 text-[#1A1A1A]" style={{ fontFamily: 'Georgia, "Microsoft YaHei", serif' }}>
            {nextDue.supplementName}
          </div>
          <div className="text-[12px] text-[#8A8A8A] mt-0.5">
            {nextDue.rule.timeOfDay}{timeHint ? ` · ${timeHint}` : ''}
          </div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <div className="font-serif text-[18px] font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Georgia, "Microsoft YaHei", serif' }}>
            今日已全部吃完 ✨
          </div>
        </div>
      )}

      <div className="border-t border-[#E8E4DA] my-3"></div>

      {/* N 格动态 */}
      {sorted.length === 0 ? (
        <div className="text-center text-[12px] text-[#8A8A8A] py-6">
          今日没有提醒。<br />
          想设的话，跟我说「鱼油每天 8 点提醒我」。
        </div>
      ) : (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {sorted.map((cell) => (
            <PillCell key={cell.rule.ruleId} cell={cell} onAck={onAck} />
          ))}
        </div>
      )}

      {sorted.some((c) => c.status === 'due' || c.status === 'upcoming') && (
        <div className="text-center text-[10.5px] text-[#8A8A8A] mt-4">
          按住胶囊 1 秒 · 已服用
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 rounded-full text-[#8A8A8A] hover:bg-black/5 grid place-items-center"
        aria-label="关闭"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 2 L 10 10 M 10 2 L 2 10" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================
//  主组件
// ============================================================

export function PillBoxEgg() {
  const profile = useProfileStore((s) => s.profile);
  const active = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const personId = active.id;

  const rules = useReminderStore(
    useShallow((s) => s.rules.filter((r) => r.personId === personId && !r.paused)),
  );
  const ackRule = useReminderStore((s) => s.ackRule);
  const markSupplementFedback = useProfileStore((s) => s.markSupplementFedback);
  const appendEvent = useEventStore((s) => s.appendEvent);
  const hasHydrated = useReminderStore((s) => s.hasHydrated);

  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // 每分钟刷新 now（驱动 due/missed 状态切换）
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 点击外部关闭 popover
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // 计算 cells + slot 状态 + 下一颗
  const supplementsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of active.currentSupplements ?? []) map.set(s.supplementId, s.mention);
    return map;
  }, [active.currentSupplements]);

  const cells = useMemo<PillCellModel[]>(() => {
    return rules.map((r) => classifyRule(r, now, supplementsById.get(r.supplementId) ?? '?'));
  }, [rules, now, supplementsById]);

  const slotStatuses = useMemo(() => {
    const acc: Record<SlotKey, CellStatus | 'empty'> = {
      morning: 'empty', midday: 'empty', evening: 'empty', bedtime: 'empty',
    };
    const grouped: Record<SlotKey, PillCellModel[]> = {
      morning: [], midday: [], evening: [], bedtime: [],
    };
    for (const c of cells) grouped[bucketSlot(c.rule.timeOfDay)].push(c);
    for (const k of Object.keys(grouped) as SlotKey[]) {
      acc[k] = aggregateSlotStatus(grouped[k]);
    }
    return acc;
  }, [cells]);

  const dueCount = cells.filter((c) => c.status === 'due').length;
  const hasDue = dueCount > 0;

  // 下一颗：未 done/missed 中 timeOfDay 最早的（含 due）
  const nextDue = useMemo(() => {
    const candidates = cells.filter((c) => c.status === 'due' || c.status === 'upcoming');
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => a.minutes - b.minutes)[0]!;
  }, [cells]);

  const hoursUntilNext = useMemo(() => {
    if (!nextDue) return null;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return (nextDue.minutes - nowMin) / 60;
  }, [nextDue, now]);

  function handleAck(ruleId: string) {
    const cell = cells.find((c) => c.rule.ruleId === ruleId);
    if (!cell) return;
    ackRule(ruleId, 'taken');
    markSupplementFedback(cell.rule.supplementId);
    appendEvent({
      eventType: 'reminder',
      personId,
      entityRefs: [cell.rule.supplementId],
      tags: ['taken', 'via-pillbox-egg'],
      metadata: {
        ruleId,
        ackAction: 'taken',
        timeOfDay: cell.rule.timeOfDay,
      },
    });
  }

  // SSR safe + 无 rule = 整个浮标隐藏
  if (!hasHydrated) return null;
  if (rules.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-40 pointer-events-none"
      style={{
        right: 'max(16px, env(safe-area-inset-right))',
        bottom: 'max(72px, calc(env(safe-area-inset-bottom) + 72px))', // 留出 ChatInput 高度
      }}
    >
      {/* Popover */}
      {open && (
        <div className="pointer-events-auto absolute bottom-full right-0 mb-3 relative">
          <PillBoxPopover
            cells={cells}
            nextDue={nextDue}
            hoursUntilNext={hoursUntilNext}
            onAck={handleAck}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {/* FAB */}
      <div className="pointer-events-auto">
        <PillBoxFab
          slotStatuses={slotStatuses}
          hasDue={hasDue}
          dueCount={dueCount}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      {/* 内嵌动画 keyframes */}
      <style jsx>{`
        @keyframes pillcell-charge {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
