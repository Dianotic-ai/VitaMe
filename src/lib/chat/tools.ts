// file: src/lib/chat/tools.ts — v0.4 D8 chat-side tool definitions
//
// 设计：tool 没有 execute 字段 → 服务端只把 tool_call 流给客户端，
// 客户端 useChat 监听到后调本地 store（reminderStore / profileStore）写 LocalStorage。
// 北极星 §9.8 隐私底线：reminder/supplement 数据不出本机，所以 execute 必须在客户端做。
//
// 流程：
//   1) /api/chat streamText({ tools: chatTools }) — 无 execute
//   2) LLM 决定调用 → server 流出 tool-call part 给客户端
//   3) chat/page.tsx useEffect 监听 part.state==='input-available' → 解析 input → 写 store → addToolResult
//   4) sendAutomaticallyWhen=lastAssistantMessageIsCompleteWithToolCalls → 自动 resend
//   5) server 看到 tool result 后用 LLM 生成确认文字"已设置：..."

import { tool } from 'ai';
import { z } from 'zod';

export const chatTools = {
  create_reminder: tool({
    description: `为当前 active person 的某个补剂创建每日吃药提醒。
当用户说类似"鱼油设置提醒"/"提醒我吃X"/"X每天X点提醒我"时调用本工具。
提醒数据仅存用户本机 LocalStorage，不上传服务器。
如果该补剂还没在 user_profile 的"正在吃的补剂"里，工具会自动加上。`,
    inputSchema: z.object({
      supplementMention: z
        .string()
        .min(1)
        .describe('补剂名字，与用户口语保持一致（如"鱼油"、"维生素D"、"Q10"、"善存"）。不要翻译成英文。'),
      timeOfDay: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '必须是 HH:MM 24h 格式')
        .describe('每日提醒时间，24h HH:MM 格式（如 "08:30"、"21:00"）。北京时间。'),
      daysOfWeek: z
        .array(z.number().int().min(1).max(7))
        .optional()
        .describe('哪几天提醒，1=周一、2=周二、...、7=周日。省略 = 每天。例：["1","3","5"] = 周一三五。'),
    }),
  }),
};

export type ChatTools = typeof chatTools;

/** 客户端 useChat 监听的 tool-UI part type 字符串（与 chatTools 的 key 对齐） */
export const TOOL_UI_TYPES = {
  CREATE_REMINDER: 'tool-create_reminder' as const,
};

export interface CreateReminderInput {
  supplementMention: string;
  timeOfDay: string;
  daysOfWeek?: number[];
}

export interface CreateReminderOutput {
  ok: true;
  ruleId: string;
  supplementId: string;
  supplementMention: string;
  timeOfDay: string;
  daysOfWeek: number[];
  /** 之前没收录这个补剂、本次自动加进 currentSupplements */
  autoCreatedSupplement: boolean;
}
