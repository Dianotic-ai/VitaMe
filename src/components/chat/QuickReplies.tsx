// file: src/components/chat/QuickReplies.tsx — 把助手末尾的编号列表渲染成可点击行（支持多步 wizard）
//
// 多策略解析（按顺序尝试，命中即返回）：
// 1. 严格编号列表（可多组）："Q?\n1. xxx\n2. xxx" 连续多块 → 多步 chips
// 2. 末尾问句二/多选：含"X 还是 Y"或"或者"的最后一行问句 → 单组
// 3. 加粗箭头列表："**X** → ..."连续行 — minimax 偏好的模式 → 单组
//
// 多步 wizard：当 agent 在一条消息里抛多个问题时，前端拆成 step-by-step
// 用户依次回答 → 最后一步答完后把所有回答 join("，") 发回 agent
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
const MAX_GROUPS = 4; // 多步 wizard 最多 4 步，超过当退化（agent 写飞了）

export interface ParsedChoice {
  label: string;
}

export interface ChoiceGroup {
  /** 问句标签，如 "你多大年纪？"（找不到时为 undefined） */
  label?: string;
  choices: ParsedChoice[];
}

/** 主入口：返回 ChoiceGroup[]，0 组表示无可识别选项。 */
export function parseChoiceGroups(text: string): ChoiceGroup[] {
  if (!text) return [];

  // 策略 1：多组严格编号列表
  const numbered = parseAllNumberedGroups(text);
  if (numbered.length > 0) return numbered;

  // 策略 2 / 3：单组（保持旧行为）
  const binary = parseBinaryQuestion(text);
  if (binary) return [{ choices: binary }];

  const arrow = parseBoldArrowList(text);
  if (arrow) return [{ choices: arrow }];

  return [];
}

/** 兼容旧 API：取第一组的 choices。MessageList 已改用 parseChoiceGroups，仅留作向后兼容。 */
export function parseChoices(text: string): ParsedChoice[] | null {
  const groups = parseChoiceGroups(text);
  if (groups.length === 0) return null;
  return groups[0]!.choices;
}

/** 策略 1：扫描所有连续 numbered list 块（编号必从 1 开始递增）。 */
function parseAllNumberedGroups(text: string): ChoiceGroup[] {
  if (!/[?？]/.test(text)) return [];

  const lines = text.split(/\r?\n/);
  const groups: ChoiceGroup[] = [];
  let current: ParsedChoice[] = [];
  let expected = 1;
  let groupStartIdx = -1;

  function closeGroup() {
    if (current.length >= MIN_CHOICES && current.length <= MAX_CHOICES) {
      groups.push({
        label: findQuestionLabel(lines, groupStartIdx),
        choices: [...current],
      });
    }
    current = [];
    expected = 1;
    groupStartIdx = -1;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const m = CHOICE_LINE_RE.exec(line);

    if (m && Number(m[1]) === expected) {
      const label = (m[2] ?? '').trim();
      if (!label || label.length > MAX_CHOICE_LEN) {
        closeGroup();
        continue;
      }
      if (expected === 1) groupStartIdx = i;
      current.push({ label });
      expected++;
      continue;
    }

    // 当前行不接续 → 关组；如果它本身是 "1. xxx" 则开新组
    closeGroup();
    if (m && Number(m[1]) === 1) {
      const label = (m[2] ?? '').trim();
      if (label && label.length <= MAX_CHOICE_LEN) {
        current.push({ label });
        expected = 2;
        groupStartIdx = i;
      }
    }
  }
  closeGroup();

  if (groups.length > MAX_GROUPS) return [];
  return groups;
}

/** 在 groupStartIdx 上方最多 4 行内找最近的含问号行作为 label。 */
function findQuestionLabel(lines: string[], groupStartIdx: number): string | undefined {
  if (groupStartIdx < 0) return undefined;
  for (let i = groupStartIdx - 1; i >= Math.max(0, groupStartIdx - 4); i--) {
    const line = lines[i]!.trim();
    if (!line) continue;
    if (/[?？]/.test(line)) {
      return line
        .replace(/^[-*•]\s*/, '')
        .replace(/^\*+|\*+$/g, '')
        .replace(/^#+\s*/, '')
        .trim();
    }
    // 非空非问句 → 别再往上吃，避免抓到无关段落
    break;
  }
  return undefined;
}

/** 策略 2：末尾问句含「还是 / 或者」→ 拆成 2-4 个 choice。 */
function parseBinaryQuestion(text: string): ParsedChoice[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let questionLine: string | null = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/[?？]/.test(lines[i]!)) {
      questionLine = lines[i]!;
      break;
    }
  }
  if (!questionLine) return null;
  if (!QUESTION_SPLIT_RE.test(questionLine)) return null;

  const cleaned = questionLine
    .replace(/[?？.。!！\s]+$/, '')
    .replace(/(吗|呢|呀|哦)+$/, '');

  const parts = cleaned
    .split(QUESTION_SPLIT_RE)
    .map((p) => p.trim())
    .map((p) => p.replace(/^(你想|你要|你的|你|是)/, '').trim())
    .filter(Boolean);

  if (parts.length < 2 || parts.length > 4) return null;
  if (parts.some((p) => p.length === 0 || p.length > MAX_BINARY_CHOICE_LEN)) return null;
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
  groups: ChoiceGroup[];
  onPick: (text: string) => void;
}

export function QuickReplies({ groups, onPick }: QuickRepliesProps) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');

  if (groups.length === 0) return null;

  const totalSteps = groups.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const currentGroup = groups[safeStep]!;
  const isLastStep = safeStep >= totalSteps - 1;
  const isMultiStep = totalSteps > 1;

  const otherIdx = currentGroup.choices.length + 1;
  const skipIdx = currentGroup.choices.length + 2;

  function commit(answers: string[]) {
    const joined = answers.length === 1 ? answers[0]! : answers.join('，');
    setPicked([]);
    setStep(0);
    setOtherOpen(false);
    setOtherText('');
    onPick(joined);
  }

  function pick(label: string) {
    const next = [...picked, label];
    if (isLastStep) {
      commit(next);
    } else {
      setPicked(next);
      setStep(safeStep + 1);
      setOtherOpen(false);
      setOtherText('');
    }
  }

  function submitOther(e?: FormEvent) {
    e?.preventDefault();
    const txt = otherText.trim();
    if (!txt) return;
    pick(txt);
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

  function skip() {
    // 跳过 = 把当前+剩余全部交给 AI 自由发挥
    setPicked([]);
    setStep(0);
    setOtherOpen(false);
    setOtherText('');
    onPick(SKIP_MESSAGE);
  }

  return (
    <div className="my-2 space-y-1.5">
      {isMultiStep && (
        <div className="flex items-center justify-between px-1 pb-0.5 text-[11.5px] text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="font-mono">第 {safeStep + 1} / {totalSteps} 步</span>
            {currentGroup.label && (
              <span className="text-text-secondary truncate max-w-[60vw]">· {currentGroup.label}</span>
            )}
          </span>
          {picked.length > 0 && (
            <span className="text-text-tertiary truncate max-w-[40vw]">已选：{picked.join(' · ')}</span>
          )}
        </div>
      )}

      {currentGroup.choices.map((c, i) => (
        <button
          key={`${safeStep}-${i}-${c.label}`}
          type="button"
          onClick={() => pick(c.label)}
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
            className="flex-1 bg-transparent text-[16px] sm:text-[14.5px] text-text-primary outline-none placeholder:text-text-tertiary"
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

      {/* 跳过 — 让 AI 帮选（多步时跳过 = 全部交给 AI） */}
      <button
        type="button"
        onClick={skip}
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
