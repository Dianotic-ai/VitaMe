// file: src/components/chat/EmptyState.tsx — 首屏空状态（HeroSeedSprout + 3 颗种子问题）
// PR-PLAN.md §3.6
'use client';

import { HeroSeedSprout } from '@/components/brand/HeroSeedSprout';
import { ChevronRightLineIcon } from '@/components/brand/Icons';

const SEED_QUESTIONS = [
  '我妈在吃华法林，能吃辅酶 Q10 吗？',
  '经常熬夜，吃什么补一补？',
  '孕期能补维生素 D 吗？',
];

interface Props {
  onSeed: (question: string) => void;
}

export function EmptyState({ onSeed }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-8 bg-bg-warm-2 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="flex justify-center mb-5">
          <HeroSeedSprout size={120} />
        </div>
        <h2 className="font-serif text-[22px] leading-[1.35] text-text-primary mb-2.5">
          每个人身体里，
          <br />
          都有自己的答案。
        </h2>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-7 px-2">
          聊聊你想了解的保健品 — 成分、剂量、跟现有用药冲不冲突，我帮你辨别。
        </p>

        <div className="text-left">
          <p className="text-[11px] text-text-tertiary mb-2 pl-1">从一颗种子问题开始</p>
          <div className="space-y-1.5">
            {SEED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSeed(q)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-card bg-surface/80 border border-border-subtle text-left hover:border-seed/50 hover:bg-surface transition-colors group"
              >
                <span className="text-[13px] text-text-primary leading-snug">{q}</span>
                <ChevronRightLineIcon className="w-3 h-3 text-text-tertiary group-hover:text-seed shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
