// file: src/lib/adapters/llm/types.ts — L3 LLM Adapter 契约（Claude Code 模式：Anthropic Messages 协议 + provider 仅作 audit tag）

export type LLMRole = 'user' | 'assistant';

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type LLMConfig = {
  provider: string;
  model: string;
  baseURL: string;
  apiKey: string;
  timeoutMs?: number;
};

export type LLMRequest = {
  messages: LLMMessage[];
  system?: string;
  responseFormat?: 'json' | 'text';
  temperature?: number;
  maxTokens?: number;
};

export type LLMResponse = {
  text: string;
  provider: string;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
};

export type LLMErrorKind = 'network' | 'rate_limit' | 'auth' | 'invalid_response' | 'timeout';

export type LLMError = {
  kind: LLMErrorKind;
  message: string;
};

export type LLMResult = LLMResponse | { error: LLMError };

export interface LLMClient {
  chat(req: LLMRequest): Promise<LLMResult>;
}

// ChatBackend 抽象层：让 client.ts 不直接依赖 Anthropic SDK 类型，便于测试注入 fake
export type ChatBackendRequest = {
  model: string;
  system?: string;
  messages: LLMMessage[];
  responseFormat?: 'json' | 'text';
  temperature?: number;
  maxTokens?: number;
};

export type ChatBackendResponse = {
  text: string;
  finishReason: string | null;
};

export type ChatBackend = (req: ChatBackendRequest) => Promise<ChatBackendResponse>;
