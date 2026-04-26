// file: src/components/brand/Icons.tsx — 单线 icon 库（替代所有 emoji）
// PR-PLAN.md §5.2 落地。统一 viewBox 16x16 / strokeWidth 1.4 / 1 个 path
'use client';

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 16,
  height: 16,
  'aria-hidden': true,
};

export function ChevronDownLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3.5 6 L8 10.5 L12.5 6" />
    </svg>
  );
}

export function ChevronRightLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M6 3.5 L10.5 8 L6 12.5" />
    </svg>
  );
}

export function ChevronLeftLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M10 3.5 L5.5 8 L10 12.5" />
    </svg>
  );
}

export function InfoLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7 L8 11 M8 5 L8 5.01" />
    </svg>
  );
}

export function CheckLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 8.5 L6.5 12 L13 5" />
    </svg>
  );
}

export function PlusLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M8 3 L8 13 M3 8 L13 8" />
    </svg>
  );
}

export function DotsLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 8 L3 8.01 M8 8 L8 8.01 M13 8 L13 8.01" />
    </svg>
  );
}

export function TrashLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 4 L13 4 M5.5 4 L5.5 2.5 L10.5 2.5 L10.5 4 M4.5 4 L5.5 13.5 L10.5 13.5 L11.5 4" />
    </svg>
  );
}

export function ArrowUpLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M8 13 L8 3 M3.5 7.5 L8 3 L12.5 7.5" />
    </svg>
  );
}

export function CloseLineIcon(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M4 4 L12 12 M12 4 L4 12" />
    </svg>
  );
}
