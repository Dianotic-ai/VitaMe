// file: src/app/intake/page.tsx — W2-E 上下文采集页：4 道 mock 问题（多选/单选混合），提交后跳 /result

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { LogoMark } from '@/components/LogoMark';
import type { Question } from '@/lib/types/query';

import { MOCK_INTAKE_QUESTIONS } from '@/lib/mocks/uiMocks';
import { buildLookupRequest } from '@/lib/api/slugMappings';

const LOOKUP_STORAGE_KEY = 'VITAME_LOOKUP_REQUEST';

type Status = 'loading' | 'ready' | 'submitting' | 'error';
type Answers = Record<string, string[] | string>;

function IntakeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryText = searchParams.get('q') ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const id = window.setTimeout(() => setStatus('ready'), 500);
    return () => window.clearTimeout(id);
  }, []);

  const toggleMulti = (qid: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [qid]: next };
    });
  };

  const setSingle = (qid: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: option }));
  };

  const missingRequired = MOCK_INTAKE_QUESTIONS.some((q) => {
    if (!q.required) return false;
    const v = answers[q.id];
    if (Array.isArray(v)) return v.length === 0;
    return !v;
  });

  const submit = () => {
    if (missingRequired) return;
    setStatus('submitting');
    try {
      const asArray = (v: string[] | string | undefined): string[] =>
        Array.isArray(v) ? v : v ? [v] : [];
      const lookup = buildLookupRequest({
        query: queryText,
        currentMedications: asArray(answers['current-medications']),
        chronicConditions: asArray(answers['chronic-conditions']),
        specialGroups: asArray(answers['special-groups']),
      });
      const sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(
        LOOKUP_STORAGE_KEY,
        JSON.stringify({ sessionId, request: lookup, queryText }),
      );
      router.push('/result');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'loading' || status === 'submitting') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-10">
        <div className="h-6 w-32 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-border-subtle" />
        <div className="h-28 w-full animate-pulse rounded-lg bg-border-subtle" />
        <p className="text-sm text-text-secondary">
          {status === 'loading' ? '正在准备问题…' : '正在根据你的回答判断…'}
        </p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-10">
        <h2 className="text-xl font-semibold text-text-primary">提交出了点问题</h2>
        <p className="text-sm text-text-secondary">请返回重新输入，或稍后再试。</p>
        <button
          type="button"
          onClick={() => router.push('/query')}
          className="min-h-[44px] w-fit rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-primary transition hover:bg-bg-warm"
        >
          返回输入页
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-5 py-8">
      <header className="flex items-center gap-2">
        <LogoMark size={28} aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
        <span className="text-text-disabled">·</span>
        <span className="text-sm tracking-wide text-text-secondary">上下文</span>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold leading-tight text-text-primary">
          再问你 4 个问题
        </h1>
        {queryText && (
          <p className="text-sm text-text-secondary">
            你要查的是：<span className="font-medium text-text-primary">{queryText}</span>
          </p>
        )}
        <p className="text-sm leading-6 text-text-secondary">
          只问与判断直接相关的。不会存你的名字、地址或身份证（CLAUDE.md §11.8）。
        </p>
      </section>

      <ol className="flex flex-col gap-6">
        {MOCK_INTAKE_QUESTIONS.map((q, index) => (
          <li
            key={q.id}
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-elev-1"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm text-text-secondary">
                问题 {index + 1} / {MOCK_INTAKE_QUESTIONS.length}
              </p>
              <h2 className="text-base font-semibold text-text-primary">
                {q.promptZh}
                {q.required && <span className="ml-1 text-risk-red">*</span>}
              </h2>
              {q.reasonHint && <p className="text-sm text-text-secondary">{q.reasonHint}</p>}
            </div>
            <QuestionOptions
              question={q}
              value={answers[q.id]}
              onToggleMulti={(opt) => toggleMulti(q.id, opt)}
              onSelectSingle={(opt) => setSingle(q.id, opt)}
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={missingRequired}
          className="min-h-[48px] rounded-lg bg-vita-brown px-5 text-base font-medium text-white shadow-elev-1 transition hover:shadow-elev-2 disabled:cursor-not-allowed disabled:bg-vita-brown/40 disabled:shadow-none"
        >
          查看安全判断结果
        </button>
        {missingRequired && (
          <p className="text-xs text-text-secondary">带 * 的问题是必答项，填好后才能继续。</p>
        )}
      </div>
    </main>
  );
}

function QuestionOptions({
  question,
  value,
  onToggleMulti,
  onSelectSingle,
}: {
  question: Question;
  value: string[] | string | undefined;
  onToggleMulti: (opt: string) => void;
  onSelectSingle: (opt: string) => void;
}) {
  if (!question.options) return null;
  const multi = question.answerType === 'multi';
  const selectedArray = Array.isArray(value) ? value : [];
  const selectedSingle = typeof value === 'string' ? value : '';

  return (
    <ul className="flex flex-wrap gap-2">
      {question.options.map((option) => {
        const active = multi ? selectedArray.includes(option) : selectedSingle === option;
        return (
          <li key={option}>
            <button
              type="button"
              onClick={() => (multi ? onToggleMulti(option) : onSelectSingle(option))}
              className={[
                'min-h-[40px] rounded-full border px-3 text-sm transition',
                active
                  ? 'border-vita-brown bg-vita-brown text-white'
                  : 'border-border-strong bg-surface text-text-primary hover:border-vita-brown hover:text-vita-brown',
              ].join(' ')}
              aria-pressed={active}
            >
              {option}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-10">
          <div className="h-6 w-32 animate-pulse rounded-md bg-border-subtle" />
          <div className="h-28 w-full animate-pulse rounded-lg bg-border-subtle" />
        </main>
      }
    >
      <IntakeInner />
    </Suspense>
  );
}
