// file: src/components/chat/ChatInput.tsx — Seed Within 暖底 pill 输入框
// PR-PLAN.md §3.4
'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpLineIcon } from '@/components/brand/Icons';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 px-3 pt-2.5 border-t border-border-subtle bg-surface pb-[max(0.875rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex-1 flex items-end gap-1.5 bg-bg-warm border border-border-subtle rounded-[20px] pl-3.5 pr-1.5 py-1.5 min-h-10 focus-within:border-forest transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          placeholder={disabled ? '正在回复…' : '问我吧，比如：维生素 D 该补多少'}
          rows={1}
          /* DESIGN.md §8.4: input 字号 ≥16px，否则 iOS Safari focus 时自动 zoom */
          className="flex-1 bg-transparent outline-none resize-none text-[16px] sm:text-[14.5px] placeholder:text-text-tertiary text-text-primary max-h-32 leading-relaxed py-1"
          style={{ minHeight: '24px' }}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-7 h-7 rounded-full bg-forest text-white flex items-center justify-center disabled:bg-border-strong disabled:cursor-not-allowed hover:bg-forest-2 transition-colors shrink-0"
          aria-label="发送"
        >
          <ArrowUpLineIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
