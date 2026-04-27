// file: src/components/memory/EventCard.tsx — 时间轴单条 event 卡片
'use client';

import { useState } from 'react';
import { useEventStore } from '@/lib/memory/eventStore';
import type { EventType, MemoryEvent } from '@/lib/memory/types';
import { ChevronDownLineIcon, CheckLineIcon, CloseLineIcon } from '@/components/brand/Icons';

interface Props {
  event: MemoryEvent;
}

const TYPE_LABEL: Record<EventType, string> = {
  verify: '安全检查',
  reminder: '提醒响应',
  feedback: '服用反馈',
  observation: 'Hermit 观察',
  correction: '修正',
};

const TYPE_COLOR: Record<EventType, string> = {
  verify: 'text-forest border-forest/30 bg-forest-soft',
  reminder: 'text-stream border-stream/30 bg-stream-soft',
  feedback: 'text-seed border-seed/30 bg-seed-soft',
  observation: 'text-disclaimer-text border-disclaimer-border bg-disclaimer-bg',
  correction: 'text-text-secondary border-border-strong bg-bg-warm',
};

function TypeIcon({ type }: { type: EventType }) {
  // 单线 SVG icon per type
  const stroke = 'currentColor';
  const sw = 1.4;
  const props = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (type) {
    case 'verify':
      // 盾牌
      return (
        <svg {...props}>
          <path d="M8 2 L 13 4 L 13 9 C 13 12, 8 14, 8 14 C 8 14, 3 12, 3 9 L 3 4 Z" />
        </svg>
      );
    case 'reminder':
      // 时钟
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5 L 8 8 L 10.5 9.5" />
        </svg>
      );
    case 'feedback':
      // 对话气泡
      return (
        <svg {...props}>
          <path d="M3 4 L 13 4 L 13 11 L 8 11 L 5 13.5 L 5 11 L 3 11 Z" />
        </svg>
      );
    case 'observation':
      // 嫩芽
      return (
        <svg {...props}>
          <path d="M8 14 L 8 8" />
          <path d="M8 10 C 6 10, 5 8.5, 5 7 C 7 7, 8 8.5, 8 10 Z" />
        </svg>
      );
    case 'correction':
      // 笔
      return (
        <svg {...props}>
          <path d="M3 13 L 5 11 L 11 5 L 13 7 L 7 13 Z M 3 13 L 5 13" />
        </svg>
      );
  }
}

export function EventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(false);
  const appendEvent = useEventStore((s) => s.appendEvent);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const time = event.occurredAt.slice(11, 16);
  const hasDetail = event.userText || event.agentText || (event.metadata && Object.keys(event.metadata).length > 0);

  // Hermit observation 特殊处理 — 显式 accept/dismiss UI（北极星 §7 用户可见可确认）
  const isObservation = event.eventType === 'observation';
  const userAction = (event.metadata?.userAction as string | undefined) ?? 'pending';
  const proposal = event.metadata?.proposal as string | undefined;

  function handleAccept() {
    appendEvent({
      eventType: 'correction',
      personId: event.personId,
      entityRefs: event.entityRefs,
      userText: '接受 Hermit 提案',
      tags: ['observation-accepted'],
      metadata: {
        targetObservationId: event.eventId,
      },
    });
    // 标记原 observation 为 accepted（重写 metadata）
    removeEvent(event.eventId);
    appendEvent({
      eventType: 'observation',
      personId: event.personId,
      entityRefs: event.entityRefs,
      agentText: event.agentText,
      tags: event.tags,
      metadata: { ...event.metadata, userAction: 'accepted' },
    });
  }
  function handleDismiss() {
    appendEvent({
      eventType: 'correction',
      personId: event.personId,
      entityRefs: event.entityRefs,
      userText: '忽略 Hermit 提案',
      tags: ['observation-dismissed'],
      metadata: {
        targetObservationId: event.eventId,
      },
    });
    removeEvent(event.eventId);
    appendEvent({
      eventType: 'observation',
      personId: event.personId,
      entityRefs: event.entityRefs,
      agentText: event.agentText,
      tags: event.tags,
      metadata: { ...event.metadata, userAction: 'dismissed' },
    });
  }

  return (
    <div className={`border rounded-card px-3 py-2 ${TYPE_COLOR[event.eventType]}`}>
      <div className="flex items-start gap-2">
        <span className="shrink-0 mt-0.5">
          <TypeIcon type={event.eventType} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-medium">{TYPE_LABEL[event.eventType]}</span>
            <span className="text-[10.5px] opacity-60">{time}</span>
          </div>
          {event.userText && !expanded && (
            <p className="text-[12.5px] mt-0.5 truncate text-text-primary opacity-90">
              {event.userText}
            </p>
          )}
          {event.entityRefs.length > 0 && !expanded && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {event.entityRefs.slice(0, 3).map((ref) => (
                <span key={ref} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-white/50 border border-current/20 text-text-secondary">
                  {ref}
                </span>
              ))}
              {event.entityRefs.length > 3 && (
                <span className="text-[10px] text-text-tertiary">+{event.entityRefs.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {hasDetail && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-text-tertiary hover:text-text-primary p-0.5"
            aria-label={expanded ? '收起' : '展开'}
          >
            <ChevronDownLineIcon
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Observation 显式呈现 + accept/dismiss（北极星 §7） */}
      {isObservation && (
        <div className="mt-2 pt-2 border-t border-current/15">
          {event.agentText && (
            <p className="text-[12.5px] text-text-primary leading-relaxed mb-1.5">
              {event.agentText}
            </p>
          )}
          {proposal && (
            <p className="text-[11.5px] text-disclaimer-text bg-bg-warm rounded-sm px-2 py-1 mb-2">
              💡 {proposal}
            </p>
          )}
          {userAction === 'pending' && (
            <div className="flex gap-1.5">
              <button
                onClick={handleAccept}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest text-white text-[11px] hover:bg-forest-2"
              >
                <CheckLineIcon className="w-2.5 h-2.5" />
                接受
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border-strong text-text-secondary text-[11px] hover:bg-bg-warm"
              >
                <CloseLineIcon className="w-2.5 h-2.5" />
                忽略
              </button>
            </div>
          )}
          {userAction === 'accepted' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-forest">
              <CheckLineIcon className="w-2.5 h-2.5" />
              已接受
            </span>
          )}
          {userAction === 'dismissed' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
              <CloseLineIcon className="w-2.5 h-2.5" />
              已忽略
            </span>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/10 space-y-1.5 text-[12px]">
          {event.userText && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">用户</div>
              <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{event.userText}</p>
            </div>
          )}
          {event.agentText && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Agent</div>
              <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{event.agentText}</p>
            </div>
          )}
          {event.entityRefs.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">关联</div>
              <div className="flex gap-1 flex-wrap">
                {event.entityRefs.map((ref) => (
                  <span key={ref} className="text-[10.5px] px-1.5 py-0.5 rounded-sm bg-white/50 border border-current/20">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}
          {event.tags.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">标签</div>
              <div className="flex gap-1 flex-wrap">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-[10.5px] text-text-secondary">#{tag}</span>
                ))}
              </div>
            </div>
          )}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <details className="text-[10.5px] text-text-tertiary">
              <summary className="cursor-pointer hover:text-text-secondary">原始数据</summary>
              <pre className="mt-1 overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
