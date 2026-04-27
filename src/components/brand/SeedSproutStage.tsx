// file: src/components/brand/SeedSproutStage.tsx — DESIGN.md §11 四阶段品牌主角插画
//
// **完整恢复自 v0.2 git tag**（2026-04-23 用户确认稿）。
// 风格：种子棕轮廓 (#8B5A2B) + 鼠尾绿填充 (#5B8469) + 琥珀花瓣 (#D4933A 0.75)。
// 严格按 var/logo-sketches.html v2 重画，禁止改色 / 改 viewBox。
//
// 用法：<SeedSproutStage stage="seed|sprout|bloom|fruit" size={96} />
//
// PillBox 内嵌渲染请用同文件下面的 renderBloomInline()，
// 它把 BloomPaths 缩放到 (cx, cy, r) 局部坐标。

import type { SVGProps } from 'react';

export type SeedSproutStageName = 'seed' | 'sprout' | 'bloom' | 'fruit';

interface Props extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  stage: SeedSproutStageName;
  size?: number;
}

const VIEWBOX: Record<SeedSproutStageName, string> = {
  seed: '0 0 64 96',
  sprout: '0 0 80 96',
  bloom: '0 0 80 96',
  fruit: '0 0 64 96',
};

const ASPECT: Record<SeedSproutStageName, number> = {
  seed: 64 / 96,
  sprout: 80 / 96,
  bloom: 80 / 96,
  fruit: 64 / 96,
};

const ARIA_LABEL: Record<SeedSproutStageName, string> = {
  seed: '种子 — 每一次内在的提问',
  sprout: '发芽 — 在辨别与专注中看见方向',
  bloom: '开花 — 当内在一致，生命自然绽放',
  fruit: '结果 — 你的独特成为世界的礼物',
};

export function SeedSproutStage({ stage, size = 96, className, ...rest }: Props) {
  const height = size;
  const width = Math.round(size * ASPECT[stage]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={VIEWBOX[stage]}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ARIA_LABEL[stage]}
      className={className}
      {...rest}
    >
      {stage === 'seed' && <SeedPaths />}
      {stage === 'sprout' && <SproutPaths />}
      {stage === 'bloom' && <BloomPaths />}
      {stage === 'fruit' && <FruitPaths />}
    </svg>
  );
}

function SeedPaths() {
  return (
    <>
      <path
        d="M 32 12 C 18 18, 14 38, 20 60 C 24 76, 40 76, 44 60 C 50 38, 46 18, 32 12 Z"
        fill="none"
        stroke="#8B5A2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 28 30 Q 32 44, 28 58" stroke="#8B5A2B" strokeWidth="0.8" fill="none" opacity="0.5" />
    </>
  );
}

function SproutPaths() {
  return (
    <>
      <path d="M 16 76 Q 40 72, 64 76" stroke="#8B5A2B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M 18 80 L 22 80" stroke="#8B5A2B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 28 80 L 32 80" stroke="#8B5A2B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 48 80 L 52 80" stroke="#8B5A2B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 58 80 L 62 80" stroke="#8B5A2B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 40 76 L 40 38" stroke="#8B5A2B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 40 50 C 28 46, 20 36, 22 22 C 34 26, 40 38, 40 50 Z" fill="#5B8469" />
      <path d="M 40 50 C 52 46, 60 36, 58 22 C 46 26, 40 38, 40 50 Z" fill="#5B8469" />
      <path d="M 30 32 L 36 36" stroke="#FAF9F6" strokeWidth="0.8" opacity="0.6" />
      <path d="M 50 32 L 44 36" stroke="#FAF9F6" strokeWidth="0.8" opacity="0.6" />
    </>
  );
}

function BloomPaths() {
  const petalRotations = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <>
      <path
        d="M 40 88 L 40 44"
        stroke="#8B5A2B"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 40 64 C 32 60, 28 56, 30 50 C 36 52, 40 58, 40 64 Z"
        fill="#5B8469"
        opacity="0.85"
      />
      <g transform="translate(40, 32)">
        {petalRotations.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-14"
            rx="4"
            ry="9"
            fill="#D4933A"
            opacity="0.75"
            transform={deg === 0 ? undefined : `rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="4" fill="#8B5A2B" />
      </g>
    </>
  );
}

function FruitPaths() {
  return (
    <>
      <path
        d="M 32 22 C 22 24, 18 36, 18 50 C 18 70, 28 80, 32 80 C 36 80, 46 70, 46 50 C 46 36, 42 24, 32 22 Z"
        fill="none"
        stroke="#8B5A2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 32 22 L 32 14" stroke="#8B5A2B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 32 18 C 38 14, 42 12, 40 8 C 36 9, 33 13, 32 18 Z" fill="#5B8469" />
      <circle cx="32" cy="44" r="1.6" fill="#8B5A2B" />
      <circle cx="32" cy="52" r="1.6" fill="#8B5A2B" />
      <circle cx="32" cy="60" r="1.6" fill="#8B5A2B" />
    </>
  );
}

export default SeedSproutStage;

// ============================================================
//  PillBox 嵌入用：把 BloomPaths 按 (cx, cy, r) 缩放
// ============================================================
//
// v0.2 BloomPaths 用 viewBox 80x96，花心在 (40, 32)，stem 到 y=88，
// 单瓣 ellipse rx=4 ry=9 cy=-14。
//
// 这里以胶囊半径 r 为单位锚定：
//   花心高度 = cy - r * 1.95（在胶囊上方）
//   stem 从 cy - r * 0.4 到花心
//   单瓣 ry = r * 0.78（保持 v0.2 4:9 ≈ 0.44 比例 → rx = ry * 0.44）

export function renderBloomInline(cx: number, cy: number, r: number) {
  const flowerCenterY = cy - r * 1.95;
  const stemBottom = cy - r * 0.4;
  // v0.2 stem 长 44 单位、petal ry 9 单位 → ratio 4.9
  // 我这里 stem 从胶囊上方到花心 = (cy - r*0.4) - flowerCenterY = r*1.55
  // 跟 v0.2 比例对应；保持原视觉
  const petalRy = r * 0.78;
  const petalRx = petalRy * 0.44; // v0.2 4:9 ≈ 0.44
  const petalCenterOffset = -r * 1.22; // v0.2 cy=-14 / scale 9*r/9 = -1.55r → 实际放到 -1.22r 让花头不超出 cell
  const centerR = Math.max(1, r * 0.34);
  const stemStroke = Math.max(0.9, r * 0.15);
  // 中间 1 片侧叶（v0.2 paths）
  const leafCx = cx - r * 0.55;
  const leafCy = cy - r * 0.7;
  const leafW = r * 0.55;
  const leafH = r * 0.42;

  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* 茎 */}
      <line
        x1={cx}
        y1={stemBottom}
        x2={cx}
        y2={flowerCenterY + centerR * 0.5}
        stroke="#8B5A2B"
        strokeWidth={stemStroke}
        strokeLinecap="round"
      />
      {/* 1 片侧叶（左侧，鼠尾绿） */}
      <path
        d={`M ${leafCx + leafW} ${leafCy + leafH * 0.25}
            C ${leafCx} ${leafCy - leafH * 0.1},
              ${leafCx - leafW * 0.4} ${leafCy - leafH * 0.5},
              ${leafCx - leafW * 0.2} ${leafCy - leafH}
            C ${leafCx + leafW * 0.4} ${leafCy - leafH * 0.5},
              ${leafCx + leafW * 0.85} ${leafCy - leafH * 0.1},
              ${leafCx + leafW} ${leafCy + leafH * 0.25} Z`}
        fill="#5B8469"
        opacity="0.85"
      />
      {/* 8 瓣花（v0.2 琥珀 #D4933A opacity 0.75） */}
      <g transform={`translate(${cx} ${flowerCenterY})`}>
        {petalAngles.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy={petalCenterOffset}
            rx={petalRx}
            ry={petalRy}
            fill="#D4933A"
            opacity="0.75"
            transform={deg === 0 ? undefined : `rotate(${deg})`}
          />
        ))}
        {/* 花心 — v0.2 棕 #8B5A2B */}
        <circle cx="0" cy="0" r={centerR} fill="#8B5A2B" />
      </g>
    </g>
  );
}
