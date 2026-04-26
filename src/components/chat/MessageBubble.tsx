// file: src/components/chat/MessageBubble.tsx — Seed Within 气泡 + sprout 光标
// PR-PLAN.md §3.3
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { CitationPill } from './CitationPill';
import { SproutCursor } from '@/components/brand/SproutCursor';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

function renderTextWithCitations(text: string): ReactNode[] {
  const re = /\[来源:\s*([^\]]+)\]|\[Source:\s*([^\]]+)\]/g;
  const nodes: ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const source = (match[1] ?? match[2] ?? '').trim();
    nodes.push(<CitationPill key={`cite-${i++}`} source={source} />);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

function processChildren(children: ReactNode): ReactNode {
  if (typeof children === 'string') return renderTextWithCitations(children);
  if (Array.isArray(children)) {
    return children.map((c, i) => {
      if (typeof c === 'string') {
        return <span key={i}>{renderTextWithCitations(c)}</span>;
      }
      return c;
    });
  }
  return children;
}

export function MessageBubble({ role, text, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={
          isUser
            ? 'rounded-[14px_14px_4px_14px] bg-forest text-white px-3.5 py-2.5 max-w-[78%] text-[14.5px] leading-relaxed'
            : 'rounded-[4px_14px_14px_14px] bg-surface text-text-primary px-3.5 py-2.5 max-w-[85%] text-[14.5px] leading-relaxed border border-border-subtle shadow-elev-1'
        }
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{text}</span>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:font-semibold prose-headings:text-text-primary prose-strong:text-text-primary">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p>{processChildren(children)}</p>,
                li: ({ children }) => <li>{processChildren(children)}</li>,
              }}
            >
              {text}
            </ReactMarkdown>
            {isStreaming && <SproutCursor />}
          </div>
        )}
      </div>
    </div>
  );
}
