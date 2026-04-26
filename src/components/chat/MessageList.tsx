// file: src/components/chat/MessageList.tsx — Seed Within 消息列表（含底部 mini disclaimer）
// PR-PLAN.md §6 合规保留点 #2
'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
}

function extractText(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as { text?: unknown }).text === 'string')
    .map((p) => p.text)
    .join('');
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]]);

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 bg-bg-warm-2">
      {messages.map((m, idx) => {
        const text = extractText(m);
        if (!text && m.role === 'assistant' && idx === messages.length - 1 && isStreaming) {
          // 助手刚开始流但还没文字 → 显示 ...
          return (
            <div key={m.id} className="flex justify-start my-2">
              <div className="bg-surface border border-border-subtle rounded-[4px_14px_14px_14px] px-3.5 py-2.5">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          );
        }
        if (!text) return null;
        return (
          <MessageBubble
            key={m.id}
            role={m.role === 'user' ? 'user' : 'assistant'}
            text={text}
            isStreaming={isStreaming && idx === messages.length - 1 && m.role === 'assistant'}
          />
        );
      })}

      {/* mini disclaimer at end of conversation — 合规保留点 #2 */}
      {messages.length > 0 && !isStreaming && (
        <div className="text-center text-[10.5px] text-text-tertiary mt-4 mb-2 px-4 leading-relaxed">
          AI 仅提供信息参考，不提供诊断或处方
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
