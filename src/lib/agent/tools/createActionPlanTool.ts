// file: src/lib/agent/tools/createActionPlanTool.ts — 从 judgment + 上下文生成 action cards
// Deterministic：无 LLM 调用；逻辑见 src/lib/agent/actionPlan.ts。
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { buildActionPlan } from '../actionPlan';

export const createActionPlanTool = tool({
  description:
    '基于 runJudgmentTool 的 overallLevel + 用户是否在服药，生成下一步行动卡列表（avoid / ask_doctor / review_evidence / save_preview / reminder_preview）。纯规则映射，不输出诊断或处方。红色永远排首位 avoid + ask_doctor。',
  inputSchema: z.object({
    sessionId: z.string(),
    overallLevel: z.enum(['red', 'yellow', 'gray', 'green']),
    riskCount: z.number().default(0),
    hasMedication: z.boolean().default(false),
  }),
  execute: async ({ sessionId, overallLevel, riskCount, hasMedication }) => {
    return {
      sessionId,
      actionPlan: buildActionPlan({ overallLevel, riskCount, hasMedication }),
    };
  },
});
