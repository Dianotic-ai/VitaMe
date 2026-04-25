// file: scripts/smokeIntent.ts — L0 流水线 smoke 验证（fetch /api/intent）
//
// 用途：跑 5 个典型 query 打 /api/intent，看 4 种 outcome 长啥样。
//
// 怎么跑（两个终端）：
//   终端 1：cd D:/CCbuild/15保健Agent && npm run dev
//          （等到看见 "▲ Next.js 14.x  -  Local: http://localhost:3000"）
//   终端 2：cd D:/CCbuild/15保健Agent && npm run smoke:intent
//
// 可选参数：
//   BASE_URL=http://localhost:3001 npm run smoke:intent     # 改端口
//   ONLY=A,C npm run smoke:intent                            # 只跑某几个 case

export {}; // tsconfig isolatedModules 要求每个文件是 module

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ONLY = process.env.ONLY?.split(',').map((s) => s.trim()).filter(Boolean);

const QUERIES: { label: string; query: string; expect: string }[] = [
  {
    label: 'A',
    query: '辅酶 Q10 和华法林能一起吃吗?',
    expect: 'pass_through (red 走 L2)',
  },
  {
    label: 'B',
    query: 'Doctor\'s Best 镁片孕妇能吃吗?',
    expect: 'pass_through (孕期 + magnesium → L2 判)',
  },
  {
    label: 'C',
    query: '辅酶 Q10 现在能吃吗?',
    expect: 'clarify_needed (medication_context, 缺药物上下文)',
  },
  {
    label: 'D',
    query: '我最近老失眠',
    expect: 'symptom_candidates (insomnia → magnesium / melatonin)',
  },
  {
    label: 'E',
    query: '感冒期间可以吃维生素 AD 软胶囊吗?',
    expect: 'pass_through 或 clarify (取决于 LLM 把"感冒"识别为 condition 还是 symptom)',
  },
];

interface PassThroughOutcome {
  kind: 'pass_through';
  intent: string;
  lookupRequest: { ingredients: string[]; medications: string[]; conditions: string[]; specialGroups?: string[] };
  ungrounded: { raw: string }[];
}
interface ClarifyOutcome {
  kind: 'clarify_needed';
  intent: string;
  topic: string;
  question: { question: string; choices: string[] };
}
interface SymptomCandidatesOutcome {
  kind: 'symptom_candidates';
  matched: { symptomZh: string; candidates: { ingredientSlug: string }[] }[];
  unmatched: string[];
}
interface UnsupportedOutcome { kind: 'unsupported'; intent: string; reason: string }
type Outcome = PassThroughOutcome | ClarifyOutcome | SymptomCandidatesOutcome | UnsupportedOutcome;

// /api/intent 契约（src/lib/api/errorEnvelope.ts）：
//   成功 → 裸 IntakeOutcome（body 即 outcome 本身，无 envelope）
//   失败 → { error: { kind, message } }
type ErrBody = { error: { kind: string; message: string } };
type ResponseBody = Outcome | ErrBody;

function isErr(b: ResponseBody): b is ErrBody {
  return typeof (b as ErrBody).error === 'object' && (b as ErrBody).error !== null;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

async function hit(label: string, query: string): Promise<{ ms: number; body: ResponseBody; status: number }> {
  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/api/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: `smoke-${label}`, rawQuery: query }),
  });
  const ms = Date.now() - t0;
  const body = (await res.json()) as ResponseBody;
  return { ms, body, status: res.status };
}

async function main(): Promise<void> {
  console.log(`smoke target : ${BASE_URL}/api/intent`);
  console.log(`cases        : ${(ONLY ?? QUERIES.map((q) => q.label)).join(', ')}`);
  console.log('');

  // 先 ping 一下确认 server 在
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`✗ ${BASE_URL} 不可达。请先在另一个终端跑 \`npm run dev\`。`);
    process.exit(1);
  }

  for (const { label, query, expect } of QUERIES) {
    if (ONLY && !ONLY.includes(label)) continue;
    console.log('─'.repeat(72));
    console.log(`【${label}】 ${query}`);
    console.log(`     预期: ${expect}`);
    try {
      const { ms, body, status } = await hit(label, query);
      if (isErr(body)) {
        console.log(`     [${status}] ${body.error.kind}: ${body.error.message}`);
        continue;
      }
      const outcome = body;
      console.log(`     实际 (${ms}ms, status=${status}): kind=${outcome.kind}`);

      switch (outcome.kind) {
        case 'pass_through':
          console.log(`              intent      : ${outcome.intent}`);
          console.log(`              ingredients : ${JSON.stringify(outcome.lookupRequest.ingredients)}`);
          console.log(`              medications : ${JSON.stringify(outcome.lookupRequest.medications)}`);
          console.log(`              conditions  : ${JSON.stringify(outcome.lookupRequest.conditions)}`);
          console.log(`              specialGrps : ${JSON.stringify(outcome.lookupRequest.specialGroups ?? [])}`);
          if (outcome.ungrounded.length > 0) {
            console.log(`              ungrounded  : ${JSON.stringify(outcome.ungrounded.map((u) => u.raw))}`);
          }
          break;
        case 'clarify_needed':
          console.log(`              intent      : ${outcome.intent}`);
          console.log(`              topic       : ${outcome.topic}`);
          console.log(`              question    : ${outcome.question.question}`);
          console.log(`              choices     : ${JSON.stringify(outcome.question.choices)}`);
          break;
        case 'symptom_candidates':
          for (const m of outcome.matched) {
            const slugs = m.candidates.map((c) => c.ingredientSlug).join(', ');
            console.log(`              ${pad(m.symptomZh, 16)} → [${slugs}]`);
          }
          if (outcome.unmatched.length > 0) {
            console.log(`              unmatched   : ${JSON.stringify(outcome.unmatched)}`);
          }
          break;
        case 'unsupported':
          console.log(`              intent : ${outcome.intent}`);
          console.log(`              reason : ${outcome.reason}`);
          break;
      }
    } catch (err) {
      console.error(`     ✗ fetch failed:`, err);
    }
  }
  console.log('─'.repeat(72));
}

main().catch((err) => {
  console.error('smoke failed:', err);
  process.exit(1);
});
