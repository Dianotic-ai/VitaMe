// file: scripts/smokeAgent.ts — Agent shell 端到端 smoke（fetch /api/agent）
//
// 用途：跑 1 个关键场景（妈妈 + 华法林 + 辅酶Q10 → 期望 Agent 调 tool + 最终 red）

export {}; // tsconfig isolatedModules 要求每个文件是 module
//        验证 minimax Anthropic-compat 是否真支持 tool use。
//
// 怎么跑（两个终端，对齐 smokeIntent 模式）：
//   终端 1：npm run dev（等 "▲ Next.js ... Local: http://localhost:3000"）
//   终端 2：npm run smoke:agent
//
// 环境：
//   BASE_URL=http://localhost:3001 npm run smoke:agent    # 改端口
//
// 退出码：0=通过 / 1=LLM_API_KEY 缺 / 2=no tool called / 3=网络/解析错

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function main() {
  if (!process.env.LLM_API_KEY) {
    // tsx 加载 .env.local 走 'dotenv/config'；若本地没配（仅命令行起），提示
    console.log('[smokeAgent] 注意：此脚本通过 HTTP 打 /api/agent，真正读 LLM_API_KEY 的是 dev server 进程');
  }

  const prompt = '我妈 62 岁，正在吃华法林做抗凝，能加一颗辅酶 Q10 的软胶囊吗？';
  console.log(`[smokeAgent] BASE_URL=${BASE_URL}`);
  console.log(`[smokeAgent] prompt: ${prompt}\n`);

  const startMs = Date.now();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: `smoke-${Date.now()}`,
        message: prompt,
        demoMode: true,
      }),
    });
  } catch (err) {
    console.error('[smokeAgent] ❌ 网络错误（dev server 没起？）:', err);
    process.exit(3);
  }

  const elapsedMs = Date.now() - startMs;
  const bodyText = await res.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    console.error(`[smokeAgent] ❌ 非 JSON 响应 (status=${res.status}):`, bodyText.slice(0, 500));
    process.exit(3);
  }

  console.log(`[smokeAgent] status=${res.status} elapsed=${elapsedMs}ms`);
  console.log(`[smokeAgent] body:`, JSON.stringify(body, null, 2).slice(0, 3000));

  if (!res.ok) {
    console.error('[smokeAgent] ❌ HTTP 非 2xx');
    process.exit(3);
  }

  const trace = Array.isArray(body.trace) ? body.trace : [];
  const toolsUsed = trace
    .map((t) => (typeof t === 'object' && t && 'step' in t ? (t as { step: string }).step : ''))
    .filter((s) => s && !s.startsWith('step_'));

  console.log(`[smokeAgent] tools used: ${toolsUsed.join(', ') || '(none — agent pure text response)'}`);

  if (toolsUsed.length === 0) {
    console.error('[smokeAgent] ❌ 未调用任何 tool — minimax Anthropic-compat 可能不支持 tool use');
    console.error('[smokeAgent] 建议：检查 minimax 文档对 tools / tool_use 字段的支持');
    process.exit(2);
  }

  console.log('[smokeAgent] ✅ PASS — Agent shell 调了工具，tool use 链路通了');
  process.exit(0);
}

main();
