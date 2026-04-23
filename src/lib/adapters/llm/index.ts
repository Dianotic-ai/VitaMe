// file: src/lib/adapters/llm/index.ts — barrel export

export { createLLMClient } from './client';
export { defaultBaseURLFor, isKnownProvider } from './providers';
export type {
  ChatBackend,
  ChatBackendRequest,
  ChatBackendResponse,
  LLMClient,
  LLMConfig,
  LLMError,
  LLMErrorKind,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  LLMResult,
  LLMRole,
} from './types';
