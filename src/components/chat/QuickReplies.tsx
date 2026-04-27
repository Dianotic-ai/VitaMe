// file: src/components/chat/QuickReplies.tsx — 把助手末尾的编号列表渲染成可点击行
//
// 触发条件（避免误判）：
// - 助手消息末尾连续若干行 `^\s*\d+[.、)]\s+...`
// - ≥2 项 ≤6 项
// - 每项文本 ≤32 字
// - 编号列表前的整段消息里出现过 `?` 或 `？`
//
// 视觉：复刻 PersonSwitcher sheet 那种圆角行 + 边框 + hover
'use client';

import { ChevronRightLineIcon } from '@/components/brand/Icons';

const CHOICE_LINE_RE = /^\s*(\d+)[.、)]\s+(.+?)\s*$/;
const MAX_CHOICE_LEN = 32;
const MIN_CHOICES = 2;
const MAX_CHOICES = 6;

export interface ParsedChoice {
  label: string;
}

/** 解析助手最末消息为编号选项（不命中返回 null）。 */
export function parseChoices(text: string): ParsedChoice[] | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/);

  // 倒序找连续编号行
  const tail: ParsedChoice[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i];
    if (raw === undefined) continue;
    const line = raw.trim();
    if (line === '') {
      // 允许空行
      if (tail.length === 0) continue;
      break;
    }
    const m = CHOICE_LINE_RE.exec(line);
    if (!m) {
      if (tail.length === 0) continue; // 还没开始攒，继续往上找
      break; // 攒过了又遇到非编号行 → 结束
    }
    const label = (m[2] ?? '').trim();
    if (!label || label.length > MAX_CHOICE_LEN) return null;
    tail.unshift({ label });
  }

  if (tail.length < MIN_CHOICES || tail.length > MAX_CHOICES) return null;

  // 必须有疑问语气
  if (!/[?？]/.test(text)) return null;

  // 编号必须从 1 开始递增（避免误抓引证列表）
  const lastNumberCheck = tail.every((_, i) => {
    const line = lines.find((l) => CHOICE_LINE_RE.exec(l.trim())?.[2]?.trim() === tail[i]?.label);
    if (!line) return false;
    const m = CHOICE_LINE_RE.exec(line.trim());
    return m && Number(m[1]) === i + 1;
  });
  if (!lastNumberCheck) return null;

  return tail;
}

interface QuickRepliesProps {
  choices: ParsedChoice[];
  onPick: (text: string) => void;
}

export function QuickReplies({ choices, onPick }: QuickRepliesProps) {
  if (choices.length === 0) return null;
  return (
    <div className="my-2 space-y-1.5">
      {choices.map((c, i) => (
        <button
          key={`${i}-${c.label}`}
          type="button"
          onClick={() => onPick(c.label)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-card bg-surface border border-border-subtle text-left hover:border-forest/50 hover:bg-bg-warm transition-colors group"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-5 h-5 rounded-full bg-bg-warm border border-border-subtle text-[11px] text-text-secondary flex items-center justify-center font-mono">
              {i + 1}
            </span>
            <span className="text-[13.5px] text-text-primary leading-snug truncate">
              {c.label}
            </span>
          </span>
          <ChevronRightLineIcon className="w-3.5 h-3.5 text-text-tertiary group-hover:text-forest shrink-0" />
        </button>
      ))}
    </div>
  );
}
