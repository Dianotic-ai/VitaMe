// file: src/components/reminder/PillBoxEgg.tsx — v0.4 D18 浮标小药盒 v2（固定 4 格状态机）
//
// 视觉契约（mockup v7）：
//   浮标 = 横排 4 格闭合小药盒（早/中/晚/睡前）
//   每格独立状态：closed(盖合) / due(弹盖露药) / sprout(嫩芽) / wither(枯芽 + 药还在)
//   全 4 格 sprout → 整盒爆开大花（庆祝）
//   点击 → popover 展开放大 4 格 + 长按 1 秒 ack + haptic + sprout-rise 动画
//
// 数据：useReminderStore.rules + currentSupplements + slot.bucketSlot + isRuleAckedToday
// 风格：SVG fine-line（Klee 风），不模拟水彩；保留 forest 绿主色
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useReminderStore } from '@/lib/reminder/store';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import { SLOTS, bucketSlot, isRuleAckedToday } from '@/lib/reminder/slot';
import type { SlotKey, SlotMeta } from '@/lib/reminder/slot';
import type { ReminderRule } from '@/lib/reminder/types';

// ============================================================
//  状态计算
// ============================================================

type SlotStatus = 'empty' | 'closed' | 'due' | 'sprout' | 'wither';
const DUE_GRACE_MIN = 60;

interface SlotState {
  meta: SlotMeta;
  rules: ReminderRule[];
  status: SlotStatus;
  ackedCount: number;
  totalCount: number;
}

function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function ruleMinutes(rule: ReminderRule): number {
  const [h, m] = rule.timeOfDay.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

/** 计算单个 slot 状态：依据该 slot 内所有 rule 的时间和 ack 情况。 */
function computeSlotState(meta: SlotMeta, rules: ReminderRule[], now: Date): SlotState {
  const acked = rules.filter((r) => isRuleAckedToday(r, now));
  const ackedCount = acked.length;
  const totalCount = rules.length;

  if (totalCount === 0) {
    return { meta, rules, status: 'empty', ackedCount: 0, totalCount: 0 };
  }
  if (ackedCount === totalCount) {
    return { meta, rules, status: 'sprout', ackedCount, totalCount };
  }

  // 还有未 ack 的 — 看该 slot 内最早的未 ack rule 是否到点
  const unacked = rules.filter((r) => !isRuleAckedToday(r, now));
  const earliestUnackedMin = Math.min(...unacked.map(ruleMinutes));
  const cur = nowMinutes(now);

  if (cur < earliestUnackedMin) {
    return { meta, rules, status: 'closed', ackedCount, totalCount };
  }
  if (cur <= earliestUnackedMin + DUE_GRACE_MIN) {
    return { meta, rules, status: 'due', ackedCount, totalCount };
  }
  return { meta, rules, status: 'wither', ackedCount, totalCount };
}

// ============================================================
//  SVG 资产 — fine-line Klee 风，复刻 mockup v7
// ============================================================

const COLOR = {
  shellCream: '#F5EFE3',
  seed: '#8B6B4A',
  seedDark: '#5C4A2E',
  leaf: '#5B8469',
  leafLight: '#7BA289',
  amber: '#D4933A',
  amberSoft: '#E8C078',
  soil: '#8B6B4A',
  witherTan: '#9C8A55',
  grayCap: '#B8B0A0',
  petalCream: '#F5D9C4',
  petalPink: '#E8B8A0',
  warning: '#C44A4A',
  forest: '#2D5A3D',
};

/** 单格 SVG（约 100×100 viewBox），按 status 渲染对应内容。 */
function CellSvg({ status, sizeClass = 'w-3/4 h-3/4' }: { status: SlotStatus; sizeClass?: string }) {
  if (status === 'empty') {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <rect x="14" y="40" width="72" height="42" rx="8" stroke={COLOR.grayCap} strokeWidth="1" fill={COLOR.shellCream} opacity="0.4"/>
        <rect x="18" y="32" width="64" height="14" rx="6" stroke={COLOR.grayCap} strokeWidth="1" fill={COLOR.shellCream} opacity="0.4"/>
      </svg>
    );
  }
  if (status === 'closed') {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <rect x="14" y="40" width="72" height="42" rx="8" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream}/>
        <rect x="18" y="32" width="64" height="14" rx="6" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream}/>
        <path d="M 50 39 a 3.5 3.5 0 1 1 -1.5 -3 a 2.5 2.5 0 1 0 1.5 3 z" fill={COLOR.seed} opacity="0.55"/>
      </svg>
    );
  }
  if (status === 'due') {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <rect x="14" y="40" width="72" height="42" rx="8" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream}/>
        <g style={{ transformOrigin: 'bottom right', animation: 'pillbox-lid-pop 1.6s ease-in-out infinite' }}>
          <rect x="18" y="32" width="64" height="14" rx="6" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream}/>
          <path d="M 50 39 a 3.5 3.5 0 1 1 -1.5 -3 a 2.5 2.5 0 1 0 1.5 3 z" fill={COLOR.seed} opacity="0.55"/>
        </g>
        <g transform="rotate(-22 50 62)">
          <rect x="34" y="58" width="32" height="10" rx="5" stroke={COLOR.amber} strokeWidth="1.4" fill={COLOR.amberSoft}/>
          <line x1="50" y1="60" x2="50" y2="66" stroke={COLOR.amber} strokeWidth="0.7" opacity="0.55"/>
        </g>
      </svg>
    );
  }
  if (status === 'sprout') {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <rect x="14" y="40" width="72" height="42" rx="8" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream}/>
        <path d="M 18 64 Q 30 60, 50 62 T 82 64" stroke={COLOR.seed} strokeWidth="0.8" opacity="0.5" fill="none"/>
        <ellipse cx="50" cy="74" rx="30" ry="6" fill={COLOR.soil} opacity="0.3"/>
        <g style={{ transformOrigin: '50px 64px', animation: 'pillbox-sprout-rise 1s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
          <path d="M 50 64 Q 49 50 50 36" stroke={COLOR.leaf} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          <path d="M 50 42 C 42 38 38 30 40 24 C 46 28 50 36 50 42 Z" fill={COLOR.leaf} opacity="0.85"/>
          <path d="M 50 42 C 58 38 62 30 60 24 C 54 28 50 36 50 42 Z" fill={COLOR.leafLight} opacity="0.85"/>
        </g>
      </svg>
    );
  }
  // wither
  return (
    <svg viewBox="0 0 100 100" className={sizeClass}>
      <rect x="14" y="40" width="72" height="42" rx="8" stroke={COLOR.seed} strokeWidth="1.4" fill={COLOR.shellCream} opacity="0.85"/>
      <path d="M 18 64 Q 30 60, 50 62 T 82 64" stroke={COLOR.witherTan} strokeWidth="0.7" opacity="0.5" fill="none"/>
      <ellipse cx="50" cy="74" rx="30" ry="6" fill={COLOR.witherTan} opacity="0.25"/>
      <path d="M 30 70 L 33 75 M 64 72 L 68 76" stroke={COLOR.witherTan} strokeWidth="0.5" opacity="0.5"/>
      <path d="M 38 64 Q 40 56 44 50" stroke={COLOR.witherTan} strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M 44 50 C 38 50 35 46 37 42" stroke={COLOR.witherTan} strokeWidth="1" fill="none" opacity="0.65"/>
      <path d="M 37 42 C 41 46 42 48 44 50" stroke={COLOR.witherTan} strokeWidth="1" fill="none" opacity="0.65"/>
      <g transform="rotate(15 65 70)" opacity="0.7">
        <rect x="55" y="66" width="22" height="7" rx="3.5" stroke={COLOR.amber} strokeWidth="1.1" fill={COLOR.amberSoft}/>
      </g>
    </svg>
  );
}

/** 浮标 SVG — 横排 4 格，每格按 status 渲染（小尺寸版本） */
function FabSvg({ slotStates, allBloom }: { slotStates: SlotState[]; allBloom: boolean }) {
  if (allBloom) {
    return (
      <svg viewBox="0 0 200 70" width="160" height="56" style={{ overflow: 'visible' }}>
        <rect x="3" y="34" width="194" height="34" rx="6" stroke={COLOR.seed} strokeWidth="1.2" fill={COLOR.shellCream}/>
        <ellipse cx="30" cy="58" rx="14" ry="4" fill={COLOR.soil} opacity="0.45"/>
        <ellipse cx="78" cy="58" rx="14" ry="4" fill={COLOR.soil} opacity="0.45"/>
        <ellipse cx="126" cy="58" rx="14" ry="4" fill={COLOR.soil} opacity="0.45"/>
        <ellipse cx="174" cy="58" rx="14" ry="4" fill={COLOR.soil} opacity="0.45"/>
        <path d="M 100 54 Q 102 36 100 16" stroke={COLOR.leaf} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        <path d="M 100 36 C 90 32 82 26 80 20 C 90 24 100 30 100 36 Z" fill={COLOR.leaf} opacity="0.85"/>
        <path d="M 100 46 C 110 42 118 36 120 30 C 110 34 100 40 100 46 Z" fill={COLOR.leafLight} opacity="0.85"/>
        <g transform="translate(100 16)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d, i) => (
            <ellipse key={d} cx="0" cy="-9" rx="5" ry="11"
              fill={i % 2 === 0 ? COLOR.petalCream : COLOR.petalPink}
              opacity={i % 2 === 0 ? 0.9 : 0.78}
              transform={d === 0 ? undefined : `rotate(${d})`}
            />
          ))}
          <circle cx="0" cy="0" r="4" fill={COLOR.amber}/>
          <circle cx="0" cy="0" r="2.2" fill={COLOR.seedDark}/>
        </g>
      </svg>
    );
  }

  // 普通 4 格视图
  const slotXs = [8, 56, 104, 152];
  return (
    <svg viewBox="0 0 200 60" width="140" height="42">
      <rect x="3" y="14" width="194" height="40" rx="6" stroke={COLOR.seed} strokeWidth="1.2" fill={COLOR.shellCream}/>
      {slotStates.map((slot, i) => {
        const x = slotXs[i]!;
        const lidX = x;
        const lidY = 9;
        const cy = 36;
        const status = slot.status;

        if (status === 'empty') {
          return (
            <g key={slot.meta.key} opacity="0.35">
              <rect x={lidX} y={lidY} width="44" height="12" rx="5" stroke={COLOR.grayCap} strokeWidth="1" fill={COLOR.shellCream}/>
            </g>
          );
        }
        if (status === 'closed') {
          return (
            <g key={slot.meta.key}>
              <rect x={lidX} y={lidY} width="44" height="12" rx="5" stroke={COLOR.seed} strokeWidth="1.1" fill={COLOR.shellCream}/>
              <path d={`M ${x + 22} ${lidY + 7} a 2.5 2.5 0 1 1 -1 -2 a 1.7 1.7 0 1 0 1 2 z`} fill={COLOR.seed} opacity="0.55"/>
            </g>
          );
        }
        if (status === 'due') {
          return (
            <g key={slot.meta.key}>
              <g style={{ transformOrigin: `${x + 44}px ${lidY + 12}px`, animation: 'pillbox-lid-pop 1.6s ease-in-out infinite' }}>
                <rect x={lidX} y={lidY} width="44" height="12" rx="5" stroke={COLOR.amber} strokeWidth="1.2" fill={COLOR.shellCream}/>
              </g>
              <g transform={`rotate(-15 ${x + 22} ${cy})`}>
                <rect x={x + 10} y={cy - 4} width="24" height="8" rx="4" stroke={COLOR.amber} strokeWidth="1.1" fill={COLOR.amberSoft}/>
              </g>
            </g>
          );
        }
        if (status === 'sprout') {
          return (
            <g key={slot.meta.key}>
              <ellipse cx={x + 22} cy={cy + 6} rx="14" ry="3" fill={COLOR.soil} opacity="0.35"/>
              <path d={`M ${x + 22} ${cy + 4} Q ${x + 21} ${cy - 4} ${x + 22} ${cy - 12}`} stroke={COLOR.leaf} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
              <path d={`M ${x + 22} ${cy - 8} C ${x + 17} ${cy - 10} ${x + 14} ${cy - 14} ${x + 15} ${cy - 18} C ${x + 19} ${cy - 16} ${x + 22} ${cy - 12} ${x + 22} ${cy - 8} Z`} fill={COLOR.leaf} opacity="0.85"/>
              <path d={`M ${x + 22} ${cy - 8} C ${x + 27} ${cy - 10} ${x + 30} ${cy - 14} ${x + 29} ${cy - 18} C ${x + 25} ${cy - 16} ${x + 22} ${cy - 12} ${x + 22} ${cy - 8} Z`} fill={COLOR.leafLight} opacity="0.85"/>
            </g>
          );
        }
        // wither
        return (
          <g key={slot.meta.key} opacity="0.85">
            <ellipse cx={x + 22} cy={cy + 6} rx="14" ry="3" fill={COLOR.witherTan} opacity="0.3"/>
            <path d={`M ${x + 14} ${cy + 4} Q ${x + 17} ${cy - 2} ${x + 20} ${cy - 6}`} stroke={COLOR.witherTan} strokeWidth="1" fill="none" opacity="0.7"/>
            <path d={`M ${x + 20} ${cy - 6} C ${x + 15} ${cy - 6} ${x + 12} ${cy - 9} ${x + 14} ${cy - 12}`} stroke={COLOR.witherTan} strokeWidth="0.9" fill="none" opacity="0.65"/>
            <g transform={`rotate(15 ${x + 32} ${cy + 4})`} opacity="0.6">
              <rect x={x + 24} y={cy} width="16" height="6" rx="3" stroke={COLOR.amber} strokeWidth="0.9" fill={COLOR.amberSoft}/>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
//  长按交互单元
// ============================================================

interface PillButtonProps {
  rule: ReminderRule;
  supplementName: string;
  ackable: boolean;
  onAck: () => void;
}

const HOLD_MS = 1000;

function HoldablePill({ rule, supplementName, ackable, onAck }: PillButtonProps) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function start() {
    if (!ackable || completedRef.current) return;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      completedRef.current = true;
      try { navigator.vibrate?.(15); } catch { /* ignore */ }
      onAck();
      setHolding(false);
    }, HOLD_MS);
  }

  function cancel() {
    clearTimer();
    setHolding(false);
  }

  useEffect(() => () => clearTimer(), []);

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all w-full ${
        ackable ? 'cursor-pointer hover:bg-bg-warm-2' : 'cursor-default opacity-70'
      } ${holding ? 'scale-[1.04]' : ''}`}
      style={{ touchAction: 'none' }}
      aria-label={ackable ? `按住 1 秒标记吃过 ${supplementName}` : supplementName}
    >
      {/* 蓄力进度环 */}
      {holding && (
        <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full pointer-events-none">
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(45,90,61,.15)" strokeWidth="2"/>
          <circle cx="30" cy="30" r="26" fill="none" stroke={COLOR.forest} strokeWidth="2"
                  strokeDasharray="163.36" strokeDashoffset="163.36" strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                  style={{ animation: 'pillbox-hold-charge 1s linear forwards' }}/>
        </svg>
      )}
      <svg viewBox="0 0 60 30" width="40" height="20">
        <ellipse cx="30" cy="15" rx="22" ry="8" fill={COLOR.amberSoft} stroke={COLOR.amber} strokeWidth="1.4" transform="rotate(-22 30 15)"/>
      </svg>
      <span className="text-[10.5px] text-text-primary font-medium truncate max-w-full">{supplementName}</span>
      <span className="text-[9.5px] text-text-tertiary">{rule.timeOfDay}</span>
    </button>
  );
}

// ============================================================
//  Popover — 4 格大版 + 大花庆祝
// ============================================================

interface PopoverProps {
  slotStates: SlotState[];
  allBloom: boolean;
  supplementsById: Map<string, string>;
  onAck: (ruleId: string) => void;
  onClose: () => void;
}

function PillBoxPopover({ slotStates, allBloom, supplementsById, onAck, onClose }: PopoverProps) {
  return (
    <div
      role="dialog"
      aria-label="今日药盒"
      className="rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: COLOR.shellCream,
        border: `1.5px solid ${COLOR.forest}`,
        minWidth: 280,
        width: 'min(420px, calc(100vw - 24px))',
      }}
    >
      <div className="px-5 pt-5 pb-4">
        {/* 标题 */}
        {allBloom ? (
          <div className="text-center">
            <div className="text-[10.5px] tracking-widest uppercase text-text-tertiary">today complete</div>
            <div
              className="font-semibold mt-2 text-[22px]"
              style={{ fontFamily: 'Georgia, "Microsoft YaHei", serif', color: COLOR.forest }}
            >
              今日完成 ✦
            </div>
            <div className="text-[11.5px] text-text-tertiary mt-1">明天见</div>
            <div className="my-3 grid place-items-center">
              <FabSvg slotStates={slotStates} allBloom />
            </div>
          </div>
        ) : (
          <div className="text-center mb-3">
            <div className="text-[10.5px] tracking-widest uppercase text-text-tertiary">今日</div>
            <div
              className="font-semibold mt-1 text-[18px]"
              style={{ fontFamily: 'Georgia, "Microsoft YaHei", serif' }}
            >
              4 时段药盒
            </div>
          </div>
        )}

        {/* 4 格大版 */}
        {!allBloom && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {slotStates.map((slot) => (
              <div key={slot.meta.key} className="flex flex-col items-center">
                <div
                  className="w-full aspect-square rounded-xl bg-white grid place-items-center"
                  style={{
                    border: `1px solid ${slot.status === 'due' ? COLOR.amber : '#E8E4DA'}`,
                    boxShadow: slot.status === 'due' ? `0 0 0 1px ${COLOR.amber}` : 'none',
                    opacity: slot.status === 'empty' ? 0.4 : 1,
                  }}
                >
                  <CellSvg status={slot.status} sizeClass="w-[70%] h-[70%]" />
                </div>
                <div className="text-[10.5px] mt-1.5 text-text-primary font-medium">{slot.meta.label}</div>
                <div className="text-[9.5px] text-text-tertiary">
                  {slot.totalCount > 0 ? `${slot.ackedCount}/${slot.totalCount}` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 该 ack 的 rule list */}
        {!allBloom && slotStates.some((s) => s.status === 'due') && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <div className="text-[10.5px] uppercase tracking-widest text-text-tertiary mb-2">现在该吃</div>
            <div className="space-y-1">
              {slotStates.flatMap((slot) =>
                slot.status === 'due'
                  ? slot.rules
                      .filter((r) => !isRuleAckedToday(r))
                      .map((r) => (
                        <HoldablePill
                          key={r.ruleId}
                          rule={r}
                          supplementName={supplementsById.get(r.supplementId) ?? '?'}
                          ackable
                          onAck={() => onAck(r.ruleId)}
                        />
                      ))
                  : []
              )}
            </div>
            <div className="text-center text-[10.5px] text-text-tertiary mt-2">按住胶囊 1 秒 · 已服用</div>
          </div>
        )}

        {!allBloom && slotStates.every((s) => s.status !== 'due' && s.status !== 'wither') && slotStates.some((s) => s.totalCount > 0) && (
          <div className="text-center text-[11px] text-text-tertiary mt-3">下一颗等会儿见</div>
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 rounded-full text-text-tertiary hover:bg-black/5 grid place-items-center"
        aria-label="关闭"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 2 L 10 10 M 10 2 L 2 10"/>
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

  // 每分钟刷新（驱动 due/wither 跨界切换）
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 点外关闭 popover
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const supplementsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of active.currentSupplements ?? []) map.set(s.supplementId, s.mention);
    return map;
  }, [active.currentSupplements]);

  // 4 个 slot 各自的 state
  const slotStates = useMemo<SlotState[]>(() => {
    const grouped: Record<SlotKey, ReminderRule[]> = { morning: [], midday: [], evening: [], bedtime: [] };
    for (const r of rules) grouped[bucketSlot(r.timeOfDay)].push(r);
    return SLOTS.map((meta) => computeSlotState(meta, grouped[meta.key], now));
  }, [rules, now]);

  // 派生：是否有 due / 是否全 sprout / 计数
  const dueCount = slotStates.filter((s) => s.status === 'due').length;
  const hasDue = dueCount > 0;
  // 全部 active slot 都已 sprout（empty 不算）
  const activeSlots = slotStates.filter((s) => s.totalCount > 0);
  const allBloom = activeSlots.length > 0 && activeSlots.every((s) => s.status === 'sprout');

  function handleAck(ruleId: string) {
    const slot = slotStates.find((s) => s.rules.some((r) => r.ruleId === ruleId));
    const rule = slot?.rules.find((r) => r.ruleId === ruleId);
    if (!rule) return;
    ackRule(ruleId, 'taken');
    markSupplementFedback(rule.supplementId);
    appendEvent({
      eventType: 'reminder',
      personId,
      entityRefs: [rule.supplementId],
      tags: ['taken', 'via-pillbox-egg'],
      metadata: { ruleId, ackAction: 'taken', timeOfDay: rule.timeOfDay },
    });
  }

  if (!hasHydrated) return null;
  if (rules.length === 0) return null; // 没 rule 不可见

  return (
    <div
      ref={containerRef}
      className="fixed z-40 pointer-events-none"
      style={{
        right: 'max(16px, env(safe-area-inset-right))',
        bottom: 'max(72px, calc(env(safe-area-inset-bottom) + 72px))',
      }}
    >
      {open && (
        <div className="pointer-events-auto absolute bottom-full right-0 mb-3">
          <PillBoxPopover
            slotStates={slotStates}
            allBloom={allBloom}
            supplementsById={supplementsById}
            onAck={handleAck}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="打开药盒"
        className="pointer-events-auto relative transition-transform hover:scale-[1.04] active:scale-[0.98]"
        style={{
          filter: hasDue ? 'drop-shadow(0 4px 14px rgba(212,147,58,.4))' : 'drop-shadow(0 3px 8px rgba(0,0,0,.1))',
        }}
      >
        <FabSvg slotStates={slotStates} allBloom={allBloom} />
        {dueCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#C44A4A] text-white text-[10px] font-semibold w-4 h-4 grid place-items-center rounded-full pointer-events-none">
            {dueCount}
          </span>
        )}
      </button>
    </div>
  );
}
