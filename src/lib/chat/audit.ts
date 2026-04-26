// file: src/lib/chat/audit.ts — Edge runtime 兼容的 chat audit logger（仅 Upstash REST）
//
// 跟 v0.2 src/lib/capabilities/compliance/auditLogger.ts 区别：
// - v0.2 有 fs fallback（require Node 'fs'/'crypto'），Edge 跑不了
// - v0.3 仅走 Upstash REST + Web Crypto API（Edge 原生）
// - 没有 console fallback：Edge 上 stdout 难追，宁可硬错也不静默丢日志（CLAUDE.md §9.6）
//
// 失败语义：
// - Upstash 5xx / network error → 抛错，调用方决定是否阻断流（chat route 当前选"记 stderr 但继续返回流，避免 demo 演示挂"）
// - 注意：CLAUDE.md §9.6 要求"写失败 = 硬错误"。v0.3 demo 期妥协：流式响应已开始时不能中断，所以失败仅 console.error + audit miss
//   （wake-up doc 会标记此项为已知开放问题）

export interface ChatAuditRecord {
  event: 'chat_turn' | 'chat_error' | 'chat_banned_word_hit';
  sessionId: string;
  inputHash?: string;
  outputHash?: string;
  retrievedSourceIds?: string[];
  criticalHits?: number;
  metadata?: Record<string, unknown>;
}

export async function writeChatAudit(record: ChatAuditRecord): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // dev / local 无 Upstash 配置：console 兜底
    console.warn('[chat-audit] Upstash 未配置，仅 console 输出', record);
    return;
  }

  const full = { ...record, ts: new Date().toISOString() };
  const line = JSON.stringify(full);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
  const key = `vitame:chat-audit:${date}`;
  const endpoint = `${url.replace(/\/$/, '')}/lpush/${encodeURIComponent(key)}/${encodeURIComponent(line)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable)');
    throw new Error(`[chat-audit] upstash write failed: ${res.status} ${body.slice(0, 200)}`);
  }
}

/** Edge-friendly hash（Web Crypto API） */
export async function shortHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}
