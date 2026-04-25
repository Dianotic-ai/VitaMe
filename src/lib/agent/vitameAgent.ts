// file: src/lib/agent/vitameAgent.ts — VitaMe P0 Agent shell（Vercel AI SDK ToolLoopAgent）
// agent-runtime-decision.md ADR：只做 tool routing，禁止自行输出风险等级。
import 'server-only';
import { ToolLoopAgent, stepCountIs } from 'ai';
import { createVitameProvider, getAgentModelId } from './provider';
import { vitameTools } from './tools';

const AGENT_INSTRUCTIONS = `你是 VitaMe 补剂安全 Agent。你的职责是理解用户的补剂/药物/症状相关问题，调度白名单工具，返回安全判断结果和下一步行动建议。

强制规则：
1. 风险等级（red/yellow/gray/green）只能来自 runJudgmentTool 的返回。你绝对不能自行说某个成分是"安全"或"危险"。
2. 处理流程必须是：parseIntentTool → runJudgmentTool → translateRiskTool → createActionPlanTool → createMemoryPreviewTool。每步一次，不循环。
3. 如果 parseIntentTool 返回 clarifyingQuestion，停止调用工具，直接把问题问给用户。
4. 不诊断疾病、不推荐处方药、不给出具体剂量建议。边界问题一律"请咨询医生"。
5. 所有最终回复都必须以结构化工具结果为依据，不凭空编造成分或机制。`;

export function createVitameAgent() {
  const provider = createVitameProvider();
  return new ToolLoopAgent({
    model: provider(getAgentModelId()),
    instructions: AGENT_INSTRUCTIONS,
    tools: vitameTools,
    stopWhen: stepCountIs(10),
  });
}
