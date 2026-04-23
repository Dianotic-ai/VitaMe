// file: scripts/smoke100.ts — 全链路 smoke：100 题原文 → /api/intent → /api/judgment → /api/translation → 生成 markdown 报告
//
// 用途：验证 D7 demo 主链在真实 NL query 下的端到端表现。dump 完整 IntakeOutcome / JudgmentResult / TranslationResult
// 到 var/smoke100-<timestamp>.md，方便人工 review prompt 质量、规则覆盖率、文案合规。
//
// 怎么跑（两个终端）：
//   终端 1：npm run dev
//          （等到看见 "▲ Next.js 14.x  -  Local: http://localhost:3000"）
//   终端 2：npm run smoke:100
//
// 可选参数：
//   BASE_URL=http://localhost:3001 npm run smoke:100   # 改端口
//   LIMIT=10 npm run smoke:100                          # 只跑前 N 题（节省 LLM 成本）
//   ONLY=Q4,Q8,Q65 npm run smoke:100                    # 只跑指定 ID
//   CONCURRENCY=3 npm run smoke:100                     # 并发数（默认 2，太高会被 minimax 限流）

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;
const ONLY = process.env.ONLY?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const CONCURRENCY = process.env.CONCURRENCY ? parseInt(process.env.CONCURRENCY, 10) : 2;

const SEED_FILE = 'docs/小红书需求调研/Demo种子问题清单-100条.md';
const OUT_DIR = 'var';

interface SeedQ {
  id: string;
  query: string;
  expectedLevel: string;
  category: string;
  scenario: string;
}

interface CaseResult {
  q: SeedQ;
  intentMs: number;
  intent?: unknown;
  intentError?: string;
  judgmentMs?: number;
  judgment?: unknown;
  judgmentError?: string;
  translationMs?: number;
  translation?: unknown;
  translationError?: string;
}

// ─── 解析 100 题 markdown ──────────────────────────────────────────

function parseSeed(): SeedQ[] {
  const text = readFileSync(SEED_FILE, 'utf-8');
  const lines = text.split(/\r?\n/);
  const out: SeedQ[] = [];

  let currentCategory = '';
  let currentId = '';
  let currentQ = '';
  let currentExpected = '';
  let currentScenario = '';

  const flush = () => {
    if (currentId && currentQ) {
      out.push({
        id: currentId,
        query: currentQ,
        expectedLevel: currentExpected,
        category: currentCategory,
        scenario: currentScenario,
      });
    }
    currentId = '';
    currentQ = '';
    currentExpected = '';
    currentScenario = '';
  };

  for (const line of lines) {
    const catMatch = line.match(/^##\s+([A-J])\.\s*(.+?)\(/);
    if (catMatch) {
      currentCategory = `${catMatch[1]}. ${catMatch[2]?.trim() ?? ''}`;
      continue;
    }
    const idMatch = line.match(/^###\s+(Q\d+)/);
    if (idMatch) {
      flush();
      currentId = idMatch[1]!;
      continue;
    }
    const qMatch = line.match(/^-\s*\*\*Q\s*原文\*\*\s*[:：]\s*(.+)$/);
    if (qMatch) {
      currentQ = qMatch[1]!.trim();
      continue;
    }
    const expMatch = line.match(/^-\s*\*\*期望等级\*\*\s*[:：]\s*(.+)$/);
    if (expMatch) {
      currentExpected = expMatch[1]!.trim();
      continue;
    }
    const scMatch = line.match(/^-\s*\*\*场景类\*\*\s*[:：]\s*(.+)$/);
    if (scMatch) {
      currentScenario = scMatch[1]!.trim();
      continue;
    }
  }
  flush();
  return out;
}

// ─── HTTP helpers ──────────────────────────────────────────────────

async function postJson(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = { _raw: await res.text() };
  }
  return { status: res.status, data };
}

// 真实信封：成功 = 直接 payload；失败 = { error: { kind, message } }（见 src/lib/api/errorEnvelope.ts）
interface ErrEnvelope {
  error: { kind: string; message: string };
}

function unwrap<T>(payload: { status: number; data: unknown }): T {
  if (payload.status >= 400) {
    const env = payload.data as ErrEnvelope;
    throw new Error(`HTTP ${payload.status}: ${env?.error?.kind ?? '?'} — ${env?.error?.message ?? ''}`);
  }
  return payload.data as T;
}

// ─── 单题全链路 ────────────────────────────────────────────────────

async function runOne(q: SeedQ): Promise<CaseResult> {
  const result: CaseResult = { q, intentMs: 0 };
  const sessionId = `smoke100-${q.id.toLowerCase()}-${Date.now()}`;

  // 1) /api/intent
  const t0 = Date.now();
  let intent: any = null;
  try {
    const raw = await postJson('/api/intent', { sessionId, rawQuery: q.query });
    intent = unwrap<any>(raw);
    result.intent = intent;
  } catch (e) {
    result.intentError = e instanceof Error ? e.message : String(e);
    result.intentMs = Date.now() - t0;
    return result;
  }
  result.intentMs = Date.now() - t0;

  // 2) /api/judgment （仅 pass_through 触发）
  if (intent?.kind === 'pass_through' && intent.lookupRequest) {
    const t1 = Date.now();
    let judgment: any = null;
    try {
      const raw = await postJson('/api/judgment', { sessionId, request: intent.lookupRequest });
      judgment = unwrap<any>(raw);
      result.judgment = judgment;
    } catch (e) {
      result.judgmentError = e instanceof Error ? e.message : String(e);
    }
    result.judgmentMs = Date.now() - t1;

    // 3) /api/translation （仅 judgment 成功且有 risks）
    if (judgment?.risks?.length > 0) {
      const t2 = Date.now();
      try {
        const raw = await postJson('/api/translation', { sessionId, risks: judgment.risks });
        result.translation = unwrap<any>(raw);
      } catch (e) {
        result.translationError = e instanceof Error ? e.message : String(e);
      }
      result.translationMs = Date.now() - t2;
    }
  }

  return result;
}

// ─── 并发池 ────────────────────────────────────────────────────────

async function runPool(qs: SeedQ[], conc: number): Promise<CaseResult[]> {
  const out: CaseResult[] = new Array(qs.length);
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: conc }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= qs.length) return;
      const q = qs[idx]!;
      process.stdout.write(`  [${++done}/${qs.length}] ${q.id} — ${q.query.slice(0, 30)}...\n`);
      out[idx] = await runOne(q);
    }
  });
  await Promise.all(workers);
  return out;
}

// ─── 报告生成 ──────────────────────────────────────────────────────

function fmtJson(v: unknown): string {
  return '```json\n' + JSON.stringify(v, null, 2) + '\n```';
}

function summarize(rs: CaseResult[]): string {
  const total = rs.length;
  const intentKinds: Record<string, number> = {};
  const intentErrors = rs.filter((r) => r.intentError).length;
  const judgmentLevels: Record<string, number> = {};
  const judgmentErrors = rs.filter((r) => r.judgmentError).length;
  const translationErrors = rs.filter((r) => r.translationError).length;
  let intentMsTotal = 0;
  let judgmentMsTotal = 0;
  let translationMsTotal = 0;
  let translationCount = 0;

  for (const r of rs) {
    const kind = (r.intent as any)?.kind ?? (r.intentError ? '_error' : '_no_intent');
    intentKinds[kind] = (intentKinds[kind] ?? 0) + 1;
    intentMsTotal += r.intentMs;
    if (r.judgment) {
      const lvl = (r.judgment as any)?.overallLevel ?? '_unknown';
      judgmentLevels[lvl] = (judgmentLevels[lvl] ?? 0) + 1;
    }
    if (r.judgmentMs) judgmentMsTotal += r.judgmentMs;
    if (r.translationMs) {
      translationMsTotal += r.translationMs;
      translationCount++;
    }
  }

  const lines: string[] = [];
  lines.push('## 汇总统计', '');
  lines.push(`- 总题数: **${total}**`);
  lines.push(`- /api/intent 错误: ${intentErrors}`);
  lines.push(`- /api/judgment 错误: ${judgmentErrors}`);
  lines.push(`- /api/translation 错误: ${translationErrors}`);
  lines.push('');
  lines.push('### IntakeOutcome.kind 分布');
  for (const [k, n] of Object.entries(intentKinds).sort((a, b) => b[1] - a[1])) {
    lines.push(`- \`${k}\`: ${n}`);
  }
  lines.push('');
  lines.push('### JudgmentResult.overallLevel 分布（仅 pass_through 触发）');
  for (const [k, n] of Object.entries(judgmentLevels).sort((a, b) => b[1] - a[1])) {
    lines.push(`- \`${k}\`: ${n}`);
  }
  lines.push('');
  lines.push('### Timing');
  lines.push(`- intent 平均: ${(intentMsTotal / Math.max(total, 1)).toFixed(0)} ms`);
  lines.push(`- judgment 平均: ${(judgmentMsTotal / Math.max(rs.filter((r) => r.judgment).length, 1)).toFixed(0)} ms`);
  lines.push(`- translation 平均: ${(translationMsTotal / Math.max(translationCount, 1)).toFixed(0)} ms`);
  lines.push('');
  return lines.join('\n');
}

function renderCase(r: CaseResult, idx: number): string {
  const lines: string[] = [];
  lines.push(`---`, '', `## [${idx + 1}/${100}] ${r.q.id} — ${r.q.category}`, '');
  lines.push(`**Q 原文**: ${r.q.query}`);
  lines.push(`**期望等级**: ${r.q.expectedLevel}`);
  lines.push(`**场景类**: ${r.q.scenario}`);
  lines.push('');
  lines.push(`### /api/intent (${r.intentMs} ms)`);
  if (r.intentError) lines.push(`❌ ${r.intentError}`);
  else if (r.intent) lines.push(fmtJson(r.intent));
  if (r.judgment || r.judgmentError) {
    lines.push('', `### /api/judgment (${r.judgmentMs} ms)`);
    if (r.judgmentError) lines.push(`❌ ${r.judgmentError}`);
    else if (r.judgment) lines.push(fmtJson(r.judgment));
  }
  if (r.translation || r.translationError) {
    lines.push('', `### /api/translation (${r.translationMs} ms)`);
    if (r.translationError) lines.push(`❌ ${r.translationError}`);
    else if (r.translation) lines.push(fmtJson(r.translation));
  }
  lines.push('');
  return lines.join('\n');
}

// ─── 主入口 ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`# smoke100 — full chain (intent → judgment → translation)`);
  console.log(`base: ${BASE_URL}`);

  // ping
  try {
    await fetch(BASE_URL, { method: 'GET' });
  } catch {
    console.error(`\n❌ 连不上 ${BASE_URL}。请先在另一个终端跑 \`npm run dev\`，等服务起来再 retry。\n`);
    process.exit(1);
  }

  let qs = parseSeed();
  console.log(`parsed: ${qs.length} 题`);
  if (ONLY) {
    qs = qs.filter((q) => ONLY.includes(q.id.toUpperCase()));
    console.log(`ONLY filter → ${qs.length} 题`);
  }
  if (LIMIT) {
    qs = qs.slice(0, LIMIT);
    console.log(`LIMIT → ${qs.length} 题`);
  }

  console.log(`concurrency: ${CONCURRENCY}\n`);
  const t0 = Date.now();
  const results = await runPool(qs, CONCURRENCY);
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n全部完成，用时 ${elapsedSec}s`);

  // 写报告
  mkdirSync(OUT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = join(OUT_DIR, `smoke100-${ts}.md`);
  const header = [
    `# smoke100 报告 — ${new Date().toISOString()}`,
    '',
    `- base: \`${BASE_URL}\``,
    `- 题数: ${results.length}`,
    `- 用时: ${elapsedSec}s`,
    `- 并发: ${CONCURRENCY}`,
    '',
  ].join('\n');
  const body = [header, summarize(results), ...results.map(renderCase)].join('\n');
  writeFileSync(outFile, body, 'utf-8');
  console.log(`\n报告已写入: ${outFile}`);
}

main().catch((e) => {
  console.error('\n[smoke100 致命错误]', e);
  process.exit(1);
});
