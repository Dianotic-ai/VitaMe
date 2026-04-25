// file: src/lib/agent/tools/createMemoryPreviewTool.ts — session-local Memory seed 预览
// 红线：privacyMode 固定 'local'，不写长期存储，不上云（见 Agent-北极星.md §5 + §8）。
import 'server-only';
import { tool } from 'ai';
import { z } from 'zod';
import { buildMemoryPreview } from '../memoryPreview';

export const createMemoryPreviewTool = tool({
  description:
    '基于本次 session 已出现的关键事实（用户提到的病史/在用药/特殊人群等）生成 Memory 预览。privacyMode 固定 local，facts 最多 5 条且去重。只返给 UI 预览，不写长期存储。',
  inputSchema: z.object({
    sessionId: z.string(),
    personLabel: z.string().describe("self / mom / dad / child / other，默认 self"),
    factsFromSession: z
      .array(z.string())
      .default([])
      .describe('本次对话从用户输入抽取的事实短语，如"妈妈 65 岁"、"正在吃华法林"'),
  }),
  execute: async ({ sessionId, personLabel, factsFromSession }) => {
    return {
      sessionId,
      preview: buildMemoryPreview({ personLabel, factsFromSession }),
    };
  },
});
