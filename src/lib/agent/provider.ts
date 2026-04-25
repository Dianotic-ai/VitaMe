// file: src/lib/agent/provider.ts — Vercel AI SDK Anthropic provider，指向 minimax Anthropic-compat 入口
//
// 路径差异（D8 smoke 发现）：Anthropic 官方 SDK 拼 `{baseURL}/v1/messages`，而 Vercel AI SDK 拼 `{baseURL}/messages`。
// 我们的 LLM_BASE_URL 按 Anthropic SDK 习惯存 `https://api.minimaxi.com/anthropic`（不含 /v1）；
// 这里必须补 /v1，否则 Vercel SDK 会打到 `/anthropic/messages` → minimax 返 404 Not Found。
// 约定：LLM_BASE_URL 是"不含 /v1"的基础形（保持跨 SDK 一致），各 SDK 自己决定怎么补路径。
import 'server-only';
import { createAnthropic } from '@ai-sdk/anthropic';

export function createVitameProvider() {
  const baseURL = process.env.LLM_BASE_URL;
  const authToken = process.env.LLM_API_KEY;
  if (!baseURL) throw new Error('LLM_BASE_URL missing');
  if (!authToken) throw new Error('LLM_API_KEY missing');
  // 补 /v1 以对齐 minimax 真实路径（Anthropic SDK 帮我们做，Vercel SDK 不做）
  const normalizedBaseURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL.replace(/\/$/, '')}/v1`;
  return createAnthropic({ baseURL: normalizedBaseURL, authToken });
}

export function getAgentModelId(): string {
  return process.env.LLM_MODEL ?? 'MiniMax-M2.7';
}
