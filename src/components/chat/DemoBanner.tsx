// file: src/components/chat/DemoBanner.tsx — CLAUDE.md §9.7 顶部横幅（Seed Within 视觉）
'use client';

import { InfoLineIcon } from '@/components/brand/Icons';

export function DemoBanner() {
  return (
    <div className="bg-disclaimer-bg border-b border-disclaimer-border px-4 py-1.5 text-[11.5px] text-disclaimer-text leading-snug flex items-center gap-1.5">
      <InfoLineIcon className="w-3 h-3 shrink-0" />
      <span>
        <b className="font-semibold">Demo 原型</b>
        <span className="mx-1">·</span>
        禁忌规则尚未经执业药师临床复核，不构成医疗建议
      </span>
    </div>
  );
}
