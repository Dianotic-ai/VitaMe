// file: src/components/ClarifyBubble.tsx — L0 意图识别澄清气泡（DESIGN.md §4.7 / v2.8）

'use client';

import { useState } from 'react';
import type { ClarifyingQuestion, ClarifyTopic } from '@/lib/types/intent';

interface Props {
  question: ClarifyingQuestion;
  topic: string; // ClarifyTopic from '@/lib/types/intent'
  onPick: (choice: string) => void;
  onOther: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

// topic → "为什么问？" 解释映射
// key 对齐 src/lib/types/intent.ts 的 ClarifyTopic union（外加 design spec 列出但 union 未含的扩展 key）
const TOPIC_EXPLANATIONS: Record<string, string> = {
  medication_context: '你目前吃什么药会影响这条建议的判断',
  condition_context: '你已有的疾病会影响是否能用某些成分',
  special_group_context: '孕期/哺乳/婴幼儿会有专门规则',
  // intent.ts 中的 ClarifyTopic 实际枚举（覆盖 spec 中同义 key）
  special_group: '孕期/哺乳/婴幼儿会有专门规则',
  product_disambiguation: '需要确认是哪种成分（中文/英文/品牌名）',
  ingredient_specificity: '需要确认是哪种成分（中文/英文/品牌名）',
  symptom_specificity: '症状太笼统，需要更具体来给出候选',
};

const TOPIC_FALLBACK = '这条问题来自固定规则集，不是 AI 自由发挥';

function explainTopic(topic: string): string {
  return TOPIC_EXPLANATIONS[topic] ?? TOPIC_FALLBACK;
}

function cx(...cls: Array<string | false | null | undefined>): string {
  return cls.filter(Boolean).join(' ');
}

export function ClarifyBubble({
  question,
  topic,
  onPick,
  onOther,
  disabled = false,
  className,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [whyOpen, setWhyOpen] = useState(false);

  const groupLocked = disabled || picked !== null;

  function handlePick(choice: string): void {
    if (groupLocked) return;
    setPicked(choice);
    onPick(choice);
  }

  function handleOtherToggle(): void {
    if (groupLocked) return;
    setOtherOpen((v) => !v);
  }

  function handleOtherSend(): void {
    if (groupLocked) return;
    const trimmed = otherText.trim();
    if (trimmed.length === 0) return;
    setPicked(trimmed);
    onOther(trimmed);
  }

  return (
    <div className={cx('flex flex-col gap-3', className)} aria-live="polite">
      {/* assistant 行：头像 + 气泡 */}
      <div className="flex items-start gap-2">
        <div
          aria-hidden="true"
          className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vita-brown"
        >
          <svg
            viewBox="0 0 12 12"
            width="8"
            height="8"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5,6.5 5,9 9.5,3.5" />
          </svg>
        </div>
        <div
          role="group"
          aria-label="VitaMe 澄清问题"
          className="max-w-[80%] rounded-xl border border-border-subtle bg-surface px-3.5 py-3"
        >
          <p className="text-sm leading-relaxed text-text-primary">
            {question.question}
          </p>
        </div>
      </div>

      {/* choice button row */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="澄清候选">
        {question.choices.map((choice) => {
          const isSelected = picked === choice;
          const isDisabled = groupLocked && !isSelected;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => handlePick(choice)}
              disabled={groupLocked}
              aria-pressed={isSelected}
              className={cx(
                'inline-flex h-12 items-center justify-center rounded-full border px-3.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-vita-brown/30',
                isSelected
                  ? 'border-vita-brown bg-vita-brown text-white'
                  : isDisabled
                    ? 'cursor-not-allowed border-border-subtle bg-surface text-text-disabled'
                    : 'border-border-strong bg-surface text-text-primary hover:border-vita-brown hover:bg-bg-warm',
              )}
            >
              {choice}
            </button>
          );
        })}

        {/* "其他" ghost button — 始终追加 */}
        {!otherOpen && (
          <button
            type="button"
            onClick={handleOtherToggle}
            disabled={groupLocked}
            className={cx(
              'inline-flex h-12 items-center justify-center rounded-full bg-transparent px-3.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-vita-brown/30',
              groupLocked
                ? 'cursor-not-allowed text-text-disabled'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            都不是？告诉我具体情况
          </button>
        )}
      </div>

      {/* "其他" 输入区 */}
      {otherOpen && (
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            disabled={groupLocked}
            placeholder="说说你的具体情况"
            aria-label="其他情况输入"
            className="flex-1 rounded-lg border border-border-strong bg-surface px-3.5 text-text-primary focus:border-vita-brown focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-warm disabled:text-text-disabled"
            style={{ height: 48, fontSize: 16 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleOtherSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleOtherSend}
            disabled={groupLocked || otherText.trim().length === 0}
            className="h-12 rounded-lg bg-vita-brown px-5 text-sm font-medium text-white transition hover:bg-vita-brown/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-vita-brown/40 disabled:cursor-not-allowed disabled:bg-vita-brown/40"
          >
            发送
          </button>
        </div>
      )}

      {/* "为什么问？" 注脚 + 解释面板 */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          aria-expanded={whyOpen}
          aria-controls="clarify-why-panel"
          className="self-start text-xs text-text-secondary underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
        >
          为什么问？
        </button>
        {whyOpen && (
          <div
            id="clarify-why-panel"
            role="note"
            className="rounded-md border border-border-subtle bg-bg-warm px-2.5 py-2 text-xs leading-relaxed text-text-secondary"
          >
            {explainTopic(topic)}
          </div>
        )}
      </div>

      {/* 选中后的右对齐用户气泡（保留在对话流中） */}
      {picked !== null && (
        <div className="flex justify-end">
          <div
            className="max-w-[80%] rounded-xl bg-vita-brown px-3.5 py-2.5 text-sm leading-relaxed text-white"
            aria-label="我的回答"
          >
            我选了 {picked}
          </div>
        </div>
      )}
    </div>
  );
}

// 同时把 ClarifyTopic 类型 re-export，方便父组件按 union 传 topic
export type { ClarifyTopic };

export default ClarifyBubble;
