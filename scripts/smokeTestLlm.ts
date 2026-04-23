// file: scripts/smokeTestLlm.ts — 一次性 smoke：直接调 Anthropic SDK 验证 token + endpoint + model 真能通
// 跑法：npx tsx scripts/smokeTestLlm.ts
// 注意：本脚本会真消耗一次 token quota。
// 不走 src/lib/adapters/llm/client.ts（那个有 server-only 守，需要 Next.js context）— client 行为由 unit test 覆盖。

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';

async function main() {
  const provider = process.env.LLM_PROVIDER;
  const model = process.env.LLM_MODEL;
  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;

  if (!provider || !model || !baseURL || !apiKey) {
    console.error('缺 env 变量。需要：LLM_PROVIDER / LLM_MODEL / LLM_BASE_URL / LLM_API_KEY');
    process.exit(1);
  }

  console.log(`provider=${provider} model=${model}`);
  console.log(`baseURL=${baseURL} apiKey=${apiKey.slice(0, 12)}...`);

  const anthropic = new Anthropic({
    baseURL,
    authToken: apiKey,
    timeout: 30_000,
  });

  console.log('\n[1/2] chat: "你好，用一句话介绍维生素 D 的作用。"');
  const res1 = await anthropic.messages.create({
    model,
    max_tokens: 200,
    messages: [{ role: 'user', content: '你好，用一句话介绍维生素 D 的作用。' }],
  });
  const text1 = res1.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('');
  console.log('✅ stop_reason:', res1.stop_reason);
  console.log('✅ usage:', res1.usage);
  console.log('✅ text:', text1);

  console.log('\n[2/2] chat with system + JSON-style prompt');
  const res2 = await anthropic.messages.create({
    model,
    max_tokens: 300,
    system: '你是一个补剂安全助手。回答用 JSON 格式，字段：summary (string), level (red|yellow|green)。',
    messages: [{ role: 'user', content: '钙片可以和铁剂同时吃吗？只输出 JSON 不要解释。' }],
    temperature: 0.3,
  });
  const text2 = res2.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('');
  console.log('✅ stop_reason:', res2.stop_reason);
  console.log('✅ usage:', res2.usage);
  console.log('✅ text:\n', text2);

  console.log('\n🎉 smoke test passed');
}

main().catch((err) => {
  console.error('💥 FAIL:', err.message ?? err);
  if (err.status) console.error('   HTTP status:', err.status);
  process.exit(1);
});
