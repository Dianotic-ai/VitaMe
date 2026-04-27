// file: src/app/chat/page.tsx — Seed Within chat 主入口
// PR-PLAN.md §3.6
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import type { UIMessage } from 'ai';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useConversationStore } from '@/lib/chat/conversationStore';
import { useEventStore } from '@/lib/memory/eventStore';
import { useReminderStore } from '@/lib/reminder/store';
import { personToSnapshot } from '@/lib/profile/profileInjector';
import type { CreateReminderInput, CreateReminderOutput } from '@/lib/chat/tools';
import { DemoBanner } from '@/components/chat/DemoBanner';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { PersonSwitcher } from '@/components/chat/PersonSwitcher';
import { EmptyState } from '@/components/chat/EmptyState';
import { PromptInspector } from '@/components/chat/PromptInspector';
import { FeedbackPrompt, type FeedbackResult } from '@/components/feedback/FeedbackPrompt';
import { computeTrigger, markPromptShown, type FeedbackTrigger } from '@/lib/feedback/triggerRule';
import { ReminderBanner } from '@/components/reminder/ReminderBanner';
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
  const markSupplementFedback = useProfileStore((s) => s.markSupplementFedback);
  const addSupplement = useProfileStore((s) => s.addSupplement);
  const appendEvent = useEventStore((s) => s.appendEvent);
  const addRule = useReminderStore((s) => s.addRule);
  const activePerson = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [feedbackTrigger, setFeedbackTrigger] = useState<FeedbackTrigger | null>(null);

  // 进入页面 1.5s 后检查是否要弹 FeedbackPrompt
  useEffect(() => {
    const t = setTimeout(() => {
      const trigger = computeTrigger(activePerson);
      if (trigger) setFeedbackTrigger(trigger);
    }, 1500);
    return () => clearTimeout(t);
  }, [activePerson.id]);

  function handleFeedbackSubmit(result: FeedbackResult) {
    markSupplementFedback(result.supplementId);
    appendEvent({
      eventType: 'feedback',
      personId: activePerson.id,
      entityRefs: [result.supplementId],
      userText: result.freeText,
      tags: result.urgent ? ['urgent', result.question] : [result.question],
      metadata: {
        question: result.question,
        answer: result.answer,
        urgent: result.urgent ?? false,
      },
    });
    if (feedbackTrigger) markPromptShown(activePerson.id);
    setFeedbackTrigger(null);
  }
  function handleFeedbackSkip() {
    if (feedbackTrigger) markPromptShown(activePerson.id);
    setFeedbackTrigger(null);
  }

  const storedMessages = useConversationStore((s) => s.messages);
  const setStoredMessages = useConversationStore((s) => s.setMessages);
  const clearStoredMessages = useConversationStore((s) => s.clearMessages);

  const { messages, sendMessage, status, setMessages, addToolResult } = useChat({
    messages: storedMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        sessionId: profile.sessionId,
        profile: personToSnapshot(activePerson),
      }),
    }),
    // tool 回流后自动 resend，让 LLM 写"已设置"确认句
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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
        // 北极星 §5：每轮对话都写一个 verify event 到 active person 的时间轴
        const entityRefs: string[] = [];
        if (data?.delta) {
          const d = data.delta;
          for (const c of d.newConditions ?? []) entityRefs.push(c.slug ?? c.mention);
          for (const m of d.newMedications ?? []) entityRefs.push(m.slug ?? m.mention);
        }
        appendEvent({
          eventType: 'verify',
          personId: activePerson.id,
          entityRefs,
          userText: userText.slice(0, 500),
          agentText: assistantText.length > 240 ? assistantText.slice(0, 240) + '…' : assistantText,
          tags: data?.delta?.conversationSummary?.topics ?? [],
          metadata: {
            sessionId: profile.sessionId,
            summaryTopics: data?.delta?.conversationSummary?.topics ?? [],
          },
        });

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

  // 监听 create_reminder tool-call 并落本地 store（北极星 §9.8 隐私底线 — 数据不出本机）
  const processedToolCallsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;

    for (const part of last.parts ?? []) {
      if (
        part.type !== 'tool-create_reminder' ||
        !('state' in part) ||
        part.state !== 'input-available'
      ) {
        continue;
      }
      const callId = (part as { toolCallId: string }).toolCallId;
      if (processedToolCallsRef.current.has(callId)) continue;
      processedToolCallsRef.current.add(callId);

      const input = (part as { input: CreateReminderInput }).input;

      try {
        // 模糊匹配现有补剂；否则自动加进 currentSupplements
        const lower = input.supplementMention.toLowerCase().trim();
        const existing = activePerson.currentSupplements.find((s) => {
          const m = s.mention.toLowerCase().trim();
          return m === lower || m.includes(lower) || lower.includes(m);
        });
        const supplementId = existing?.supplementId ?? addSupplement({ mention: input.supplementMention });
        const daysOfWeek = input.daysOfWeek && input.daysOfWeek.length > 0
          ? input.daysOfWeek
          : [1, 2, 3, 4, 5, 6, 7];

        const ruleId = addRule({
          personId: activePerson.id,
          supplementId,
          timeOfDay: input.timeOfDay,
          daysOfWeek,
        });

        // 写一条 reminder event 到时间轴（北极星 §5）
        appendEvent({
          eventType: 'reminder',
          personId: activePerson.id,
          entityRefs: [supplementId],
          userText: `通过对话设置：${input.supplementMention} 每天 ${input.timeOfDay}`,
          tags: ['rule-created', 'via-chat'],
          metadata: {
            ruleId,
            timeOfDay: input.timeOfDay,
            daysOfWeek,
            autoCreatedSupplement: !existing,
          },
        });

        const output: CreateReminderOutput = {
          ok: true,
          ruleId,
          supplementId,
          supplementMention: input.supplementMention,
          timeOfDay: input.timeOfDay,
          daysOfWeek,
          autoCreatedSupplement: !existing,
        };
        addToolResult({ tool: 'create_reminder', toolCallId: callId, output });
      } catch (e) {
        addToolResult({
          tool: 'create_reminder',
          toolCallId: callId,
          state: 'output-error',
          errorText: e instanceof Error ? e.message : String(e),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activePerson.id]);

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
      <ReminderBanner />
      <header className="bg-surface border-b border-border-subtle px-4 py-2.5 flex items-center justify-between gap-2">
        <Link href="/chat" className="shrink-0">
          <VitaMeLogo size={22} />
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <PersonSwitcher />
          <button
            onClick={() => setInspectorOpen(true)}
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="AI 看到什么"
            aria-label="AI 看到什么"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="7" cy="7" r="4" />
              <path d="M10 10 L 13 13" />
            </svg>
          </button>
          <button
            onClick={handleNewChat}
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="新对话"
            aria-label="新对话"
          >
            <PlusLineIcon className="w-4 h-4" />
          </button>
          <Link
            href="/reminders"
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="提醒中心"
            aria-label="提醒中心"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2.5 C 5.5 2.5 4 4.3 4 7 L 4 9 L 3 11.5 L 13 11.5 L 12 9 L 12 7 C 12 4.3 10.5 2.5 8 2.5 Z" />
              <path d="M6.5 12.5 C 6.5 13.4 7.2 14 8 14 C 8.8 14 9.5 13.4 9.5 12.5" />
            </svg>
          </Link>
          <Link
            href="/memory"
            className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
            title="Memory 时间轴"
            aria-label="Memory 时间轴"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" />
              <path d="M8 5 L 8 8 L 10.5 9.5" />
            </svg>
          </Link>
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

      {inspectorOpen && <PromptInspector onClose={() => setInspectorOpen(false)} />}
      {feedbackTrigger && (
        <FeedbackPrompt
          trigger={feedbackTrigger}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
        />
      )}
    </div>
  );
}
