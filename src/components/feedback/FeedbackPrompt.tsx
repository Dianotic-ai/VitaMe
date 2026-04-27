// file: src/components/feedback/FeedbackPrompt.tsx — 单问题反馈弹窗（北极星 §4）
'use client';

import { useState, type FormEvent } from 'react';
import type { FeedbackTrigger } from '@/lib/feedback/triggerRule';
import { detectUrgent } from '@/lib/feedback/triggerRule';
import { CloseLineIcon } from '@/components/brand/Icons';

interface Props {
  trigger: FeedbackTrigger;
  onSubmit: (result: FeedbackResult) => void;
  onSkip: () => void;
}

export interface FeedbackResult {
  supplementId: string;
  question: 'taken' | 'feeling' | 'time-adjust';
  answer: string;
  freeText?: string;
  urgent?: boolean;
}

export function FeedbackPrompt({ trigger, onSubmit, onSkip }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');

  const question = QUESTIONS[trigger.questionVariant];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const urgent = detectUrgent(freeText);
    onSubmit({
      supplementId: trigger.supplementId,
      question: trigger.questionVariant,
      answer: selected,
      freeText: freeText.trim() || undefined,
      urgent,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/40" onClick={onSkip} aria-hidden="true" />
      <div className="relative mt-auto bg-bg-warm rounded-t-[20px] shadow-elev-3 max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="flex items-start justify-between px-5 pt-1 pb-2 border-b border-border-subtle">
          <div>
            <h2 className="font-serif text-base font-semibold text-text-primary">
              问你一个问题
            </h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              帮我们更懂你的反应 · 全部可跳过
            </p>
          </div>
          <button onClick={onSkip} className="text-text-tertiary hover:text-text-primary p-1 -mr-1" aria-label="跳过">
            <CloseLineIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[14px] text-text-primary leading-relaxed">
              {question.prompt(trigger.supplementMention)}
            </p>
          </div>

          <div className="space-y-1.5">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={
                  selected === opt.value
                    ? 'w-full text-left px-3.5 py-2.5 rounded-card bg-forest text-white text-[13.5px]'
                    : 'w-full text-left px-3.5 py-2.5 rounded-card bg-surface border border-border-subtle text-text-primary text-[13.5px] hover:border-forest/40 transition-colors'
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 可选自由文本（用于'感觉如何'后细化） */}
          {selected && trigger.questionVariant === 'feeling' && (
            <div>
              <label className="block text-[11.5px] text-text-tertiary mb-1">具体感受（可选）</label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="例如：早上更有精神 / 偶尔有点反酸"
                rows={2}
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border-subtle rounded-card outline-none focus:border-forest placeholder:text-text-tertiary"
              />
              {detectUrgent(freeText) && (
                <p className="text-[11.5px] text-risk-red mt-1.5 leading-relaxed">
                  ⚠ 检测到严重不适关键词。请优先咨询医生或药师，必要时拨打急救电话。
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-3 py-2.5 rounded-card border border-border-subtle text-text-secondary text-[13px] hover:bg-bg-warm"
            >
              跳过这次
            </button>
            <button
              type="submit"
              disabled={!selected}
              className="flex-1 px-3 py-2.5 rounded-card bg-forest text-white text-[13px] disabled:bg-border-strong disabled:cursor-not-allowed hover:bg-forest-2 transition-colors"
            >
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface QuestionDef {
  prompt: (supplementName: string) => string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Record<FeedbackTrigger['questionVariant'], QuestionDef> = {
  taken: {
    prompt: (name) => `今天吃 ${name} 了吗？`,
    options: [
      { value: 'yes', label: '吃了 ✓' },
      { value: 'no', label: '还没吃' },
      { value: 'skip-today', label: '今天跳过' },
    ],
  },
  feeling: {
    prompt: (name) => `最近吃 ${name} 后，感觉怎么样？`,
    options: [
      { value: 'better', label: '有改善' },
      { value: 'same', label: '没什么感觉' },
      { value: 'worse', label: '不太舒服' },
      { value: 'too-early', label: '太早不好说' },
    ],
  },
  'time-adjust': {
    prompt: (name) => `${name} 现在的服用时间还合适吗？`,
    options: [
      { value: 'good', label: '合适' },
      { value: 'too-early', label: '想往后挪' },
      { value: 'too-late', label: '想往前挪' },
      { value: 'forget-often', label: '老是忘' },
    ],
  },
};
