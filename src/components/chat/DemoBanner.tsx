// file: src/components/chat/DemoBanner.tsx — CLAUDE.md §9.7 顶部横幅
'use client';

export function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
      <span className="font-medium">⚠ Demo 原型</span> · 禁忌规则尚未经执业药师临床复核，不构成医疗建议
    </div>
  );
}
