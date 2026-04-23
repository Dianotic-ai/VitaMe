// file: src/components/LogoMark.tsx — VitaMe 品牌主标 mark
//
// 视觉构成（用户 2026-04-23 拍板）：把 v2「种子」泪滴外壳与 v2「发芽」（土+茎+双叶）
// 叠加 — 泪滴是容器，发芽长在壳内部。隐喻：每一次提问的种子都已经在内里发芽。
//
// 与 SeedSproutStage 分工：
//   - SeedSproutStage 是「旅程 4 阶段」插画 (seed/sprout/bloom/fruit) — 产品时刻
//   - LogoMark 是这个固定形态 — 品牌身份，永远只用这一形
//
// 颜色锁死：棕轮廓 #8B5A2B + 鼠尾绿叶 #5B8469。viewBox 64×96 (与 v2 stage 同源)。
// `size` 控高度，宽度按 64:96 比例自动算 (size=32 → 宽约 21)。

import type { SVGProps } from 'react';

interface Props extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** 渲染高度 (px)。宽度按 64:96 比例自动 */
  size?: number;
}

export function LogoMark({ size = 32, className, ...rest }: Props) {
  const height = size;
  const width = Math.round((size * 64) / 96);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="VitaMe — 种子与发芽"
      className={className}
      {...rest}
    >
      {/* 泪滴种子外壳（容器） */}
      <path
        d="M 32 12 C 18 18, 14 38, 20 60 C 24 76, 40 76, 44 60 C 50 38, 46 18, 32 12 Z"
        fill="none"
        stroke="#8B5A2B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 壳内土壤主线 */}
      <path
        d="M 23 65 Q 32 63, 41 65"
        stroke="#8B5A2B"
        strokeWidth="1.0"
        fill="none"
        strokeLinecap="round"
      />
      {/* 土壤纹理点（3 短线，比 stage 版少一根，留视觉呼吸） */}
      <path d="M 25 68 L 27 68" stroke="#8B5A2B" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 31 68 L 33 68" stroke="#8B5A2B" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 37 68 L 39 68" stroke="#8B5A2B" strokeWidth="0.8" strokeLinecap="round" />

      {/* 茎 */}
      <path
        d="M 32 65 L 32 42"
        stroke="#8B5A2B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 左叶 */}
      <path
        d="M 32 50 C 26 47, 22 41, 23 33 C 29 35, 32 41, 32 50 Z"
        fill="#5B8469"
      />
      {/* 右叶 */}
      <path
        d="M 32 50 C 38 47, 42 41, 41 33 C 35 35, 32 41, 32 50 Z"
        fill="#5B8469"
      />
    </svg>
  );
}

export default LogoMark;
