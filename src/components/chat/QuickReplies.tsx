// file: src/components/chat/QuickReplies.tsx — 把助手末尾的编号列表渲染成可点击行
//
// 多策略解析（按顺序尝试，命中即返回）：
// 1. 严格编号列表："1. xxx\n2. xxx\n3. xxx"（最末连续行）
// 2. 末尾问句二/多选：含"X 还是 Y"或"或者"的最后一行问句
// 3. 加粗箭头列表："**X** → ..."连续行 — minimax 偏好的模式
//
// 视觉：复刻 PersonSwitcher sheet 那种圆角行 + 边框 + hover
'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ChevronRightLineIcon, ArrowUpLineIcon, CloseLineIcon } from '@/components/brand/Icons';

const SKIP_MESSAGE = '都可以，你帮我选吧';

const CHOICE_LINE_RE = /^\s*(\d+)[.、)]\s+(.+?)\s*$/;
const BOLD_ARROW_RE = /^\s*\*\*([^*]{1,24})\*\*\s*[→:：]/;
const QUESTION_SPLIT_RE = /还是|或者/;
const MAX_CHOICE_LEN = 32;
const MAX_BINARY_CHOICE_LEN = 24;
const MIN_CHOICES = 2;
const MAX_CHOICES = 6;

export interface ParsedChoice {
  label: string;
}

/** 主入口：按 3 个策略依次尝试。 */
export function parseChoices(text: string): ParsedChoice[] | null {
  if (!text) return null;
  return (
    parseStrictNumberedList(text) ??
    parseBinaryQuestion(text) ??
    parseBoldArrowList(text)
  );
}

/** 策略 1：严格编号列表。 */
function parseStrictNumberedList(text: string): ParsedChoice[] | null {
  const lines = text.split(/\r?\n/);
  const tail: ParsedChoice[] = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i];
    if (raw === undefined) continue;
    const line = raw.trim();
    if (line === '') {
      if (tail.length === 0) continue;
      break;
    }
    const m = CHOICE_LINE_RE.exec(line);
    if (!m) {
      if (tail.length === 0) continue;
      break;
    }
    const label = (m[2] ?? '').trim();
    if (!label || label.length > MAX_CHOICE_LEN) return null;
    tail.unshift({ label });
  }

  if (tail.length < MIN_CHOICES || tail.length > MAX_CHOICES) return null;
  if (!/[?？]/.test(text)) return null;

  // 编号必须从 1 开始递增
  const numberOk = tail.every((c, i) => {
    const line = lines.find((l) => CHOICE_LINE_RE.exec(l.trim())?.[2]?.trim() === c.label);
    if (!line) return false;
    const m = CHOICE_LINE_RE.exec(line.trim());
    return m && Number(m[1]) === i + 1;
  });
  if (!numberOk) return null;
  return tail;
}

/** 策略 2：末尾问句含「还是 / 或者」→ 拆成 2-4 个 choice。 */
function parseBinaryQuestion(text: string): ParsedChoice[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 找最后一个问句行
  let questionLine: string | null = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/[?？]/.test(lines[i]!)) {
      questionLine = lines[i]!;
      break;
    }
  }
  if (!questionLine) return null;
  if (!QUESTION_SPLIT_RE.test(questionLine)) return null;

  // 去掉句尾标点 + 常见尾巴词
  const cleaned = questionLine
    .replace(/[?？.。!！\s]+$/, '')
    .replace(/(吗|呢|呀|哦)+$/, '');

  const parts = cleaned
    .split(QUESTION_SPLIT_RE)
    .map((p) => p.trim())
    // 去掉每段开头的"你/你的/你想"等套话
    .map((p) => p.replace(/^(你想|你要|你的|你|是)/, '').trim())
    .filter(Boolean);

  if (parts.length < 2 || parts.length > 4) return null;
  if (parts.some((p) => p.length === 0 || p.length > MAX_BINARY_CHOICE_LEN)) return null;
  // 排除明显不像选项的（含问号、太多标点）
  if (parts.some((p) => /[?？]/.test(p) || p.split('，').length > 3)) return null;

  return parts.map((label) => ({ label }));
}

/** 策略 3：连续 `**X** → ...` 行（minimax 偏好的格式）。 */
function parseBoldArrowList(text: string): ParsedChoice[] | null {
  if (!/[?？]/.test(text)) return null;
  const lines = text.split(/\r?\n/);
  const matches: ParsedChoice[] = [];
  for (const raw of lines) {
    const m = BOLD_ARROW_RE.exec(raw);
    if (m && m[1]) {
      matches.push({ label: m[1].trim() });
    }
  }
  if (matches.length < MIN_CHOICES || matches.length > MAX_CHOICES) return null;
  if (matches.some((c) => c.label.length > MAX_CHOICE_LEN)) return null;
  return matches;
}

interface QuickRepliesProps {
  choices: ParsedChoice[];
  onPick: (text: string) => void;
}

export function QuickReplies({ choices, onPick }: QuickRepliesProps) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');

  if (choices.length === 0) return null;

  const otherIdx = choices.length + 1; // 4 if 3 choices
  const skipIdx = choices.length + 2;  // 5 if 3 choices

  function submitOther(e?: FormEvent) {
    e?.preventDefault();
    const txt = otherText.trim();
    if (!txt) return;
    setOtherText('');
    setOtherOpen(false);
    onPick(txt);
  }

  function onOtherKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitOther();
    }
    if (e.key === 'Escape') {
      setOtherOpen(false);
      setOtherText('');
    }
  }

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

      {/* 其他（自己说） — 点击展开输入框 */}
      {!otherOpen ? (
        <button
          type="button"
          onClick={() => setOtherOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-card bg-surface border border-dashed border-border-subtle text-left hover:border-forest/40 hover:bg-bg-warm transition-colors group"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-5 h-5 rounded-full bg-bg-warm border border-border-subtle text-[11px] text-text-tertiary flex items-center justify-center font-mono">
              {otherIdx}
            </span>
            <span className="text-[13.5px] text-text-secondary leading-snug">
              其他（自己说）
            </span>
          </span>
          <ChevronRightLineIcon className="w-3.5 h-3.5 text-text-tertiary group-hover:text-forest shrink-0" />
        </button>
      ) : (
        <form
          onSubmit={submitOther}
          className="flex items-center gap-2 px-2 py-1.5 rounded-card bg-surface border border-forest/40"
        >
          <span className="shrink-0 w-5 h-5 rounded-full bg-forest text-white text-[11px] flex items-center justify-center font-mono">
            {otherIdx}
          </span>
          <input
            autoFocus
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={onOtherKeyDown}
            placeholder="你的答案…"
            className="flex-1 bg-transparent text-[13.5px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            type="button"
            onClick={() => {
              setOtherOpen(false);
              setOtherText('');
            }}
            className="shrink-0 p-1 text-text-tertiary hover:text-text-primary"
            aria-label="取消"
          >
            <CloseLineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="submit"
            disabled={!otherText.trim()}
            className="shrink-0 w-7 h-7 rounded-full bg-forest text-white flex items-center justify-center disabled:opacity-40"
            aria-label="发送"
          >
            <ArrowUpLineIcon className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* 跳过 — 让 AI 帮选 */}
      <button
        type="button"
        onClick={() => onPick(SKIP_MESSAGE)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-card bg-bg-warm/50 border border-dashed border-border-subtle text-left hover:bg-bg-warm transition-colors group"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 h-5 rounded-full bg-bg-warm border border-border-subtle text-[11px] text-text-tertiary flex items-center justify-center font-mono">
            {skipIdx}
          </span>
          <span className="text-[13.5px] text-text-tertiary leading-snug">
            跳过 · 你帮我选
          </span>
        </span>
        <ChevronRightLineIcon className="w-3.5 h-3.5 text-text-tertiary group-hover:text-forest shrink-0" />
      </button>
    </div>
  );
}
