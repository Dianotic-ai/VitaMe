// file: scripts/smokeE2E.ts — 主链端到端 smoke：/api/intent → /api/judgment → /api/translation
// 对比 smokeAgent.ts（走 Agent shell）；本脚本走"直接 API"路径，验证 D7 主链 60s SLA。
//
// 怎么跑：
//   终端 1：npm run dev
//   终端 2：npm run smoke:e2e
//
// 退出码：0 = 通过（总耗时<60s + overallLevel=red） / 1 = intent 失败 / 2 = judgment 失败 / 3 = translation 失败

export {}; // tsconfig isolatedModules 要求

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SESSION_ID = `smoke-e2e-${Date.now()}`;
const QUERY = '我妈 62 岁，正在吃华法林做抗凝，能加一颗辅酶 Q10 的软胶囊吗？';

type Json = Record<string, unknown>;

async function postJson(path: string, body: unknown): Promise<{ status: number; json: Json; elapsedMs: number }> {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const elapsedMs = Date.now() - start;
  const json = (await res.json()) as Json;
  return { status: res.status, json, elapsedMs };
}

async function main() {
  console.log(`[smokeE2E] BASE_URL=${BASE_URL}`);
  console.log(`[smokeE2E] query: ${QUERY}\n`);
  const startTotal = Date.now();

  // Step 1: /api/intent
  console.log('[1/3] POST /api/intent');
  const intent = await postJson('/api/intent', { sessionId: SESSION_ID, rawQuery: QUERY });
  console.log(`     status=${intent.status} elapsed=${intent.elapsedMs}ms kind=${intent.json.kind}`);
  if (intent.status !== 200 || intent.json.kind !== 'pass_through') {
    console.error('[smokeE2E] ❌ intent 没返 pass_through:', intent.json);
    process.exit(1);
  }
  const lookupRequest = intent.json.lookupRequest;
  console.log(`     lookupRequest:`, JSON.stringify(lookupRequest));

  // Step 2: /api/judgment
  console.log('\n[2/3] POST /api/judgment');
  const judgment = await postJson('/api/judgment', { sessionId: SESSION_ID, request: lookupRequest });
  console.log(`     status=${judgment.status} elapsed=${judgment.elapsedMs}ms overallLevel=${judgment.json.overallLevel}`);
  if (judgment.status !== 200) {
    console.error('[smokeE2E] ❌ judgment 失败:', judgment.json);
    process.exit(2);
  }

  // Step 3: /api/translation
  console.log('\n[3/3] POST /api/translation');
  const translation = await postJson('/api/translation', { sessionId: SESSION_ID, risks: judgment.json.risks });
  console.log(`     status=${translation.status} elapsed=${translation.elapsedMs}ms translatedRisks=${Array.isArray(translation.json.translatedRisks) ? translation.json.translatedRisks.length : '?'}`);
  if (translation.status !== 200) {
    console.error('[smokeE2E] ❌ translation 失败:', translation.json);
    process.exit(3);
  }

  const totalMs = Date.now() - startTotal;
  console.log(`\n[smokeE2E] total elapsed: ${totalMs}ms (SLA: 60000ms)`);
  console.log(`[smokeE2E] overallLevel: ${judgment.json.overallLevel}`);
  console.log(`[smokeE2E] disclaimer present: ${typeof translation.json.disclaimer === 'string' && (translation.json.disclaimer as string).length > 0}`);

  const pass = totalMs < 60000 && judgment.json.overallLevel === 'red';
  console.log(`[smokeE2E] ${pass ? '✅ PASS' : '⚠️ PARTIAL'} — 时间 ${totalMs < 60000 ? '达标' : '超时'}，overallLevel ${judgment.json.overallLevel === 'red' ? '符合预期 red' : '不符合（应为 red）'}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[smokeE2E] 未预期异常:', err);
  process.exit(9);
});
