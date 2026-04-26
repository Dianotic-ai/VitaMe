// file: src/components/brand/SproutCursor.tsx — 流式打字光标（嫩芽变体）
// PR-PLAN.md §5.6
'use client';

export function SproutCursor() {
  return (
    <span className="inline-block align-middle ml-1 animate-sprout">
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
        <path d="M7 16 L 7 6" stroke="#2D5A3D" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M7 9 C 4 9, 2 7, 2 4 C 5 4, 7 6, 7 9 Z"
          stroke="#2D5A3D"
          strokeWidth="1.2"
          fill="rgba(45,90,61,0.12)"
        />
      </svg>
    </span>
  );
}
