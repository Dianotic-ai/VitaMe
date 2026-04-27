// file: src/components/brand/SeedStages.tsx — 北极星 §11.1 四阶段图标
//
// 种子 (seed) → 发芽 (sprout) → 开花 (bloom) → 结果 (fruit)
//
// Kevin 提供视觉参考（2026-04-27 chat 截图）:
// - 种子: 细线椭圆轮廓，种子棕
// - 发芽: 2 片小叶 + 茎 + 极淡土壤线
// - 开花: 8 瓣类向日葵，暖金花瓣 + 棕色花心 + 细茎
// - 结果: 圆果（柠檬形）+ 顶部 3 个小点 + 细茎
//
// 用途：
// - PillBox acked 状态的"开花"视觉
// - Memory 时间轴 / Hermit observation card 的阶段图示
// - 其他需要表达"判断之后生长"语义的地方

'use client';

import type { CSSProperties } from 'react';

const SEED_BROWN = '#8B6B4A';
const FOREST_GREEN = '#2D5A3D';
const SAGE_GREEN = '#5B8469';
const BLOOM_GOLD = '#C99563'; // 暖金，比 seed 棕亮一些（仅花瓣用）
const FRUIT_BROWN = '#8B6B4A';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** 是否包含底部茎 / 土壤线（适用于"独立显示"场景；嵌入 PillBox 时关闭） */
  withStem?: boolean;
}

// ---------- 1. 种子 ----------

export function SeedIcon({ size = 32, className, style, withStem = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* 种子壳 — 细椭圆轮廓 */}
      <ellipse
        cx="16"
        cy="16"
        rx="6.5"
        ry="11"
        fill="none"
        stroke={SEED_BROWN}
        strokeWidth="1.2"
        transform="rotate(-8 16 16)"
      />
      {/* 中线（壳的接缝） */}
      <path
        d="M 16 5.5 Q 16 16 16 26.5"
        stroke={SEED_BROWN}
        strokeWidth="0.7"
        strokeOpacity="0.5"
        fill="none"
        transform="rotate(-8 16 16)"
      />
      {withStem && (
        <line x1="16" y1="29" x2="16" y2="31" stroke={SEED_BROWN} strokeWidth="0.8" />
      )}
    </svg>
  );
}

// ---------- 2. 发芽 ----------

export function SproutIcon({ size = 32, className, style, withStem = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* 茎 */}
      <line x1="16" y1="14" x2="16" y2="26" stroke={FOREST_GREEN} strokeWidth="1.2" strokeLinecap="round" />
      {/* 左叶 */}
      <path
        d="M 16 14 Q 9 12 9 6 Q 13 8 16 14 Z"
        fill={SAGE_GREEN}
        stroke={FOREST_GREEN}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* 右叶 */}
      <path
        d="M 16 14 Q 23 12 23 6 Q 19 8 16 14 Z"
        fill={SAGE_GREEN}
        stroke={FOREST_GREEN}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* 叶脉（极淡） */}
      <path d="M 12 9 Q 14 11 15.5 13" stroke={FOREST_GREEN} strokeWidth="0.5" strokeOpacity="0.5" fill="none" />
      <path d="M 20 9 Q 18 11 16.5 13" stroke={FOREST_GREEN} strokeWidth="0.5" strokeOpacity="0.5" fill="none" />
      {/* 土壤线 */}
      {withStem && (
        <>
          <line x1="6" y1="26" x2="26" y2="26" stroke={SEED_BROWN} strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round" />
          <line x1="9" y1="28" x2="11" y2="28" stroke={SEED_BROWN} strokeWidth="0.6" strokeOpacity="0.4" strokeLinecap="round" />
          <line x1="13" y1="29" x2="14.5" y2="29" stroke={SEED_BROWN} strokeWidth="0.6" strokeOpacity="0.4" strokeLinecap="round" />
          <line x1="20" y1="28" x2="22" y2="28" stroke={SEED_BROWN} strokeWidth="0.6" strokeOpacity="0.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ---------- 3. 开花（PillBox acked 状态用这个） ----------

export function BloomIcon({ size = 32, className, style, withStem = true }: IconProps) {
  // 8 瓣花头 + 花心 + 茎
  const flowerCenterX = 16;
  const flowerCenterY = withStem ? 11 : 16;
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* 8 瓣 — 暖金细椭圆 */}
      {petalAngles.map((angle) => (
        <ellipse
          key={angle}
          cx={flowerCenterX}
          cy={flowerCenterY - 5.5}
          rx="2"
          ry="5"
          fill={BLOOM_GOLD}
          stroke={SEED_BROWN}
          strokeWidth="0.4"
          strokeOpacity="0.4"
          transform={`rotate(${angle} ${flowerCenterX} ${flowerCenterY})`}
        />
      ))}
      {/* 花心 — 种子棕 */}
      <circle cx={flowerCenterX} cy={flowerCenterY} r="2.2" fill={FRUIT_BROWN} />
      {/* 花心点缀小颗粒（向日葵种子感） */}
      <circle cx={flowerCenterX - 0.7} cy={flowerCenterY - 0.5} r="0.4" fill="#5C4A2E" opacity="0.5" />
      <circle cx={flowerCenterX + 0.6} cy={flowerCenterY + 0.4} r="0.4" fill="#5C4A2E" opacity="0.5" />
      {/* 茎 */}
      {withStem && (
        <line
          x1={flowerCenterX}
          y1={flowerCenterY + 2.5}
          x2={flowerCenterX}
          y2="29"
          stroke={SEED_BROWN}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ---------- 4. 结果 ----------

export function FruitIcon({ size = 32, className, style, withStem = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* 果实主体（柠檬形 — 椭圆带尖端） */}
      <path
        d="M 16 8 Q 23 11 22 18 Q 21 24 16 24 Q 11 24 10 18 Q 9 11 16 8 Z"
        fill="none"
        stroke={FRUIT_BROWN}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* 顶部 3 个小点（果实成熟纹理） */}
      <circle cx="14" cy="13" r="0.8" fill={FRUIT_BROWN} opacity="0.7" />
      <circle cx="16" cy="11" r="0.8" fill={FRUIT_BROWN} opacity="0.7" />
      <circle cx="18" cy="13" r="0.8" fill={FRUIT_BROWN} opacity="0.7" />
      {/* 茎 */}
      {withStem && (
        <line x1="16" y1="8" x2="16" y2="4" stroke={FRUIT_BROWN} strokeWidth="1" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ---------- 嵌入用：仅花头 + 茎（PillBox 内联渲染）----------
// PillBox 需要在指定 (cx, cy) 渲染开花，且尺寸由 r 控制；不能直接用上面的固定 viewBox icon。
// 这个函数返回 <g> 子节点，调用方放进自己的 SVG 即可。

export function renderBloomInline(cx: number, cy: number, r: number) {
  // 花在胶囊上方 r*1.4，尺寸跟 r 走
  const flowerCenterY = cy - r * 1.95;
  const stemBottom = cy - r * 0.5;
  const stemTop = flowerCenterY + r * 0.3;
  const petalRx = r * 0.32;
  const petalRy = r * 0.55;
  const petalDist = r * 0.55;
  const stroke = Math.max(0.6, r * 0.13);
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* 茎 */}
      <line
        x1={cx}
        y1={stemBottom}
        x2={cx}
        y2={stemTop}
        stroke={SEED_BROWN}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* 8 瓣花 */}
      <g transform={`translate(${cx} ${flowerCenterY})`}>
        {angles.map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy={-petalDist}
            rx={petalRx}
            ry={petalRy}
            fill={BLOOM_GOLD}
            stroke={SEED_BROWN}
            strokeWidth={Math.max(0.2, r * 0.04)}
            strokeOpacity={0.4}
            transform={`rotate(${angle})`}
          />
        ))}
        {/* 花心 */}
        <circle cx="0" cy="0" r={Math.max(0.9, r * 0.22)} fill={SEED_BROWN} />
      </g>
    </g>
  );
}
