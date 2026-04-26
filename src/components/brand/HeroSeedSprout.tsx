// file: src/components/brand/HeroSeedSprout.tsx — 空状态 hero 单线插画
// PR-PLAN.md §5.3：从种子破土到嫩芽生长的瞬间，纯单线，与 logo 一脉相承
'use client';

interface Props {
  size?: number;
  className?: string;
}

export function HeroSeedSprout({ size = 110, className }: Props) {
  return (
    <svg
      width={size}
      height={size * (136 / 170)}
      viewBox="0 0 170 136"
      fill="none"
      className={`botanical-line ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* 土壤水平线（虚） */}
      <path d="M 10 100 L 160 100" stroke="#8B6B4A" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />

      {/* 种子轮廓（地下，半埋）*/}
      <path
        d="M 85 102 C 78 102, 73 108, 75 115 C 77 122, 93 122, 95 115 C 97 108, 92 102, 85 102 Z"
        stroke="#8B6B4A"
        strokeWidth="1.4"
        fill="rgba(139,107,74,0.08)"
      />
      {/* 种子 hint 弧线 */}
      <path d="M 79 113 Q 85 111, 91 113" stroke="#8B6B4A" strokeWidth="0.9" />

      {/* 主茎从种子顶部生长 */}
      <path d="M 85 100 Q 85 80, 85 60 L 85 30" stroke="#2D5A3D" strokeWidth="1.6" />

      {/* 左叶（大）*/}
      <path
        d="M 85 60 C 70 56, 60 48, 58 38 C 70 38, 80 46, 85 60 Z"
        stroke="#2D5A3D"
        strokeWidth="1.4"
        fill="rgba(45,90,61,0.10)"
      />
      {/* 左叶脉 */}
      <path d="M 85 60 Q 75 55, 65 45" stroke="#2D5A3D" strokeWidth="0.7" opacity="0.6" />

      {/* 右叶（小，更新生）*/}
      <path
        d="M 85 50 C 96 47, 105 41, 107 32 C 96 32, 88 38, 85 50 Z"
        stroke="#2D5A3D"
        strokeWidth="1.4"
        fill="rgba(45,90,61,0.10)"
      />
      {/* 右叶脉 */}
      <path d="M 85 50 Q 94 46, 102 38" stroke="#2D5A3D" strokeWidth="0.7" opacity="0.6" />

      {/* 顶端嫩芽 */}
      <circle cx="85" cy="28" r="2.2" fill="#2D5A3D" />

      {/* 微风/水滴点缀（左下）*/}
      <circle cx="40" cy="115" r="1.2" fill="#4A90B8" opacity="0.5" />
      <circle cx="48" cy="120" r="1" fill="#4A90B8" opacity="0.4" />
      <circle cx="125" cy="118" r="1.2" fill="#4A90B8" opacity="0.5" />
    </svg>
  );
}
