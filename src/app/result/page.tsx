// file: src/app/result/page.tsx — W2-E 核心结果页
//
// 视觉骨架（DESIGN.md §11.1 v2 映射：sprout = 首次出结果）：
//   1. DemoBanner（条件，§11.11）
//   2. LogoMark + VitaMe · 结果 (品牌锁定)
//   3. Overall verdict — 左 sprout 插画 + 右综合 RiskBadge
//   4. RiskCard × N（每成分一卡，含建议 / 形式对比 / 证据来源）
//   5. CTA — 保存档案 / 重查
//   6. DisclaimerBlock（§11.1 红线必挂）

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DemoBanner } from '@/components/DemoBanner';
import { DisclaimerBlock } from '@/components/DisclaimerBlock';
import { LogoMark } from '@/components/LogoMark';
import { RiskBadge } from '@/components/RiskBadge';
import { SeedSproutStage } from '@/components/SeedSproutStage';
import {
  CTA_LABEL_ZH,
  DIMENSION_LABEL_ZH,
  EVIDENCE_GLYPH,
  MOCK_PHARMACIST_REVIEWED,
  MOCK_TRANSLATION_RESULT,
} from '@/lib/mocks/uiMocks';
import { ApiClientError, postJudgment, postTranslation } from '@/lib/api/client';
import type { LookupRequest } from '@/lib/types/adapter';
import type { TranslatedRisk, TranslationResult } from '@/lib/types/risk';

type Status = 'loading' | 'ready' | 'error';

const LOOKUP_STORAGE_KEY = 'VITAME_LOOKUP_REQUEST';

export default function ResultPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [result, setResult] = useState<TranslationResult>(MOCK_TRANSLATION_RESULT);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [usedMock, setUsedMock] = useState<boolean>(false);
  const [queryText, setQueryText] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = window.sessionStorage.getItem(LOOKUP_STORAGE_KEY);
      if (!raw) {
        if (!cancelled) {
          setUsedMock(true);
          setStatus('ready');
        }
        return;
      }
      try {
        const { sessionId, request, queryText: storedQuery } = JSON.parse(raw) as {
          sessionId: string;
          request: LookupRequest;
          queryText?: string;
        };
        if (storedQuery && !cancelled) setQueryText(storedQuery);
        const judgment = await postJudgment({ sessionId, request });
        const translation = await postTranslation({ sessionId, risks: judgment.risks });
        if (cancelled) return;
        setResult(translation);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiClientError ? `${err.kind}: ${err.message}` : String(err);
        setErrorMsg(msg);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
        <header className="flex items-center gap-2">
          <LogoMark size={28} aria-hidden="true" />
          <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
          <span className="text-text-disabled">·</span>
          <span className="text-sm tracking-wide text-text-secondary">生成中</span>
        </header>
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-bg-warm px-6 py-12 text-center">
          <SeedSproutStage stage="sprout" size={80} className="animate-pulse" aria-hidden="true" />
          <p className="text-sm text-text-secondary">正在生成安全判断…</p>
          <p className="text-xs text-text-disabled">查询知识库 · 调用判断引擎 · 翻译为人话</p>
        </section>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-10">
        <h2 className="text-xl font-semibold text-text-primary">结果页暂时不可用</h2>
        <p className="text-sm text-text-secondary">{errorMsg || '你可以返回上一步重新开始查询。'}</p>
        <button
          type="button"
          onClick={() => router.push('/query')}
          className="min-h-[44px] w-fit rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-primary transition hover:bg-bg-warm"
        >
          重新开始
        </button>
        {/* §11.1 — 错误降级页也带 Disclaimer */}
        <DisclaimerBlock className="-mx-5 mt-auto" />
      </main>
    );
  }

  const { overallLevel, translatedRisks } = result;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-5 py-8">
      {/* §11.11 — mock 数据全部 pharmacistReviewed:false，banner 条件恒 true */}
      {!MOCK_PHARMACIST_REVIEWED && <DemoBanner />}

      <header className="flex items-center gap-2">
        <LogoMark size={28} aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text-primary">VitaMe</span>
        <span className="text-text-disabled">·</span>
        <span className="text-sm tracking-wide text-text-secondary">结果</span>
      </header>

      <section
        aria-labelledby="overall-verdict"
        className="flex items-center gap-4 rounded-2xl bg-bg-warm px-5 py-5"
      >
        <SeedSproutStage stage="sprout" size={80} aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-2">
          <h1
            id="overall-verdict"
            className="font-serif text-xl font-semibold leading-tight text-text-primary"
          >
            这是我们的安全判断
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">综合风险等级</span>
            <RiskBadge level={overallLevel} size="md" />
          </div>
          {usedMock && (
            <p className="text-xs text-text-secondary">
              未检测到查询上下文，下方为示例数据。从输入页走完整流程可获取真实判断。
            </p>
          )}
        </div>
      </section>

      {queryText && (
        <section className="rounded-xl bg-bg-warm px-4 py-3">
          <p className="text-sm text-text-secondary">
            你问的是：<span className="font-medium text-text-primary">{queryText}</span>
          </p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {translatedRisks.map((risk, index) => (
          <RiskCard key={`${risk.reasonCode}-${index}`} risk={risk} />
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push('/archive')}
          className="min-h-[48px] flex-1 rounded-lg bg-vita-brown px-5 text-base font-medium text-white shadow-elev-1 transition hover:shadow-elev-2"
        >
          保存到档案
        </button>
        <button
          type="button"
          onClick={() => router.push('/recheck?id=arc-001')}
          className="min-h-[48px] flex-1 rounded-lg border border-border-strong bg-surface px-5 text-base font-medium text-text-primary transition hover:bg-bg-warm"
        >
          补充信息后重新检查
        </button>
      </div>

      {/* §11.1 红线：每个 AI 输出页必挂 DisclaimerBlock */}
      <DisclaimerBlock className="-mx-5 mt-auto" />
    </main>
  );
}

function RiskCard({ risk }: { risk: TranslatedRisk }) {
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
        {risk.fallbackUsed && (
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-xs text-text-secondary">
            模板兜底
          </span>
        )}
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

      {risk.formComparison && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text-secondary">成分形式对比</p>
          <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
            {risk.formComparison.map((form) => (
              <li key={form.form} className="flex items-baseline justify-between gap-3 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary">{form.nameZh}</span>
                  <span className="text-xs text-text-secondary">{form.noteZh}</span>
                </div>
                {typeof form.absorptionRate === 'number' && (
                  <span className="font-mono text-xs text-text-secondary">
                    吸收 {Math.round(form.absorptionRate * 100)}%
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
