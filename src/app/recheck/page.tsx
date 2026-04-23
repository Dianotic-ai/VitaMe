// file: src/app/recheck/page.tsx — W2-E 重查页：基于某条 archive 重新触发判断
//
// 视觉锚（DESIGN.md §11.1 v2）：bloom = 重复用户。Hero 用 bloom 插画暗示"你回来了"。

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { DemoBanner } from '@/components/DemoBanner';
import { DisclaimerBlock } from '@/components/DisclaimerBlock';
import { LogoMark } from '@/components/LogoMark';
import { RiskBadge } from '@/components/RiskBadge';
import { SeedSproutStage } from '@/components/SeedSproutStage';
import {
  CTA_LABEL_ZH,
  DIMENSION_LABEL_ZH,
  EVIDENCE_GLYPH,
  MOCK_ARCHIVE_ENTRIES,
  MOCK_PHARMACIST_REVIEWED,
  MOCK_TRANSLATION_RESULT,
} from '@/lib/mocks/uiMocks';
import type { TranslatedRisk } from '@/lib/types/risk';

type Status = 'loading' | 'ready' | 'error';

function RecheckInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archiveId = searchParams.get('id') ?? MOCK_ARCHIVE_ENTRIES[0]?.id ?? '';
  const entry = MOCK_ARCHIVE_ENTRIES.find((e) => e.id === archiveId);

  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const id = window.setTimeout(() => setStatus('ready'), 900);
    return () => window.clearTimeout(id);
  }, []);

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-10">
        <div className="h-6 w-32 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-border-subtle" />
        <div className="h-16 w-full animate-pulse rounded-lg bg-border-subtle" />
        <div className="h-36 w-full animate-pulse rounded-xl bg-border-subtle" />
        <div className="h-36 w-full animate-pulse rounded-xl bg-border-subtle" />
        <p className="text-sm text-text-secondary">正在基于最新规则重新判断…</p>
      </main>
    );
  }

  if (status === 'error' || !entry) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-10">
        <h2 className="text-xl font-semibold text-text-primary">
          {entry ? '重查失败' : '没找到这条档案'}
        </h2>
        <p className="text-sm text-text-secondary">
          {entry
            ? '重新判断时出了问题，你可以稍后再试。'
            : '这条档案可能已被清理，请回到档案列表选择另一条。'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/archive')}
          className="min-h-[44px] w-fit rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-primary transition hover:bg-bg-warm"
        >
          返回档案列表
        </button>
        {/* §11.1 防御性挂法：降级页也带 Disclaimer */}
        <DisclaimerBlock className="-mx-5 mt-auto" />
      </main>
    );
  }

  const lastDate = new Date(entry.createdAt);
  const lastDateLabel = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(
    lastDate.getDate(),
  ).padStart(2, '0')}`;
  const { overallLevel: prevLevel } = entry;
  const { overallLevel, translatedRisks } = MOCK_TRANSLATION_RESULT;
  const changed = prevLevel !== overallLevel;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
      {!MOCK_PHARMACIST_REVIEWED && <DemoBanner />}

      <header className="flex items-center gap-2">
        <LogoMark size={28} aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
        <span className="text-text-disabled">·</span>
        <span className="text-sm tracking-wide text-text-secondary">重查</span>
      </header>

      <section
        aria-labelledby="recheck-verdict"
        className="flex items-center gap-4 rounded-2xl bg-bg-warm px-5 py-5"
      >
        <SeedSproutStage stage="bloom" size={80} aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-2">
          <h1
            id="recheck-verdict"
            className="font-serif text-xl font-semibold leading-tight text-text-primary"
          >
            重新检查的结果
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">综合风险等级</span>
            <RiskBadge level={overallLevel} size="md" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-warm p-4">
        <p className="text-xs tracking-wide text-text-secondary">与上次对比</p>
        <div className="flex items-center gap-3 text-sm text-text-primary">
          <span>上次检查：{lastDateLabel}</span>
          <RiskBadge level={prevLevel} size="sm" />
          <span className="text-text-disabled">→</span>
          <span>本次</span>
          <RiskBadge level={overallLevel} size="sm" />
        </div>
        <p className="text-sm text-text-secondary">
          {changed
            ? '等级发生变化 — 以下是这次判断的细节。'
            : '等级与上次一致。规则或上下文无明显改变时保持稳定是正常的。'}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        {translatedRisks.map((risk, index) => (
          <RecheckRiskCard key={`${risk.reasonCode}-${index}`} risk={risk} />
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push('/archive')}
          className="min-h-[48px] flex-1 rounded-lg border border-border-strong bg-surface px-5 text-base font-medium text-text-primary transition hover:bg-bg-warm"
        >
          返回档案
        </button>
        <button
          type="button"
          onClick={() => router.push('/query')}
          className="min-h-[48px] flex-1 rounded-lg bg-vita-brown px-5 text-base font-medium text-white shadow-elev-1 transition hover:shadow-elev-2"
        >
          发起新的查询
        </button>
      </div>

      {/* §11.1 红线：每个 AI 输出页必挂 DisclaimerBlock */}
      <DisclaimerBlock className="-mx-5 mt-auto" />
    </main>
  );
}

function RecheckRiskCard({ risk }: { risk: TranslatedRisk }) {
  const dimensionLabel = DIMENSION_LABEL_ZH[risk.dimension];
  const ctaLabel = CTA_LABEL_ZH[risk.cta];
  const glyph = EVIDENCE_GLYPH[risk.evidence.sourceType] ?? '📄';

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-elev-1">
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={risk.level} />
        <span className="rounded-full border border-border-subtle px-2 py-0.5 text-xs text-text-secondary">
          {dimensionLabel}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-text-primary">{risk.ingredient}</h2>
        <p className="text-sm text-text-secondary">{risk.reasonShort}</p>
      </div>
      <p className="text-[15px] leading-7 text-text-primary">{risk.translation}</p>
      <div className="rounded-lg bg-bg-warm p-3">
        <p className="text-xs font-medium text-text-secondary">建议</p>
        <p className="text-sm leading-6 text-text-primary">{risk.avoidance}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span aria-hidden="true">{glyph}</span>
          <span className="font-mono">{risk.evidence.sourceRef}</span>
          <span>· 置信度 {risk.evidence.confidence}</span>
        </div>
        <span className="rounded-full bg-bg-warm px-2 py-0.5 text-xs text-text-primary">
          下一步：{ctaLabel}
        </span>
      </div>
    </article>
  );
}

export default function RecheckPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-10">
          <div className="h-6 w-32 animate-pulse rounded-md bg-border-subtle" />
          <div className="h-36 w-full animate-pulse rounded-xl bg-border-subtle" />
        </main>
      }
    >
      <RecheckInner />
    </Suspense>
  );
}
