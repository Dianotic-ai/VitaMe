// file: scripts/checkAuditUpstash.ts — 验证 audit logger 真往 Upstash 写
// 用法：npm run check:audit
// 退出码：0 = 至少有 1 条今日记录 / 1 = env 缺失 / 2 = Upstash 返非 200 / 3 = 列表为空

export {};

import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error('UPSTASH_REDIS_REST_URL/TOKEN 未设置');
    process.exit(1);
  }
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `vitame:audit:${date}`;
  const endpoint = `${url.replace(/\/$/, '')}/lrange/${encodeURIComponent(key)}/0/4`;
  console.log(`[checkAudit] GET ${endpoint}`);
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`[checkAudit] status=${res.status}`);
  const body = (await res.json()) as { result?: string[] };
  if (!res.ok) {
    console.error('[checkAudit] Upstash 非 2xx:', body);
    process.exit(2);
  }
  const count = body.result?.length ?? 0;
  console.log(`[checkAudit] today's audit count (key=${key}): ${count}`);
  if (count > 0) {
    console.log(`[checkAudit] latest entry:`);
    console.log(body.result![0]);
  }
  if (count === 0) {
    console.warn('[checkAudit] ⚠️ 列表为空 — 可能：(a) 还没有 API 调用 (b) audit 写到了不同 key (c) Upstash 路径错');
    process.exit(3);
  }
  console.log('[checkAudit] ✅ Upstash 正常收到 audit');
  process.exit(0);
}

main().catch((err) => {
  console.error('[checkAudit] 异常:', err);
  process.exit(9);
});
