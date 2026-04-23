// file: src/components/IntentFallbackForm.tsx — L0 意图识别兜底表单（DESIGN.md §4.8 / v2.8）

'use client';

import { useState, type KeyboardEvent } from 'react';

interface Props {
  examples?: string[];
  onSubmit: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_EXAMPLES: readonly string[] = [
  '我妈在吃华法林，能吃辅酶 Q10 吗？',
  '孕期能吃维生素 D 吗？',
  '我胃溃疡，吃什么形式的镁？',
];

const SOOTHING_COPY = '我没听懂你的问题，能换个说法吗？';
const PLACEHOLDER = '换个说法试试';
const SUBMIT_LABEL = '发送';

export function IntentFallbackForm({
  examples,
  onSubmit,
  disabled = false,
  className,
}: Props) {
  const [text, setText] = useState('');
  const exampleList = examples && examples.length > 0 ? examples : DEFAULT_EXAMPLES;

  const handleSubmit = () => {
    if (disabled) {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = !disabled && text.trim().length > 0;

  return (
    <section
      aria-label="意图识别兜底输入"
      className={[
        'flex flex-col gap-4 rounded-xl bg-white p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm leading-6 text-text-primary">{SOOTHING_COPY}</p>

      <ul className="flex flex-col gap-2" aria-label="示例问句">
        {exampleList.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => setText(example)}
              disabled={disabled}
              aria-label={`使用示例：${example}`}
              className={[
                'w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-3 text-left text-sm leading-6 text-text-primary transition',
                'hover:bg-bg-warm focus:bg-bg-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-vita-brown/30',
                'disabled:cursor-not-allowed disabled:text-text-disabled',
              ].join(' ')}
            >
              {example}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label className="flex-1">
          <span className="sr-only">换个说法</span>
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={PLACEHOLDER}
            aria-label="输入新的问法"
            className={[
              'w-full rounded-[10px] border border-border-subtle bg-surface px-4 text-base text-text-primary placeholder:text-text-disabled',
              'focus:border-vita-brown focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-bg-warm disabled:text-text-secondary',
            ].join(' ')}
            style={{ minHeight: 48, fontSize: 16 }}
          />
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label={SUBMIT_LABEL}
          className={[
            'rounded-xl bg-vita-brown px-6 text-base font-medium text-white transition',
            'hover:bg-vita-brown/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-vita-brown/40',
            'disabled:cursor-not-allowed disabled:bg-vita-brown/40',
          ].join(' ')}
          style={{ minHeight: 48 }}
        >
          {SUBMIT_LABEL}
        </button>
      </div>
    </section>
  );
}

export default IntentFallbackForm;
