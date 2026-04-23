// file: src/components/SymptomCandidateList.tsx — 症状候选成分列表（DESIGN.md §4.9 / CLAUDE.md §11.14 / v2.8）

'use client';

import type {
  SymptomIngredientCandidate,
  SymptomIngredientEntry,
} from '@/lib/db/symptom-ingredients';

interface Props {
  /**
   * 上游 lookupSymptomCandidates() 已过滤 + 去重后的命中症状条目（按输入顺序，每个 symptom 一条）。
   * 本组件会把所有 entry 的 candidates 扁平化、按 ingredientSlug 去重后渲染前 5 条卡片；
   * 不显示 rank / 评分 / 星级（CLAUDE.md §11.14）。
   */
  matched: readonly SymptomIngredientEntry[];
  /** 用户点击「查这个安不安全 →」时触发，进入 product_safety_check 子流程。 */
  onPickIngredient: (slug: string) => void;
  /**
   * 可选：把 ingredientSlug 映射成中文展示名。
   * 未提供 / 未命中时回退到 slug 本身（这种情况上游应在 grounding 阶段就处理掉）。
   */
  ingredientNameZhBySlug?: Readonly<Record<string, string>>;
  className?: string;
}

const MAX_CARDS = 5;

const FOOTNOTE_PREFIX = '以下成分常被关联到这类需求，';
const FOOTNOTE_EMPHASIS = '不构成医疗建议';
const FOOTNOTE_SUFFIX = '。点击任一项做安全核查。';

const EMPTY_COPY =
  '暂未找到相关候选成分。换个说法试试，或直接问某个具体成分能不能吃。';

function classes(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * 把多个 symptom entry 的 candidates 扁平化、按 ingredientSlug 去重，保持首次出现顺序。
 * 不参与排序 / 评分 — 上游 lookupSymptomCandidates 已按输入顺序定下命中顺序。
 */
function flattenCandidates(
  matched: readonly SymptomIngredientEntry[],
): SymptomIngredientCandidate[] {
  const seen = new Set<string>();
  const out: SymptomIngredientCandidate[] = [];
  for (const entry of matched) {
    for (const c of entry.candidates) {
      if (seen.has(c.ingredientSlug)) continue;
      seen.add(c.ingredientSlug);
      out.push(c);
    }
  }
  return out;
}

export function SymptomCandidateList({
  matched,
  onPickIngredient,
  ingredientNameZhBySlug,
  className,
}: Props) {
  const candidates = flattenCandidates(matched).slice(0, MAX_CARDS);
  const isEmpty = candidates.length === 0;

  return (
    <section
      aria-label="症状相关候选成分"
      className={classes('flex flex-col gap-3', className)}
    >
      <p className="text-xs leading-5 text-text-secondary">
        {isEmpty ? (
          EMPTY_COPY
        ) : (
          <>
            {FOOTNOTE_PREFIX}
            <span className="font-semibold text-text-primary">
              {FOOTNOTE_EMPHASIS}
            </span>
            {FOOTNOTE_SUFFIX}
          </>
        )}
      </p>

      {!isEmpty && (
        <ul className="flex flex-col gap-3" role="list">
          {candidates.map((candidate) => {
            const nameZh =
              ingredientNameZhBySlug?.[candidate.ingredientSlug] ??
              candidate.ingredientSlug;
            const firstSource = candidate.sourceRefs[0];
            return (
              <li
                key={candidate.ingredientSlug}
                className="rounded-xl border border-border-subtle bg-surface p-4 shadow-elev-1"
              >
                <div className="flex flex-col gap-2">
                  <h4 className="text-base font-semibold leading-snug text-text-primary md:text-lg">
                    {nameZh}
                  </h4>
                  <p className="text-[13px] leading-6 text-text-secondary">
                    {candidate.evidenceNote}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {firstSource ? (
                      <span
                        className="inline-flex items-center rounded border border-border-subtle px-1.5 py-0.5 text-[11px] leading-none text-text-secondary"
                        aria-label={`证据来源：${firstSource.source} ${firstSource.id}`}
                      >
                        {firstSource.source} · {firstSource.id}
                      </span>
                    ) : (
                      <span aria-hidden className="inline-block" />
                    )}
                    <button
                      type="button"
                      onClick={() => onPickIngredient(candidate.ingredientSlug)}
                      aria-label={`查 ${nameZh} 安不安全`}
                      className="min-h-[44px] rounded-md px-2 py-1 text-sm font-medium text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                    >
                      查这个安不安全 →
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default SymptomCandidateList;
