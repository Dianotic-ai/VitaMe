// file: src/components/chat/ChatInput.tsx — 底部输入框
'use client';

import { useState, type FormEvent } from 'react';

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
      className="border-t border-gray-200 bg-white p-3 flex gap-2 items-end pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
          }
        }}
        placeholder={disabled ? '助手正在回复…' : '聊聊你想了解的补剂…'}
        rows={1}
        className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 max-h-32"
        style={{ minHeight: '40px' }}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-full bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-700 transition shrink-0"
      >
        发送
      </button>
    </form>
  );
}
