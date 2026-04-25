// file: src/app/api/archive/save/route.ts — POST /api/archive/save
//
// 实现策略：archive 真实持久化在客户端 Zustand LocalStorage（P0 无多设备同步）。
// 服务端 route 的作用：(1) 生成稳定 snapshotId，(2) 未来走 audit middleware（§11.10 红线）。
// 入参对齐 api-contract.md §3 ArchiveSaveRequest。

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { jsonError, jsonOk } from '@/lib/api/errorEnvelope';
import { getAuditLogger } from '@/lib/capabilities/compliance/auditLogger';

export const runtime = 'nodejs';

const personRefSchema = z.object({
  label: z.enum(['self', 'mom', 'dad', 'other']),
  customLabel: z.string().optional(),
});

const bodySchema = z.object({
  sessionId: z.string().min(1),
  personRef: personRefSchema,
  querySummary: z.string().min(1),
  result: z.unknown(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return jsonError('validation', 'request body is not valid JSON');
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('validation', parsed.error.issues[0]?.message ?? 'invalid request body');
  }
  const snapshotId = `arch-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const audit = getAuditLogger();
  audit
    .log({
      event: 'archive_saved',
      sessionId: parsed.data.sessionId,
      inputHash: audit.hash(parsed.data.querySummary),
      metadata: { snapshotId, personLabel: parsed.data.personRef.label },
    })
    .catch((e: unknown) => console.error('[auditLogger] archive_saved write failed', e));
  return jsonOk({ snapshotId, savedAt: new Date().toISOString() });
}
