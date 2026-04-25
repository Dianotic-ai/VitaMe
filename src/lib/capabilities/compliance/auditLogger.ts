// file: src/lib/capabilities/compliance/auditLogger.ts — 合规红线 §11.10：审计日志
//
// 三级路由（按可用性降级）：
//   1) UPSTASH_REDIS_REST_URL 存在 → 走 Upstash Redis（Vercel serverless 无持久 FS 的主方案）
//   2) AUDIT_LOG_DIR 存在 + 可写 FS → 写本地 JSONL（dev 主方案，也是 prod 自部署 fallback）
//   3) 以上都不可用 → console.error 写 stderr（永远兜底，保证红线不静默）
//
// 红线（§11.10）：
//   - 每条风险判定、每次 LLM 调用、每次合规拦截都要有一条日志
//   - 日志写失败是硬错误，不是 warning（→ 报错给调用方决定是否降级或 fail）
//   - 不能被开关禁用
//
// 使用模式：
//   const audit = getAuditLogger();
//   await audit.log({ event: 'judgment_completed', sessionId, inputHash, outputHash, ... });
//
// 本文件纯逻辑 + env 感知；单元测可注入 mock storage（第二个参数）。

import 'server-only';
import { appendFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export type AuditEvent =
  | 'judgment_completed'
  | 'translation_completed'
  | 'intent_parsed'
  | 'agent_trace'
  | 'archive_saved'
  | 'archive_rechecked'
  | 'compliance_rejected'
  | 'llm_call'
  | 'error';

export interface AuditRecord {
  event: AuditEvent;
  sessionId: string;
  timestamp: string;
  /** 输入/输出 hash（如 query text、risks、text response）用于排错不暴露 PII */
  inputHash?: string;
  outputHash?: string;
  /** 事件相关的元数据；PII 敏感字段禁止直接入库 */
  metadata?: Record<string, unknown>;
}

export interface AuditStorage {
  write: (jsonLine: string) => Promise<void>;
}

export interface AuditLogger {
  log: (record: Omit<AuditRecord, 'timestamp'>) => Promise<void>;
  hash: (input: string) => string;
}

/** 三级 storage 自动选择（Upstash > FS > console）。可通过第二参数注入覆盖（测试用）。 */
export function getAuditLogger(storage?: AuditStorage): AuditLogger {
  const resolvedStorage = storage ?? resolveStorage();
  return {
    log: async (record) => {
      const full: AuditRecord = { ...record, timestamp: new Date().toISOString() };
      const line = JSON.stringify(full);
      await resolvedStorage.write(line);
    },
    hash: (input) => createHash('sha256').update(input).digest('hex').slice(0, 16),
  };
}

function resolveStorage(): AuditStorage {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return upstashStorage(upstashUrl, upstashToken);
  }
  const fsDir = process.env.AUDIT_LOG_DIR;
  if (fsDir) {
    return fsStorage(fsDir);
  }
  return consoleStorage();
}

// ------- 实现：Upstash Redis REST（list LPUSH，按日分 key）-------
function upstashStorage(url: string, token: string): AuditStorage {
  return {
    write: async (line) => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd
      const key = `vitame:audit:${date}`;
      // Upstash REST POST /lpush/{key}/{value} — value 需 URL-encode
      const endpoint = `${url.replace(/\/$/, '')}/lpush/${encodeURIComponent(key)}/${encodeURIComponent(line)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '(unreadable)');
        throw new Error(`auditLogger upstash write failed: ${res.status} ${body.slice(0, 200)}`);
      }
    },
  };
}

// ------- 实现：本地 JSONL（按日 rotate）-------
function fsStorage(dir: string): AuditStorage {
  let dirEnsured = false;
  return {
    write: async (line) => {
      if (!dirEnsured) {
        await mkdir(dir, { recursive: true });
        dirEnsured = true;
      }
      const date = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      const file = join(dir, `audit-${date}.jsonl`);
      await appendFile(file, line + '\n', 'utf8');
    },
  };
}

// ------- 实现：stderr 兜底（永远可用，保证红线不静默）-------
function consoleStorage(): AuditStorage {
  return {
    write: async (line) => {
      console.error(`[VITAME_AUDIT] ${line}`);
    },
  };
}
