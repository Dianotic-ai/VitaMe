// file: src/lib/agent/tools/runJudgmentTool.ts — wrap L2 judge（风险等级唯一来源）
// 红线 §11.3/§11.5：Agent 禁止自行判 red/yellow/gray/green，风险等级必须来自这里的 JudgmentResult。
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { judge } from '@/lib/capabilities/safetyJudgment/judgmentEngine';

export const runJudgmentTool = tool({
  description:
    '基于 grounded slugs（通过 parseIntentTool 的 pass_through.lookupRequest 取到）查 L2 确定性规则，返回 JudgmentResult（overallLevel + risks[] + partialData）。风险等级（red/yellow/gray/green）只能来自此 tool 返回值。禁止绕过这里自行推断。',
  inputSchema: z.object({
    sessionId: z.string(),
    ingredients: z.array(z.string()).describe('L1 slug 形式的成分 id，如 fish-oil / coenzyme-q10'),
    medications: z.array(z.string()).default([]),
    conditions: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    specialGroups: z.array(z.string()).default([]),
    genes: z.array(z.string()).default([]),
    timings: z.array(z.string()).default([]),
    strategies: z.array(z.string()).default([]),
  }),
  execute: async ({ sessionId, ...lookup }) => {
    return judge(sessionId, lookup);
  },
});
