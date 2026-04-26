// file: src/components/chat/CitationPill.tsx — 把 [来源: X] 渲染为可视 chip
//
// 使用：MessageBubble 渲染前对 markdown 文本做正则替换 [来源: ...] → React 组件
'use client';

interface CitationPillProps {
  source: string;
}

export function CitationPill({ source }: CitationPillProps) {
  return (
    <span className="inline-flex items-center gap-0.5 align-baseline mx-0.5 px-1.5 py-0.5 text-[10px] leading-none rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
      📚 {source}
    </span>
  );
}
