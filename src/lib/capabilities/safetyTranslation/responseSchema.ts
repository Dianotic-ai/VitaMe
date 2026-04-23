// file: src/lib/capabilities/safetyTranslation/responseSchema.ts — Zod 校验 LLM 翻译响应
//
// CLAUDE.md §11.6：LLM 输出必须过 Zod 校验，失败 → templateFallback。
// 容忍 ```json fences，但仍要求外层是合法 JSON 对象 + 两个非空字符串字段。

import { z } from 'zod';

export const MAX_TRANSLATION_LEN = 200;
export const MAX_AVOIDANCE_LEN = 80;

const schema = z.object({
  translation: z.string().min(1).max(MAX_TRANSLATION_LEN),
  avoidance: z.string().min(1).max(MAX_AVOIDANCE_LEN),
});

export type LLMTranslationPayload = z.infer<typeof schema>;

export type ParseResult =
  | { ok: true; value: LLMTranslationPayload }
  | { ok: false; reason: 'json_parse' | 'schema' };

export function parseLLMResponse(raw: string): ParseResult {
  const stripped = stripFences(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { ok: false, reason: 'json_parse' };
  }
  const r = schema.safeParse(parsed);
  if (!r.success) return { ok: false, reason: 'schema' };
  return { ok: true, value: r.data };
}

function stripFences(s: string): string {
  // 去掉 ```json ... ``` / ``` ... ``` 围栏（M2.7 偶尔会带）
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return m?.[1] ?? s;
}
