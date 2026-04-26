// file: src/components/brand/VitaMeLogo.tsx — 品牌 logo（sole source = src/app/icon.svg）
//
// PR-PLAN.md §5.1：禁止换色 / 加渐变 / 加阴影 / 3D 化 / emoji 化
// 色固化：种子 #8B5A2B、嫩芽 #5B8469
'use client';

interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function VitaMeLogo({ size = 24, withWordmark = true, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0" aria-hidden="true">
        <path
          d="M 16 3 C 7 6, 5 16, 8 25 C 10 31, 22 31, 24 25 C 27 16, 25 6, 16 3 Z"
          fill="none"
          stroke="#8B5A2B"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M 10 22 Q 16 21, 22 22" stroke="#8B5A2B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M 16 22 L 16 14" stroke="#8B5A2B" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M 16 17 C 13 16, 11 13, 12 10 C 14 11, 16 13, 16 17 Z" fill="#5B8469" />
        <path d="M 16 17 C 19 16, 21 13, 20 10 C 18 11, 16 13, 16 17 Z" fill="#5B8469" />
      </svg>
      {withWordmark && (
        <span
          className="font-serif font-semibold text-text-primary leading-none"
          style={{ fontSize: size * 0.78, letterSpacing: '-0.005em' }}
        >
          VitaMe
        </span>
      )}
    </span>
  );
}
