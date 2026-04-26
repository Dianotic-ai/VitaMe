// file: src/lib/llm/edgeProvider.ts — Edge runtime 兼容的 Anthropic provider
//
// 为什么不用 v0.2 src/lib/agent/provider.ts：
// - 那个文件 import 'server-only'（Next.js 构建期标记，本身 Edge 也 OK，但跟 v0.3 "0 老依赖"原则冲突）
// - v0.3 要 Edge runtime（CLAUDE.md §4 + §3.1 主路径要求 streaming），不挂 'server-only' 也安全（Edge route 本来就不会被打进客户端 bundle）
//
// 关键 trick（D8 smoke 发现，CLAUDE.md §15 已记）：
// - Anthropic 官方 SDK 拼 `{baseURL}/v1/messages`
// - Vercel AI SDK 拼 `{baseURL}/messages`
// - 我们的 LLM_BASE_URL 按 Anthropic 习惯存（不含 /v1）
// - 所以这里手工补 /v1，否则 Vercel SDK 会打到 `{baseURL}/messages` → minimax 返 404

import { createAnthropic } from '@ai-sdk/anthropic';

export function createChatProvider() {
  const baseURL = process.env.LLM_BASE_URL;
  const authToken = process.env.LLM_API_KEY;
  if (!baseURL) throw new Error('LLM_BASE_URL missing');
  if (!authToken) throw new Error('LLM_API_KEY missing');
  const normalizedBaseURL = baseURL.endsWith('/v1') ? baseURL : `${baseURL.replace(/\/$/, '')}/v1`;
  return createAnthropic({ baseURL: normalizedBaseURL, authToken });
}

export function getChatModelId(): string {
  return process.env.LLM_MODEL ?? 'MiniMax-M2.7';
}

/** 用于 memory extractor 等轻量任务的同一 provider（共用 LLM_BASE_URL/KEY） */
export function createExtractorProvider() {
  return createChatProvider();
}
