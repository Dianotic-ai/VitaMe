// file: src/app/archive/page.tsx — W2-E 档案列表页：历史 Archive 快照，点卡片跳 /recheck?id=...

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LogoMark } from '@/components/LogoMark';
import { RiskBadge } from '@/components/RiskBadge';
import { SeedSproutStage } from '@/components/SeedSproutStage';
import { useArchiveStore } from '@/lib/archive/archiveStore';
import { PERSON_LABEL_ZH } from '@/lib/mocks/uiMocks';
import type { ArchiveEntry } from '@/lib/types/archive';

type Status = 'loading' | 'ready' | 'error';

export default function ArchivePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const allEntries = useArchiveStore((s) => s.archive.entries);

  useEffect(() => {
    // hydration 完成后即可显示（Zustand persist 在客户端会先 rehydrate）
    const id = window.setTimeout(() => setStatus('ready'), 100);
    return () => window.clearTimeout(id);
  }, []);

  const entries = [...allEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-10">
        <div className="h-6 w-32 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-10 w-2/3 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-border-subtle" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-border-subtle" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-border-subtle" />
        <p className="text-sm text-text-secondary">正在加载档案…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-10">
        <h2 className="text-xl font-semibold text-text-primary">档案加载失败</h2>
        <p className="text-sm text-text-secondary">
          可能是本地存储不可用。你可以重试，或先发起一次新的查询。
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStatus('loading')}
            className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-primary transition hover:bg-bg-warm"
          >
            重试
          </button>
          <button
            type="button"
            onClick={() => router.push('/query')}
            className="min-h-[44px] rounded-lg bg-vita-brown px-4 text-sm text-white shadow-elev-1"
          >
            发起新查询
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-2">
        <LogoMark size={28} aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
        <span className="text-text-disabled">·</span>
        <span className="text-sm tracking-wide text-text-secondary">档案</span>
      </header>

      <section className="flex items-center gap-4 rounded-2xl bg-bg-warm px-5 py-5">
        <SeedSproutStage stage="fruit" size={64} aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="font-serif text-xl font-semibold leading-tight text-text-primary">
            过往的查询与判断
          </h1>
          <p className="text-sm leading-6 text-text-secondary">
            点任意一条即可重新检查 — VitaMe 会用最新的规则和你最新的上下文再判断一次。
          </p>
        </div>
      </section>

      {entries.length === 0 ? (
        <p className="text-sm text-text-secondary">还没有档案。先回到首页发起一次查询吧。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <ArchiveCard
                entry={entry}
                onClick={() => router.push(`/recheck?id=${encodeURIComponent(entry.id)}`)}
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => router.push('/query')}
        className="min-h-[48px] w-full rounded-lg border border-border-strong bg-surface px-5 text-base font-medium text-text-primary transition hover:bg-bg-warm"
      >
        ＋ 发起新的查询
      </button>
    </main>
  );
}

function ArchiveCard({ entry, onClick }: { entry: ArchiveEntry; onClick: () => void }) {
  const date = new Date(entry.createdAt);
  const dateLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const personLabel = PERSON_LABEL_ZH[entry.personId] ?? entry.personId;
  const ingredientLabel = entry.queryInput.ingredients.join('、') || '（未记录）';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 text-left shadow-elev-1 transition hover:border-border-strong hover:shadow-elev-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary">
            {dateLabel} · {personLabel}
          </span>
          <span className="text-base font-semibold text-text-primary">{ingredientLabel}</span>
        </div>
        <RiskBadge level={entry.overallLevel} size="sm" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">
          当时输入方式：{entry.queryInput.source === 'ocr' ? '拍照识别' : '文字输入'}
        </span>
        <span className="text-xs text-link">重新检查 →</span>
      </div>
    </button>
  );
}
