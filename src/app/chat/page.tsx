// file: src/app/chat/page.tsx — Seed Within chat 主入口
// PR-PLAN.md §3.6
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useConversationStore } from '@/lib/chat/conversationStore';
import { personToSnapshot } from '@/lib/profile/profileInjector';
import { DemoBanner } from '@/components/chat/DemoBanner';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { PersonSwitcher } from '@/components/chat/PersonSwitcher';
import { EmptyState } from '@/components/chat/EmptyState';
import { VitaMeLogo } from '@/components/brand/VitaMeLogo';
import { PlusLineIcon, DotsLineIcon } from '@/components/brand/Icons';

function extractText(m: UIMessage): string {
  return (m.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as { text?: unknown }).text === 'string')
    .map((p) => p.text)
    .join('');
}

export default function ChatPage() {
  const hasHydrated = useConversationStore((s) => s.hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex flex-col h-screen bg-bg-warm-2">
        <DemoBanner />
        <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">载入中…</div>
      </div>
    );
  }
  return <ChatBody />;
}

function ChatBody() {
  const profile = useProfileStore((s) => s.profile);
  const applyDelta = useProfileStore((s) => s.applyDelta);
  const activePerson = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;

  const storedMessages = useConversationStore((s) => s.messages);
  const setStoredMessages = useConversationStore((s) => s.setMessages);
  const clearStoredMessages = useConversationStore((s) => s.clearMessages);

  const { messages, sendMessage, status, setMessages } = useChat({
    messages: storedMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        sessionId: profile.sessionId,
        profile: personToSnapshot(activePerson),
      }),
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (status === 'streaming') return;
    setStoredMessages(messages as UIMessage[]);
  }, [messages, status, setStoredMessages]);

  const lastMsg = messages[messages.length - 1];
  const lastIsAssistant = lastMsg?.role === 'assistant';

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

  function handleNewChat() {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const ok = window.confirm('开始新对话？当前对话记录会清空，但你的健康档案保留。');
      if (!ok) return;
    }
    setMessages([]);
    clearStoredMessages();
  }

  return (
    <div className="flex flex-col h-screen bg-bg-warm-2">
      <DemoBanner />
      <header className="bg-surface border-b border-border-subtle px-4 py-2.5 flex items-center justify-between gap-2">
        <Link href="/chat" className="shrink-0">
          <VitaMeLogo size={22} />
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <PersonSwitcher />
          <button
            onClick={handleNewChat}
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="新对话"
            aria-label="新对话"
          >
            <PlusLineIcon className="w-4 h-4" />
          </button>
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="档案管理"
            aria-label="档案管理"
          >
            <DotsLineIcon className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState onSeed={handleSend} />
      ) : (
        <MessageList messages={messages} isStreaming={isStreaming} />
      )}

      <ChatInput disabled={isStreaming} onSend={handleSend} />
    </div>
  );
}
