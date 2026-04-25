// file: tests/unit/compliance/auditLogger.spec.ts — AuditLogger 三级 storage + hash + timestamp 行为
import { describe, it, expect, vi } from 'vitest';
import { getAuditLogger, type AuditStorage } from '@/lib/capabilities/compliance/auditLogger';

describe('getAuditLogger', () => {
  it('接受注入的 storage，每条 log 带 ISO timestamp', async () => {
    const writes: string[] = [];
    const storage: AuditStorage = { write: async (line) => { writes.push(line); } };
    const logger = getAuditLogger(storage);
    await logger.log({ event: 'judgment_completed', sessionId: 'sess-1', inputHash: 'abc' });
    expect(writes.length).toBe(1);
    const parsed = JSON.parse(writes[0]!);
    expect(parsed.event).toBe('judgment_completed');
    expect(parsed.sessionId).toBe('sess-1');
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('hash() 对相同输入稳定 + 16 位 hex', () => {
    const logger = getAuditLogger({ write: async () => {} });
    const h1 = logger.hash('hello world');
    const h2 = logger.hash('hello world');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{16}$/);
  });

  it('storage.write 抛错时必须传递给调用方（红线：写失败是硬错误）', async () => {
    const storage: AuditStorage = {
      write: async () => { throw new Error('storage exploded'); },
    };
    const logger = getAuditLogger(storage);
    await expect(logger.log({ event: 'error', sessionId: 's' })).rejects.toThrow('storage exploded');
  });

  it('每次 log 调用都生成新 timestamp（防批量聚合被一条覆盖）', async () => {
    const writes: string[] = [];
    const storage: AuditStorage = { write: async (line) => { writes.push(line); } };
    const logger = getAuditLogger(storage);
    await logger.log({ event: 'intent_parsed', sessionId: 's' });
    await new Promise((r) => setTimeout(r, 5));
    await logger.log({ event: 'intent_parsed', sessionId: 's' });
    const t1 = JSON.parse(writes[0]!).timestamp;
    const t2 = JSON.parse(writes[1]!).timestamp;
    expect(t1).not.toBe(t2);
  });

  it('metadata 字段原样透传', async () => {
    const writes: string[] = [];
    const logger = getAuditLogger({ write: async (line) => { writes.push(line); } });
    await logger.log({
      event: 'agent_trace',
      sessionId: 's',
      metadata: { tool: 'parseIntentTool', finishReason: 'tool-calls' },
    });
    const parsed = JSON.parse(writes[0]!);
    expect(parsed.metadata).toEqual({ tool: 'parseIntentTool', finishReason: 'tool-calls' });
  });
});
