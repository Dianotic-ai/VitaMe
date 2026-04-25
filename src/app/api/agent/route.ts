// file: src/app/api/agent/route.ts — POST /api/agent（api-contract.md §3 AgentRequest → AgentResponse）
// D8 晚：接入 auditLogger（§11.10 红线）— 每步 tool trace 写一条 agent_trace 事件。
// 失败时 audit 仍要写（error 事件），不能因 LLM 挂了就丢日志。
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createVitameAgent } from '@/lib/agent/vitameAgent';
import { getAuditLogger } from '@/lib/capabilities/compliance/auditLogger';

export const maxDuration = 60;

const AgentRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
  demoMode: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const audit = getAuditLogger();
  const raw = await req.json().catch(() => null);
  const parsed = AgentRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error?.issues[0]?.message ?? 'invalid request';
    await audit.log({ event: 'error', sessionId: 'unknown', metadata: { route: '/api/agent', phase: 'validation', msg } }).catch(() => undefined);
    return NextResponse.json({ error: { kind: 'validation' as const, message: msg } }, { status: 400 });
  }

  const { sessionId, message } = parsed.data;
  const inputHash = audit.hash(message);

  try {
    const agent = createVitameAgent();
    const trace: Array<{ step: string; status: 'completed'; summary: string }> = [];
    const result = await agent.generate({
      prompt: message,
      onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
        const step = toolCalls?.[0]?.toolName ?? `step_${stepNumber}`;
        trace.push({ step, status: 'completed', summary: `finishReason=${finishReason}` });
        audit
          .log({
            event: 'agent_trace',
            sessionId,
            inputHash,
            metadata: { step, stepNumber, finishReason },
          })
          .catch((e: unknown) => {
            console.error('[auditLogger] agent_trace write failed', e);
          });
      },
    });

    const outputHash = audit.hash(result.text);
    await audit.log({
      event: 'agent_trace',
      sessionId,
      inputHash,
      outputHash,
      metadata: { phase: 'completed', toolCount: trace.length },
    });

    return NextResponse.json({
      sessionId,
      trace,
      text: result.text,
      disclaimer:
        '本判断仅供参考，不构成医疗建议。Demo 期间的禁忌规则尚未经临床药剂师完整审核，每条命中会挂 DemoBanner。',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await audit.log({ event: 'error', sessionId, inputHash, metadata: { route: '/api/agent', phase: 'generate', msg } }).catch(() => undefined);
    return NextResponse.json({ error: { kind: 'internal' as const, message: msg } }, { status: 500 });
  }
}
