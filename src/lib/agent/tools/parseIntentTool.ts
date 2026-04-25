// file: src/lib/agent/tools/parseIntentTool.ts — wrap L0 intakeOrchestrator（直接调 capability，不走 HTTP）
// 红线 §11.13：LLM 在 L0 内部只做 NER + phrasing，禁判安全性。此 tool 透传 IntakeOutcome，不改结构。
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { intakeOrchestrator } from '@/lib/capabilities/queryIntake/intakeOrchestrator';
import { createLLMClientFromEnv } from '@/lib/adapters/llm/factory';

export const parseIntentTool = tool({
  description:
    '把用户自然语言 query 解析成结构化 IntakeOutcome（4 变体 discriminated union：pass_through / clarify_needed / symptom_candidates / unsupported）。如果返回 clarify_needed，立即停止调用工具并把 question 转述给用户，不要自行猜测答案。',
  inputSchema: z.object({
    sessionId: z.string().describe('会话 id，所有后续 tool 调用都要带'),
    message: z.string().describe('用户原始自然语言输入'),
  }),
  execute: async ({ sessionId, message }) => {
    const llmClient = createLLMClientFromEnv();
    const outcome = await intakeOrchestrator(
      sessionId,
      { rawQuery: message, imageOcrText: undefined, history: [] },
      { llmClient },
    );
    return outcome;
  },
});
