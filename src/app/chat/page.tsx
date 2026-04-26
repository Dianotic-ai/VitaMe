// file: src/app/chat/page.tsx — v0.3 chat 主入口（取代 query/result 流程）
//
// 核心：useChat hook + DefaultChatTransport 注入 sessionId/profile，流结束后异步抽 memory。
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useProfileStore } from '@/lib/profile/profileStore';
import { profileToSnapshot } from '@/lib/profile/profileInjector';
import { DemoBanner } from '@/components/chat/DemoBanner';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';

function extractText(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as { text?: unknown }).text === 'string')
    .map((p) => p.text)
    .join('');
}

export default function ChatPage() {
  const profile = useProfileStore((s) => s.profile);
  const applyDelta = useProfileStore((s) => s.applyDelta);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        sessionId: profile.sessionId,
        profile: profileToSnapshot(profile),
      }),
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';
  const lastMsg = messages[messages.length - 1];
  const lastIsAssistant = lastMsg?.role === 'assistant';

  // 流结束后异步抽 memory
  useEffect(() => {
    if (status !== 'ready') return;
    if (!lastIsAssistant || messages.length < 2) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || !lastMsg) return;

    const userText = extractText(lastUserMsg);
    const assistantText = extractText(lastMsg);
    if (!userText || !assistantText) return;

    const ctrl = new AbortController();
    fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: profile.sessionId, userMsg: userText, assistantMsg: assistantText }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { delta?: import('@/lib/profile/types').ProfileDelta } | null) => {
        if (!data?.delta) return;
        const d = data.delta;
        const hasAnything =
          (d.newConditions?.length ?? 0) > 0 ||
          (d.newMedications?.length ?? 0) > 0 ||
          (d.newAllergies?.length ?? 0) > 0 ||
          (d.newSpecialGroups?.length ?? 0) > 0 ||
          d.ageRange ||
          d.sex ||
          d.conversationSummary;
        if (hasAnything) {
          applyDelta(d, profile.sessionId);
        }
      })
      .catch(() => undefined);

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastMsg?.id]);

  function handleSend(text: string) {
    sendMessage({ text });
  }

  return (
    <div className="flex flex-col h-screen bg-bg-warm">
      <DemoBanner />
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">VitaMe</h1>
          <p className="text-[11px] text-gray-500">补剂选择对话顾问</p>
        </div>
        <Link
          href="/profile"
          className="text-xs text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 hover:bg-emerald-50"
        >
          我的档案
        </Link>
      </header>

      <MessageList messages={messages} isStreaming={isStreaming} />

      <ChatInput disabled={isStreaming} onSend={handleSend} />
    </div>
  );
}
