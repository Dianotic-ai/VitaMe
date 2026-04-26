// file: src/components/chat/MessageBubble.tsx — 单条消息气泡
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { CitationPill } from './CitationPill';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  /** assistant 在流式过程中打字光标 */
  isStreaming?: boolean;
}

/**
 * 把 [来源: NIH ODS XX] 这种引证标记拆出来作为 React 组件渲染
 * 输入 plaintext，输出 React node 数组（保留其他 markdown 由 ReactMarkdown 处理）
 *
 * 注意：这一层只在最外层 split，如果引证出现在 markdown 内部（如 list item 文本里），
 *       react-markdown 仍会先把整段文本作为 text node 渲染，引证不会被拆。
 *       因此 v0.3 选择：在 markdown 渲染**之前**做替换，避免穿过 markdown 结构。
 *       具体：用占位符 ⟦CITE:N⟧ 替换原文，渲染完后用自定义 component 替换占位符。
 *       但这需要遍历 react tree，太重。简化方案：直接在文本层 split。
 */
function renderTextWithCitations(text: string): ReactNode[] {
  // 匹配 [来源: ...]（中英文括号都接受）
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

export function MessageBubble({ role, text, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-emerald-600 text-white text-sm leading-relaxed'
            : 'max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white text-text-primary text-sm leading-relaxed border border-gray-200 shadow-sm'
        }
      >
        {isUser ? (
          // 用户消息：plaintext，不渲染 markdown
          <span className="whitespace-pre-wrap">{text}</span>
        ) : (
          // 助手消息：markdown + 引证 chip
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:font-semibold">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p>{processChildren(children)}</p>,
                li: ({ children }) => <li>{processChildren(children)}</li>,
              }}
            >
              {text}
            </ReactMarkdown>
            {isStreaming && <span className="inline-block w-1 h-3 ml-0.5 bg-emerald-600 animate-pulse" />}
          </div>
        )}
      </div>
    </div>
  );
}

/** 在 markdown 渲染的叶子节点上做 citation 替换 */
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
