// file: src/components/brand/PillBox.tsx — v0.4 D14 双 signature 之一：药盒×种子
//
// Kevin 设计契约（DESIGN.md §11.5 + 品牌视觉规范 §11）：
//   药盒 = 4 格容器（早/中/晚/睡前）
//   药丸 = 实心圆 = 种子（播种盘隐喻）
//
// 渲染时机：
//   - PillBoxStrip：用户保存 routine 之后（chat header 顶部）
//   - PillBoxFull：DetailDrawer "今天怎么吃"（本 commit 暂只导出，未挂载）
//   - 首访 P0（无 rule）：本组件返回 null，不渲染
//
// 视觉契约：
//   - 4 格等宽 / 外框 1.5px #2D5A3D 或 #8B6B4A
//   - 格底 #FAF7F2 + Klee 风短线 ≤8% 灰度（土壤纹理）
//   - 药丸 = 实心圆，默认 #8B6B4A，已吃过用 #2D5A3D（emphasizing growth）
//   - 标签 早/中/晚/睡前 #1C1C1C 10–12px，置于格下方
//   - 空 slot = '-'，禁止幽灵药丸
//   - 阴影 ≤6% 单层 / 容器圆角 8–12px / 药丸正圆
//   - 仅"轻拟物"：禁高光、塑料、3D、胶囊形、>4 格、渐变
'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useReminderStore } from '@/lib/reminder/store';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import {
  SLOTS,
  groupRulesBySlot,
  isRuleAckedToday,
} from '@/lib/reminder/slot';
import type { ReminderRule } from '@/lib/reminder/types';
import type { ProfileSupplement } from '@/lib/profile/types';

// ---------- 共享 token ----------

const PILL_BROWN = '#8B6B4A';
const PILL_GREEN = '#2D5A3D';
const CELL_BG = '#FAF7F2';
const FRAME = '#2D5A3D';
const LABEL = '#1C1C1C';
const SOIL_PATTERN_ID = 'pillbox-soil';

// ---------- 土壤纹理（Klee 风短线，灰度 8%）----------

function SoilTexture() {
  // 内嵌 pattern；调用方放置到 <defs>。比初版密一点 + 加 1 根曲线短茎
  // 让"种子待发芽的土地"感更强；仍守 ≤8% 灰度上限
  return (
    <pattern id={SOIL_PATTERN_ID} x="0" y="0" width="22" height="14" patternUnits="userSpaceOnUse">
      <path d="M 2 5 L 5 6" stroke="#5C4A2E" strokeOpacity="0.08" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M 8 9 L 11 8.5" stroke="#5C4A2E" strokeOpacity="0.07" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M 14 4 L 16.5 5" stroke="#5C4A2E" strokeOpacity="0.08" strokeWidth="0.65" strokeLinecap="round" />
      <path d="M 18 11 L 20 11.5" stroke="#5C4A2E" strokeOpacity="0.06" strokeWidth="0.5" strokeLinecap="round" />
      {/* 极淡曲线根须 */}
      <path d="M 3 12 Q 5 11 7 12" stroke="#5C4A2E" strokeOpacity="0.05" strokeWidth="0.45" fill="none" />
    </pattern>
  );
}

// ---------- 嫩芽（acked 时长在种子上）----------
// 简化版 §11.1 「发芽」阶段：从药丸顶部对称伸出 2 片小叶
function Sprout({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const tip = cy - r * 1.05; // 叶顶
  const stem = cy - r * 0.35; // 茎根（在药丸上方一点）
  const leaf = r * 0.7;
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* 中央细茎 */}
      <path
        d={`M ${cx} ${stem} L ${cx} ${tip + leaf * 0.3}`}
        stroke={PILL_GREEN}
        strokeWidth={Math.max(0.8, r * 0.18)}
        strokeLinecap="round"
        fill="none"
      />
      {/* 左叶 */}
      <path
        d={`M ${cx} ${tip + leaf * 0.55} Q ${cx - leaf * 0.95} ${tip + leaf * 0.05} ${cx - leaf * 0.05} ${tip - leaf * 0.05}`}
        stroke={PILL_GREEN}
        strokeWidth={Math.max(0.7, r * 0.15)}
        strokeLinecap="round"
        fill="none"
      />
      {/* 右叶 */}
      <path
        d={`M ${cx} ${tip + leaf * 0.55} Q ${cx + leaf * 0.95} ${tip + leaf * 0.05} ${cx + leaf * 0.05} ${tip - leaf * 0.05}`}
        stroke={PILL_GREEN}
        strokeWidth={Math.max(0.7, r * 0.15)}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

// ---------- 小子件：单个药丸 ----------

interface PillProps {
  cx: number;
  cy: number;
  r: number;
  acked: boolean;
  onClick?: () => void;
  title?: string;
}

function Pill({ cx, cy, r, acked, onClick, title }: PillProps) {
  // 设计契约：实心圆。默认 #8B6B4A（种子）；acked 时变 #2D5A3D（已发芽 = emphasizing growth）
  const fill = acked ? PILL_GREEN : PILL_BROWN;
  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      {/* 已吃 = 长出 2 片嫩芽（北极星 §11.1 种子→发芽阶段） */}
      {acked && <Sprout cx={cx} cy={cy} r={r} />}
    </g>
  );
}

// ---------- 共享 hook：拿当前 person 的 rules + supplements ----------

function useRoutineForActivePerson() {
  const profile = useProfileStore((s) => s.profile);
  const active = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const personId = active.id;

  const rules = useReminderStore(
    useShallow((s) => s.rules.filter((r) => r.personId === personId)),
  );
  const supplementsById = new Map<string, ProfileSupplement>();
  for (const s of active.currentSupplements ?? []) supplementsById.set(s.supplementId, s);

  return { active, personId, rules, supplementsById };
}

// ============================================================
//  PillBoxStrip — chat header 紧凑 4 格条
// ============================================================

interface StripProps {
  /** 强制隐藏（首访场景）— 即使有 rules 也不显示 */
  forceHide?: boolean;
}

const STRIP_HEIGHT = 76;

export function PillBoxStrip({ forceHide }: StripProps) {
  const { personId, rules, supplementsById } = useRoutineForActivePerson();
  const ackRule = useReminderStore((s) => s.ackRule);
  const markSupplementFedback = useProfileStore((s) => s.markSupplementFedback);
  const appendEvent = useEventStore((s) => s.appendEvent);
  const hasHydrated = useReminderStore((s) => s.hasHydrated);

  // 每分钟刷新（slot 视觉随时间无关，但 lastAckAt 跨日要重算）
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (forceHide) return null;
  if (!hasHydrated) return null;

  // 首访 P0：无 rules → 不渲染（设计契约：First-visit P0 do not render）
  const activeRules = rules.filter((r) => !r.paused);
  if (activeRules.length === 0) return null;

  const grouped = groupRulesBySlot(activeRules);

  function handlePillClick(rule: ReminderRule) {
    // 已 ack 的 → 不重复 ack
    if (isRuleAckedToday(rule)) return;
    ackRule(rule.ruleId, 'taken');
    markSupplementFedback(rule.supplementId);
    appendEvent({
      eventType: 'reminder',
      personId,
      entityRefs: [rule.supplementId],
      tags: ['taken', 'via-pillbox'],
      metadata: {
        ruleId: rule.ruleId,
        ackAction: 'taken',
        timeOfDay: rule.timeOfDay,
      },
    });
  }

  return (
    <div
      className="bg-surface border-b border-border-subtle px-3 py-2 flex justify-center animate-slide-up"
      role="region"
      aria-label="今日服用药盒"
    >
      <svg
        width="100%"
        viewBox="0 0 320 76"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 360, height: STRIP_HEIGHT }}
        aria-hidden="true"
      >
        <defs>
          <SoilTexture />
        </defs>

        {/* 容器：4 格等宽，外框 1.5px */}
        {SLOTS.map((slot, i) => {
          const cellWidth = (320 - 8) / 4; // 8px 总外边距
          const x = 4 + i * cellWidth;
          const y = 4;
          const w = cellWidth - 2;
          const h = 48;
          const slotRules = grouped[slot.key];

          return (
            <g key={slot.key}>
              {/* 格底 + 土壤纹 */}
              <rect x={x} y={y} width={w} height={h} rx={9} ry={9} fill={CELL_BG} />
              <rect x={x} y={y} width={w} height={h} rx={9} ry={9} fill={`url(#${SOIL_PATTERN_ID})`} />
              {/* 外框 */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill="none"
                stroke={slotRules.length > 0 ? FRAME : '#8B6B4A'}
                strokeWidth={slotRules.length > 0 ? 1.1 : 0.9}
                strokeOpacity={slotRules.length > 0 ? 0.7 : 0.3}
              />

              {/* 药丸 / 空占位 */}
              {slotRules.length === 0 ? (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 5}
                  textAnchor="middle"
                  fill="#8A8278"
                  fontSize="14"
                  fontFamily="sans-serif"
                >
                  -
                </text>
              ) : (
                renderPillsInCell({ slotRules, x, y, w, h, supplementsById, onPillClick: handlePillClick })
              )}

              {/* 格下标签 */}
              <text
                x={x + w / 2}
                y={y + h + 16}
                textAnchor="middle"
                fill={LABEL}
                fontSize="11"
                fontFamily="serif"
                style={{ letterSpacing: '0.05em' }}
              >
                {slot.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
//  PillBoxFull — DetailDrawer "今天怎么吃" 完整插画
// ============================================================
// 暂导出供后续 DetailDrawer 使用；本 commit 不挂载到主路径

interface FullProps {
  /** 可选回调，让父组件接管"点击药丸"行为 */
  onPillTap?: (rule: ReminderRule) => void;
}

export function PillBoxFull({ onPillTap }: FullProps) {
  const { rules, supplementsById } = useRoutineForActivePerson();
  const hasHydrated = useReminderStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;

  const activeRules = rules.filter((r) => !r.paused);
  const grouped = groupRulesBySlot(activeRules);

  return (
    <div className="bg-surface rounded-[12px] p-4 shadow-elev-1 border border-border-subtle">
      <svg width="100%" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <SoilTexture />
        </defs>

        {SLOTS.map((slot, i) => {
          const cellWidth = (480 - 16) / 4;
          const x = 8 + i * cellWidth;
          const y = 8;
          const w = cellWidth - 6;
          const h = 168;
          const slotRules = grouped[slot.key];

          return (
            <g key={slot.key}>
              <rect x={x} y={y} width={w} height={h} rx={12} ry={12} fill={CELL_BG} />
              <rect x={x} y={y} width={w} height={h} rx={12} ry={12} fill={`url(#${SOIL_PATTERN_ID})`} />
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={12}
                ry={12}
                fill="none"
                stroke={FRAME}
                strokeWidth="1.5"
                strokeOpacity={slotRules.length > 0 ? 0.85 : 0.4}
              />

              {slotRules.length === 0 ? (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 5}
                  textAnchor="middle"
                  fill="#8A8278"
                  fontSize="20"
                  fontFamily="sans-serif"
                >
                  -
                </text>
              ) : (
                renderPillsInCell({
                  slotRules,
                  x,
                  y,
                  w,
                  h,
                  supplementsById,
                  onPillClick: onPillTap,
                  largeMode: true,
                })
              )}

              <text
                x={x + w / 2}
                y={y + h + 22}
                textAnchor="middle"
                fill={LABEL}
                fontSize="13"
                fontFamily="serif"
                style={{ letterSpacing: '0.05em' }}
              >
                {slot.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
//  内部辅助：在一个 cell 内渲染药丸（自动布局 + +N 溢出）
// ============================================================

interface RenderArgs {
  slotRules: ReminderRule[];
  x: number;
  y: number;
  w: number;
  h: number;
  supplementsById: Map<string, ProfileSupplement>;
  onPillClick?: (rule: ReminderRule) => void;
  /** Full mode 用更大半径 */
  largeMode?: boolean;
}

function renderPillsInCell({
  slotRules,
  x,
  y,
  w,
  h,
  supplementsById,
  onPillClick,
  largeMode = false,
}: RenderArgs) {
  // 一个格子最多展示 2 颗药丸（设计契约 "one or two"）
  const VISIBLE_MAX = 2;
  const visible = slotRules.slice(0, VISIBLE_MAX);
  const overflow = slotRules.length - visible.length;

  const baseR = largeMode ? 14 : 8;
  const cy = y + h / 2 - (overflow > 0 ? (largeMode ? 6 : 4) : 0);

  // 1 颗居中；2 颗左右排
  const pills = visible.map((rule, i) => {
    const supp = supplementsById.get(rule.supplementId);
    const acked = isRuleAckedToday(rule);
    const cx =
      visible.length === 1
        ? x + w / 2
        : x + w / 2 + (i === 0 ? -baseR - 3 : baseR + 3);
    return (
      <Pill
        key={rule.ruleId}
        cx={cx}
        cy={cy}
        r={baseR}
        acked={acked}
        onClick={onPillClick ? () => onPillClick(rule) : undefined}
        title={`${supp?.mention ?? '?'} · ${rule.timeOfDay}${acked ? ' · 今日已吃' : ''}`}
      />
    );
  });

  const overflowChip =
    overflow > 0 ? (
      <text
        key="overflow"
        x={x + w / 2}
        y={cy + baseR + (largeMode ? 18 : 14)}
        textAnchor="middle"
        fill={LABEL}
        fontSize={largeMode ? 11 : 9}
        fontFamily="sans-serif"
        opacity={0.65}
      >
        +{overflow}
      </text>
    ) : null;

  return [...pills, overflowChip];
}
