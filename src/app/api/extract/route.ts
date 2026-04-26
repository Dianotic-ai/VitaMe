// file: src/app/api/extract/route.ts — Memory Extractor 路由
//
// POST {sessionId, userMsg, assistantMsg} → 调 extractor → 返回 ProfileDelta
// 客户端在 chat 流结束后异步调，merge 进 profileStore
//
// runtime = nodejs（不用流式，普通 JSON 响应）
// 不强制 Edge：extractor 是 fire-and-forget，5-8s 延迟用户感知不到

import { NextResponse } from 'next/server';
import { extractMemoryFromTurn } from '@/lib/profile/memoryExtractor';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ExtractBody {
  sessionId?: string;
  userMsg?: string;
  assistantMsg?: string;
}

export async function POST(req: Request) {
  let body: ExtractBody;
  try {
    body = (await req.json()) as ExtractBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const userMsg = body.userMsg?.trim();
  const assistantMsg = body.assistantMsg?.trim();

  if (!userMsg || !assistantMsg) {
    return NextResponse.json({ error: 'userMsg and assistantMsg required' }, { status: 400 });
  }

  // 跳过过短的对话（如用户只回 "好" 或 "嗯"）
  if (userMsg.length < 3) {
    return NextResponse.json({ delta: {}, skipped: true });
  }

  const delta = await extractMemoryFromTurn({ userMsg, assistantMsg });
  return NextResponse.json({ delta });
}
