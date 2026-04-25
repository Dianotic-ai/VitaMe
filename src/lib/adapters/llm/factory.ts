// file: src/lib/adapters/llm/factory.ts — 单一 env → LLMClient 工厂，供 api routes + agent tools 共用
// 目的：不重复 createLLMClient 的 env 读取逻辑（原在每个 route 里 inline），保证 provider/model/baseURL 行为一致。
import 'server-only';
import { createLLMClient } from './client';
import type { LLMClient } from './types';

export function createLLMClientFromEnv(): LLMClient {
  return createLLMClient({
    provider: process.env.LLM_PROVIDER ?? 'minimax',
    model: process.env.LLM_MODEL ?? '',
    baseURL: process.env.LLM_BASE_URL ?? '',
    apiKey: process.env.LLM_API_KEY ?? '',
  });
}
