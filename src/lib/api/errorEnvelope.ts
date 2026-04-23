// file: src/lib/api/errorEnvelope.ts — API 路由共享错误信封 + JSON Response 工具
//
// 契约：所有 /api/* 错误响应 body 形态固定为 { error: { kind, message } }，与
// LLMError shape 保持同构（src/lib/adapters/llm/types.ts）。前端可统一解析。
// HTTP 状态码映射见 STATUS_BY_KIND。

export type ApiErrorKind =
  | 'validation'
  | 'auth'
  | 'rate_limit'
  | 'network'
  | 'timeout'
  | 'invalid_response'
  | 'internal';

export interface ApiErrorBody {
  error: { kind: ApiErrorKind; message: string };
}

const STATUS_BY_KIND: Record<ApiErrorKind, number> = {
  validation: 400,
  auth: 401,
  rate_limit: 429,
  network: 502,
  timeout: 504,
  invalid_response: 502,
  internal: 500,
};

export function jsonError(kind: ApiErrorKind, message: string): Response {
  const body: ApiErrorBody = { error: { kind, message } };
  return Response.json(body, { status: STATUS_BY_KIND[kind] });
}

export function jsonOk<T>(payload: T): Response {
  return Response.json(payload, { status: 200 });
}
