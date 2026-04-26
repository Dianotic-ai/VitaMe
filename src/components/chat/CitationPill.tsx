// file: src/components/chat/CitationPill.tsx — 书脊衬线引证 chip
// PR-PLAN.md §3.1：删除 emoji + emerald；改用 .citation-spine 样式（globals.css 提供）
'use client';

interface Props {
  source: string;
  onClick?: () => void;
}

export function CitationPill({ source, onClick }: Props) {
  return (
    <span
      onClick={onClick}
      className="citation-spine cursor-pointer text-seed hover:bg-seed-soft transition-colors"
    >
      {source}
    </span>
  );
}
