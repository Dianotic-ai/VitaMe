// file: src/components/chat/MessageList.tsx — 消息列表
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
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 bg-bg-warm">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-12">
          <div className="text-2xl mb-2">🌿</div>
          <p>跟 VitaMe 聊聊你最近想买的补剂</p>
          <p className="text-xs mt-1 text-gray-400">比如：「我经常熬夜，吃什么补」「鱼油和华法林冲突吗」</p>
        </div>
      )}

      {messages.map((m, idx) => {
        const text = extractText(m);
        if (!text && m.role === 'assistant' && idx === messages.length - 1 && isStreaming) {
          // 助手刚开始流但还没文字 → 显示 ...
          return (
            <div key={m.id} className="flex justify-start my-2">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

      <div ref={bottomRef} />
    </div>
  );
}
