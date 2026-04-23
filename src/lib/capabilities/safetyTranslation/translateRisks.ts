// file: src/lib/capabilities/safetyTranslation/translateRisks.ts — L3 主流程：Risk[] → TranslationResult
//
// 流程（每条 Risk 独立翻译，Promise.all 并发；单条失败不影响其他）：
//   1) buildPrompt(risk) → LLMClient.chat
//   2) error → fallback
//   3) parseLLMResponse → schema 失败 → fallback
//   4) bannedWordsFilter 命中 → fallback
//   5) 否则用 LLM 输出
// 并发说明：translateOne 全程纯函数 + 不共享状态，N 条 risk 一次 Promise.all。
// 总耗时从 N×LLM_RTT 降到 max(LLM_RTT)；overallLevel 仍以 input.risks 算（与翻译解耦）。
// disclaimer 永远非空（CLAUDE.md §11.1 红线），文案锁定为 DESIGN.md §4.2。

import type { LLMClient } from '@/lib/adapters/llm/types';
import type { Risk, RiskLevel, TranslatedRisk, TranslationResult } from '@/lib/types/risk';
import { containsBannedWords } from '@/lib/capabilities/compliance/bannedWordsFilter';
import { buildPrompt } from './promptBuilder';
import { parseLLMResponse } from './responseSchema';
import { renderFallback } from './templates';

// 文案与 DESIGN.md §4.2 保持一致；改动须走产品 review。
export const DISCLAIMER_TEXT =
  'VitaMe 提供补剂安全信息和决策辅助,不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况,请及时咨询医生。';

const TRANSLATION_MAX_TOKENS = 4096;

const LEVEL_RANK: Record<RiskLevel, number> = { red: 4, yellow: 3, gray: 2, green: 1 };

export interface TranslateRisksInput {
  sessionId: string;
  risks: Risk[];
}

export async function translateRisks(input: TranslateRisksInput, client: LLMClient): Promise<TranslationResult> {
  const translatedRisks = await Promise.all(
    input.risks.map((risk) => translateOne(risk, client)),
  );
  return {
    sessionId: input.sessionId,
    overallLevel: pickStrictest(input.risks),
    translatedRisks,
    disclaimer: DISCLAIMER_TEXT,
  };
}

async function translateOne(risk: Risk, client: LLMClient): Promise<TranslatedRisk> {
  const { system, userMsg } = buildPrompt(risk);
  const llmResult = await client.chat({
    system,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: TRANSLATION_MAX_TOKENS,
  });
  if ('error' in llmResult) return fallback(risk);

  const parsed = parseLLMResponse(llmResult.text);
  if (!parsed.ok) return fallback(risk);

  if (containsBannedWords(parsed.value.translation) || containsBannedWords(parsed.value.avoidance)) {
    return fallback(risk);
  }

  return {
    ...risk,
    translation: parsed.value.translation,
    avoidance: parsed.value.avoidance,
    fallbackUsed: false,
  };
}

function fallback(risk: Risk): TranslatedRisk {
  const tpl = renderFallback(risk);
  return {
    ...risk,
    translation: tpl.body,
    avoidance: tpl.actionHint,
    fallbackUsed: true,
  };
}

function pickStrictest(risks: Risk[]): RiskLevel {
  if (risks.length === 0) return 'gray';
  let worst: RiskLevel = 'green';
  for (const r of risks) {
    if (LEVEL_RANK[r.level] > LEVEL_RANK[worst]) worst = r.level;
  }
  return worst;
}
