// file: src/app/chat/page.tsx — v0.3 chat 主入口（持久化 + profile 注入可视化版）
//
// 持久化：
// - profile 在 useProfileStore（zustand persist）→ LocalStorage key vitame-profile-v1
// - chat messages 在 useConversationStore（zustand persist）→ LocalStorage key vitame-conversation-v1
// - 刷新浏览器后，对话历史 + 健康档案都恢复
//
// 注入可视化：header 显示 ProfileBadge "📋 已记住 N 条 · ..."
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useConversationStore } from '@/lib/chat/conversationStore';
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
  const hasHydrated = useConversationStore((s) => s.hasHydrated);

  // 等 conversation store hydrate 完才渲染 ChatBody，避免 useChat 用空数组初始化后又被覆盖
  if (!hasHydrated) {
    return (
      <div className="flex flex-col h-screen bg-bg-warm">
        <DemoBanner />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">载入中…</div>
      </div>
    );
  }

  return <ChatBody />;
}

function ChatBody() {
  const profile = useProfileStore((s) => s.profile);
  const applyDelta = useProfileStore((s) => s.applyDelta);

  const storedMessages = useConversationStore((s) => s.messages);
  const setStoredMessages = useConversationStore((s) => s.setMessages);
  const clearStoredMessages = useConversationStore((s) => s.clearMessages);

  const { messages, sendMessage, status, setMessages } = useChat({
    messages: storedMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        sessionId: profile.sessionId,
        profile: profileToSnapshot(profile),
      }),
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // 把 useChat 内部 messages 同步到 conversation store（每次变化都持久化）
  useEffect(() => {
    if (status === 'streaming') return; // 流过程中不写，等 stop 后一次写入，避免抖动
    setStoredMessages(messages as UIMessage[]);
  }, [messages, status, setStoredMessages]);

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

  function handleNewChat() {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const ok = window.confirm('开始新对话？当前对话记录会清空，但你的健康档案保留。');
      if (!ok) return;
    }
    setMessages([]);
    clearStoredMessages();
  }

  return (
    <div className="flex flex-col h-screen bg-bg-warm">
      <DemoBanner />
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary leading-tight">VitaMe</h1>
          <p className="text-[11px] text-gray-500">补剂选择对话顾问</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="text-xs text-gray-600 px-2 py-1 rounded-full border border-gray-300 hover:bg-gray-50"
            title="清空当前对话，健康档案保留"
          >
            ＋ 新对话
          </button>
          <Link
            href="/profile"
            className="text-xs text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 hover:bg-emerald-50"
          >
            我的档案
          </Link>
        </div>
      </header>

      <MessageList messages={messages} isStreaming={isStreaming} />

      <ChatInput disabled={isStreaming} onSend={handleSend} />
    </div>
  );
}
