// file: src/components/chat/MessageList.tsx — Seed Within 消息列表（含底部 mini disclaimer）
// PR-PLAN.md §6 合规保留点 #2
'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { MessageBubble } from './MessageBubble';
import { QuickReplies, parseChoiceGroups } from './QuickReplies';

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  onQuickReply?: (text: string) => void;
}

function extractText(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as { text?: unknown }).text === 'string')
    .map((p) => p.text)
    .join('');
}

export function MessageList({ messages, isStreaming, onQuickReply }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdx = messages.length - 1;
  const lastMsg = messages[lastIdx];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMsg]);

  // 仅对"最后一条助手消息 + 已流完"做选项解析
  const showQuickReplies =
    !isStreaming &&
    !!lastMsg &&
    lastMsg.role === 'assistant' &&
    !!onQuickReply;
  const lastGroups = showQuickReplies ? parseChoiceGroups(extractText(lastMsg)) : [];

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

      {/* 助手最后一条带选项 → 渲染可点击行（key=lastMsg.id 保证消息切换时 wizard state 重置） */}
      {lastGroups.length > 0 && onQuickReply && lastMsg && (
        <div className="px-1">
          <QuickReplies key={lastMsg.id} groups={lastGroups} onPick={onQuickReply} />
        </div>
      )}

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
