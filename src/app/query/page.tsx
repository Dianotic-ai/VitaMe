// file: src/app/query/page.tsx — L0 query intake 入口：单页状态机驱动 IntakeOutcome 4 分支
//
// 流程（intakeOrchestrator.ts §IntakeOutcome）：
//   ready → 用户输入 → POST /api/intent → 分发 outcome.kind：
//     pass_through       → 写 sessionStorage(LookupRequest) → router.push('/result')
//     clarify_needed     → 渲染 <ClarifyBubble>，pick → 累加 history → 重投 /api/intent（max 2 轮）
//     symptom_candidates → 渲染 <SymptomCandidateList>，pick(slug) → 直接构造 LookupRequest 跳 /result
//     unsupported        → 渲染 <IntentFallbackForm>，submit → 重投 /api/intent

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ClarifyBubble } from '@/components/ClarifyBubble';
import { DisclaimerBlock } from '@/components/DisclaimerBlock';
import { IntentFallbackForm } from '@/components/IntentFallbackForm';
import { LogoMark } from '@/components/LogoMark';
import { SeedSproutHero } from '@/components/SeedSproutHero';
import { SeedSproutStage } from '@/components/SeedSproutStage';
import { SymptomCandidateList } from '@/components/SymptomCandidateList';
import { ApiClientError, postIntent } from '@/lib/api/client';
import { EXAMPLE_QUERIES } from '@/lib/mocks/uiMocks';
import type { IntakeOutcome } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import type { ClarifyTurn } from '@/lib/types/intent';
import type { LookupRequest } from '@/lib/types/adapter';

const LOOKUP_STORAGE_KEY = 'VITAME_LOOKUP_REQUEST';
const MAX_CLARIFY_ROUNDS = 2;

type Phase = 'ready' | 'loading' | 'outcome' | 'error';

function newSessionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistLookup(sessionId: string, request: LookupRequest, queryText: string): void {
  window.sessionStorage.setItem(
    LOOKUP_STORAGE_KEY,
    JSON.stringify({ sessionId, request, queryText }),
  );
}

export default function QueryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('ready');
  const [input, setInput] = useState('');
  const [outcome, setOutcome] = useState<IntakeOutcome | null>(null);
  const [history, setHistory] = useState<ClarifyTurn[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [originalQuery, setOriginalQuery] = useState<string>('');

  async function callIntent(rawQuery: string, opts?: { history?: ClarifyTurn[]; sessionId?: string }) {
    const sid = opts?.sessionId ?? newSessionId();
    setSessionId(sid);
    setPhase('loading');
    try {
      const result = await postIntent({
        sessionId: sid,
        rawQuery,
        history: opts?.history,
      });
      handleOutcome(result, rawQuery);
    } catch (err) {
      const msg = err instanceof ApiClientError ? `${err.kind}: ${err.message}` : String(err);
      setErrorMsg(msg);
      setPhase('error');
    }
  }

  function handleOutcome(result: IntakeOutcome, queryForResult: string): void {
    if (result.kind === 'pass_through') {
      persistLookup(result.sessionId, result.lookupRequest, queryForResult);
      router.push('/result');
      return;
    }
    setOutcome(result);
    setPhase('outcome');
  }

  function submitInitial(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOriginalQuery(trimmed);
    setHistory([]);
    setOutcome(null);
    void callIntent(trimmed);
  }

  function handleClarifyPick(choice: string): void {
    if (!outcome || outcome.kind !== 'clarify_needed') return;
    const nextHistory: ClarifyTurn[] = [
      ...history,
      { topic: outcome.topic, userChoice: choice },
    ];
    setHistory(nextHistory);
    if (nextHistory.length >= MAX_CLARIFY_ROUNDS) {
      // 触顶 → 让 LLM 用现有上下文最后一搏；若仍 clarify，UI 把按钮 disable，引导用户走兜底
    }
    void callIntent(originalQuery, { history: nextHistory, sessionId });
  }

  function handleSymptomPick(slug: string): void {
    // 直接构造 LookupRequest，跳过二次 LLM 调用 — 用户意图已明确：查这个成分
    const request: LookupRequest = {
      ingredients: [slug],
      medications: [],
      conditions: [],
      specialGroups: [],
    };
    persistLookup(sessionId || newSessionId(), request, slug);
    router.push('/result');
  }

  function handleFallbackResubmit(text: string): void {
    submitInitial(text);
  }

  function reset(): void {
    setPhase('ready');
    setOutcome(null);
    setHistory([]);
    setErrorMsg('');
  }

  if (phase === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
        <header className="flex items-center gap-2">
          <LogoMark size={28} aria-hidden="true" />
          <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
          <span className="text-text-disabled">·</span>
          <span className="text-sm tracking-wide text-text-secondary">解析中</span>
        </header>
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-bg-warm px-6 py-12 text-center">
          <SeedSproutStage stage="sprout" size={80} className="animate-pulse" aria-hidden="true" />
          <p className="text-sm text-text-secondary">正在为你解析这条问题…</p>
        </section>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
        <header className="flex items-center gap-2">
          <LogoMark size={28} aria-hidden="true" />
          <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
          <span className="text-text-disabled">·</span>
          <span className="text-sm tracking-wide text-text-secondary">出了点小问题</span>
        </header>
        <section className="flex flex-col items-start gap-4">
          <h2 className="font-serif text-xl font-semibold text-text-primary">没能解析这条问题</h2>
          <p className="text-sm text-text-secondary">{errorMsg || '未知错误'}</p>
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-primary transition hover:bg-bg-warm"
          >
            重新开始
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'outcome' && outcome) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
        <header className="flex items-center gap-2">
          <LogoMark size={28} aria-hidden="true" />
          <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
          <span className="text-text-disabled">·</span>
          <span className="text-sm tracking-wide text-text-secondary">解析中</span>
        </header>
        <section className="rounded-xl bg-bg-warm px-4 py-3">
          <p className="text-sm text-text-secondary">
            你问的是：<span className="font-medium text-text-primary">{originalQuery}</span>
          </p>
        </section>

        {outcome.kind === 'clarify_needed' && (
          <ClarifyBubble
            question={outcome.question}
            topic={outcome.topic}
            onPick={handleClarifyPick}
            onOther={handleClarifyPick}
            disabled={history.length >= MAX_CLARIFY_ROUNDS}
          />
        )}

        {outcome.kind === 'symptom_candidates' && (
          <SymptomCandidateList
            matched={outcome.matched}
            onPickIngredient={handleSymptomPick}
          />
        )}

        {outcome.kind === 'unsupported' && (
          <IntentFallbackForm onSubmit={handleFallbackResubmit} />
        )}

        <button
          type="button"
          onClick={reset}
          className="self-start text-xs text-text-secondary underline-offset-2 hover:underline"
        >
          ← 重新输入问题
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-5 py-8">
      <header className="flex items-center gap-2">
        <LogoMark size={32} aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
        <span className="text-text-disabled">·</span>
        <span className="text-sm tracking-wide text-text-secondary">查一查</span>
      </header>

      <SeedSproutHero />

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitInitial(input);
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">想问什么</span>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="如 我妈在吃华法林，能吃辅酶 Q10 吗？"
            className="min-h-[48px] rounded-lg border border-border-strong bg-surface px-4 text-base text-text-primary placeholder:text-text-disabled focus:border-vita-brown focus:outline-none"
            autoFocus
          />
        </label>
        <button
          type="submit"
          disabled={!input.trim()}
          className="min-h-[48px] rounded-lg bg-vita-brown px-5 text-base font-medium text-white shadow-elev-1 transition hover:shadow-elev-2 disabled:cursor-not-allowed disabled:bg-vita-brown/40 disabled:shadow-none"
        >
          下一步
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">不知道怎么问？点一个例子试试：</p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => {
                  setInput(example);
                  submitInitial(example);
                }}
                className="min-h-[36px] rounded-full border border-border-strong bg-surface px-3 text-sm text-text-primary transition hover:border-vita-brown hover:text-vita-brown"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <DisclaimerBlock className="-mx-5 mt-auto" />
    </main>
  );
}
