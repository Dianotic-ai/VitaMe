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

// ---------- 小子件：单个药丸（v0.4 D14.2 改胶囊形 + 斜放）----------

interface PillProps {
  cx: number;
  cy: number;
  r: number;
  acked: boolean;
  onClick?: () => void;
  title?: string;
}

// ---------- 开花（acked 时种子破壳长出小花，§11.1 第 3 阶段「开花」）----------

function BloomFlower({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // 茎从胶囊顶部往上 r*0.8，花心再往上 r*0.6
  const stemBottomY = cy - r * 0.5;
  const stemTopY = cy - r * 1.4;
  const flowerCenterY = cy - r * 1.95;
  const petalRx = r * 0.32;
  const petalRy = r * 0.55;
  const petalDist = r * 0.55;
  const stroke = Math.max(0.6, r * 0.13);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* 细茎（深林绿） */}
      <line
        x1={cx}
        y1={stemBottomY}
        x2={cx}
        y2={stemTopY}
        stroke={PILL_GREEN}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* 1 片侧叶 */}
      <path
        d={`M ${cx} ${cy - r * 0.95} Q ${cx + r * 0.55} ${cy - r * 1.05} ${cx + r * 0.4} ${cy - r * 0.7}`}
        stroke={PILL_GREEN}
        strokeWidth={stroke * 0.85}
        fill="none"
        strokeLinecap="round"
      />
      {/* 5 瓣花 */}
      <g transform={`translate(${cx} ${flowerCenterY})`}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy={-petalDist}
            rx={petalRx}
            ry={petalRy}
            fill={PILL_GREEN}
            opacity={0.9}
            transform={`rotate(${angle})`}
          />
        ))}
        {/* 花心 — 种子棕 */}
        <circle cx="0" cy="0" r={Math.max(0.8, r * 0.22)} fill={PILL_BROWN} />
      </g>
    </g>
  );
}

function Pill({ cx, cy, r, acked, onClick, title }: PillProps) {
  // 胶囊形 + 斜放（v0.4 D14.2 决策，覆盖 DESIGN.md §11.5「Avoid pharmaceutical capsule」契约）
  // 默认（unacked）= 种子状态的胶囊
  // acked = 胶囊变浅（壳色淡）+ 顶部破壳长出 5 瓣小花（§11.1「开花」阶段）
  const capW = r * 2.6;
  const capH = r * 1.05;
  const angleDeg = -22;
  const transform = `rotate(${angleDeg} ${cx} ${cy})`;
  const x = cx - capW / 2;
  const y = cy - capH / 2;
  const ry = capH / 2;

  return (
    <g
      style={{ cursor: onClick && !acked ? 'pointer' : 'default' }}
      onClick={onClick && !acked ? onClick : undefined}
      role={onClick && !acked ? 'button' : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <g transform={transform}>
        {/* 胶囊本体 — acked 时变浅（开过的种子壳） */}
        <rect
          x={x}
          y={y}
          width={capW}
          height={capH}
          rx={ry}
          ry={ry}
          fill={PILL_BROWN}
          opacity={acked ? 0.45 : 1}
        />
        {/* 上半淡暗调（接缝暗示） */}
        {!acked && (
          <rect
            x={x}
            y={y}
            width={capW}
            height={capH / 2}
            rx={ry}
            ry={ry}
            fill="#5C4A2E"
            opacity={0.1}
          />
        )}
        {/* 中线 */}
        <line
          x1={x + capW / 2}
          y1={y + ry * 0.45}
          x2={x + capW / 2}
          y2={y + capH - ry * 0.45}
          stroke="#FAF7F2"
          strokeWidth={0.4}
          opacity={acked ? 0.5 : 0.35}
        />
        {/* acked 时在胶囊顶部画一条小裂痕（"破壳"） */}
        {acked && (
          <path
            d={`M ${x + capW * 0.35} ${y + 0.5} L ${x + capW * 0.5} ${y - 0.3} L ${x + capW * 0.62} ${y + 0.6}`}
            stroke="#5C4A2E"
            strokeWidth={0.5}
            strokeOpacity={0.55}
            fill="none"
            strokeLinecap="round"
          />
        )}
      </g>
      {/* 花在胶囊外、不跟胶囊一起转，保持向上"长" */}
      {acked && <BloomFlower cx={cx} cy={cy} r={r} />}
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

  // v0.4 D14.3 自适应（Sunny 选 A）：只渲染有 rule 的 slot，避免单提醒下 3 格空白
  const visibleSlots = SLOTS.filter((slot) => grouped[slot.key].length > 0);
  if (visibleSlots.length === 0) return null;

  // viewBox 宽随活的 slot 数自适应；最小 160 保证单格也不太窄
  const STRIP_WIDTH = Math.max(160, visibleSlots.length * 80);

  return (
    <div
      className="bg-surface border-b border-border-subtle px-3 py-2 flex justify-center animate-slide-up"
      role="region"
      aria-label="今日服用药盒"
    >
      <svg
        width="100%"
        viewBox={`0 0 ${STRIP_WIDTH} 76`}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 360, height: STRIP_HEIGHT }}
        aria-hidden="true"
      >
        <defs>
          <SoilTexture />
        </defs>

        {visibleSlots.map((slot, i) => {
          const cellWidth = (STRIP_WIDTH - 8) / visibleSlots.length;
          const x = 4 + i * cellWidth;
          const y = 4;
          const w = cellWidth - 2;
          const h = 48;
          const slotRules = grouped[slot.key];

          return (
            <g key={slot.key}>
              {/* 格底 + 土壤纹 */}
              <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={CELL_BG} />
              <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={`url(#${SOIL_PATTERN_ID})`} />
              {/* 外框 */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill="none"
                stroke={FRAME}
                strokeWidth={1.1}
                strokeOpacity={0.7}
              />

              {/* 药丸 */}
              {renderPillsInCell({ slotRules, x, y, w, h, supplementsById, onPillClick: handlePillClick })}

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

  // v0.4 D14.3 自适应：跟 Strip 一致，只渲染有 rule 的 slot
  const visibleSlots = SLOTS.filter((slot) => grouped[slot.key].length > 0);
  if (visibleSlots.length === 0) return null;

  const FULL_WIDTH = Math.max(240, visibleSlots.length * 120);

  return (
    <div className="bg-surface rounded-[12px] p-4 shadow-elev-1 border border-border-subtle">
      <svg
        width="100%"
        viewBox={`0 0 ${FULL_WIDTH} 220`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <SoilTexture />
        </defs>

        {visibleSlots.map((slot, i) => {
          const cellWidth = (FULL_WIDTH - 16) / visibleSlots.length;
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
                strokeOpacity={0.85}
              />

              {renderPillsInCell({
                slotRules,
                x,
                y,
                w,
                h,
                supplementsById,
                onPillClick: onPillTap,
                largeMode: true,
              })}

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

  // v0.4 D14.2 改胶囊（w=2.6r, h=1.05r 横向）— r 适度放大保证可见
  const baseR = largeMode ? 11 : 7;
  const cy = y + h / 2 - (overflow > 0 ? (largeMode ? 6 : 4) : 0);

  // 1 颗居中；2 颗左右排（胶囊宽 2.6r，间距加大避免视觉重叠）
  const pills = visible.map((rule, i) => {
    const supp = supplementsById.get(rule.supplementId);
    const acked = isRuleAckedToday(rule);
    const cx =
      visible.length === 1
        ? x + w / 2
        : x + w / 2 + (i === 0 ? -baseR * 1.6 : baseR * 1.6);
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
