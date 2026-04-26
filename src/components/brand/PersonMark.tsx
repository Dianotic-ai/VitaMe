// file: src/components/brand/PersonMark.tsx — 关系签名（替代 emoji）
// PR-PLAN.md §5.5：单线植物隐喻按 relation 切换
'use client';

import type { Relation } from '@/lib/profile/types';

interface Props {
  relation: Relation;
  size?: number;
  className?: string;
}

export function PersonMark({ relation, size = 16, className }: Props) {
  const stroke = '#8B6B4A';
  const sw = 1.4;
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  };

  switch (relation) {
    case 'self':
      // 一颗成熟果实
      return (
        <svg {...props}>
          <circle cx="8" cy="9" r="4" />
          <path d="M 8 5 L 8 3 M 7 3 Q 8 1.5, 9 3" />
        </svg>
      );
    case 'mother':
      // 三瓣花（柔和）
      return (
        <svg {...props}>
          <path d="M 8 8 C 6 6, 6 4, 8 3 C 10 4, 10 6, 8 8 Z" />
          <path d="M 8 8 C 6 10, 4 10, 3 8 C 4 6, 6 6, 8 8 Z" />
          <path d="M 8 8 C 10 10, 12 10, 13 8 C 12 6, 10 6, 8 8 Z" />
        </svg>
      );
    case 'father':
      // 双叶 + 主干（稳健）
      return (
        <svg {...props}>
          <path d="M 8 14 L 8 5" />
          <path d="M 8 9 C 5 9, 4 7, 4 5 C 6 5, 8 7, 8 9 Z" />
          <path d="M 8 7 C 11 7, 12 5, 12 3 C 10 3, 8 5, 8 7 Z" />
        </svg>
      );
    case 'spouse':
      // 双心叶（共生）
      return (
        <svg {...props}>
          <path d="M 5.5 8 C 4 8, 3 6.5, 3 5 C 5 5, 6 6.5, 5.5 8 Z" />
          <path d="M 10.5 8 C 12 8, 13 6.5, 13 5 C 11 5, 10 6.5, 10.5 8 Z" />
          <path d="M 5.5 8 L 10.5 8" />
        </svg>
      );
    case 'child':
      // 小嫩芽
      return (
        <svg {...props}>
          <path d="M 8 14 L 8 8" />
          <path d="M 8 10 C 6 10, 5 8.5, 5 7 C 7 7, 8 8.5, 8 10 Z" />
        </svg>
      );
    case 'other':
    default:
      // 三点蒲公英
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="1" fill={stroke} />
          <path d="M 8 8 L 8 4 M 8 8 L 4.5 10 M 8 8 L 11.5 10" />
        </svg>
      );
  }
}
