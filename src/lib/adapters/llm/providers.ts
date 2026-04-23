// file: src/lib/adapters/llm/providers.ts — provider 名 → 默认 Anthropic-compat baseURL，env 留空时回退用

const DEFAULT_BASE_URLS: Record<string, string> = {
  minimax: 'https://api.minimaxi.com/anthropic',
  kimi: 'https://api.moonshot.cn/anthropic',
  zhipu: 'https://open.bigmodel.cn/api/anthropic',
};

export function defaultBaseURLFor(provider: string): string | undefined {
  return DEFAULT_BASE_URLS[provider.toLowerCase()];
}

export function isKnownProvider(provider: string): boolean {
  return provider.toLowerCase() in DEFAULT_BASE_URLS;
}
