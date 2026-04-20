'use client';

import type { RiskLevel } from '@/lib/types/risk';

interface Props {
  level: RiskLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DEFAULT_LABELS: Record<RiskLevel, string> = {
  red: '建议避开',
  yellow: '留意',
  gray: '证据不足',
  green: '可用',
};

const TONE_CLASSES: Record<RiskLevel, string> = {
  red: 'bg-risk-red/10 border-risk-red text-risk-red',
  yellow: 'bg-risk-amber/10 border-risk-amber text-risk-amber',
  gray: 'bg-risk-gray/10 border-risk-gray text-risk-gray',
  green: 'bg-risk-green/10 border-risk-green text-risk-green',
};

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function RiskBadge({ level, label, size = 'md', className }: Props) {
  const resolvedLabel = label ?? DEFAULT_LABELS[level];

  return (
    <span
      role="status"
      aria-label={`风险等级：${resolvedLabel}`}
      className={[
        'inline-flex items-center rounded-full border font-medium leading-none',
        TONE_CLASSES[level],
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {resolvedLabel}
    </span>
  );
}

export default RiskBadge;
