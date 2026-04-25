// file: src/lib/agent/tools/translateRiskTool.ts — wrap L3 translateRisks（只翻译不改判）
// 红线 §10.3：禁止改写 level/dimension/reasonCode/cta。LLM 失败自动走 TemplateFallback（translateRisks 内部已处理）。
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { translateRisks } from '@/lib/capabilities/safetyTranslation/translateRisks';
import { createLLMClientFromEnv } from '@/lib/adapters/llm/factory';
import type { Risk } from '@/lib/types/risk';

export const translateRiskTool = tool({
  description:
    '把 runJudgmentTool 返回的 Risk[] 翻译成用户可读的 translation（原因）+ avoidance（规避建议）。禁止改 level/dimension/reasonCode/cta。LLM 失败或命中禁词时自动降级到模板兜底。返回的 TranslationResult 包含顶层 disclaimer（必非空）。',
  inputSchema: z.object({
    sessionId: z.string(),
    risks: z
      .array(z.unknown())
      .describe('Risk[]，结构见 src/lib/types/risk.ts；直接把 runJudgmentTool 的 risks 字段传进来即可'),
  }),
  execute: async ({ sessionId, risks }) => {
    const llmClient = createLLMClientFromEnv();
    return translateRisks({ sessionId, risks: risks as Risk[] }, llmClient);
  },
});
