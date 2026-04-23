// file: src/lib/capabilities/safetyTranslation/promptBuilder.ts — Risk → LLM prompt（system + userMsg）
//
// 角色约束 + JSON 输出契约 + 禁词自检（CLAUDE.md §11.2 / §11.5 / §11.6）。
// LLM 只翻译，不改 level、不新增风险、不输出诊断/处方语。

import type { Risk } from '@/lib/types/risk';

const SYSTEM_PROMPT = `你是 VitaMe 的补剂安全翻译助手。你不是医生，不提供诊断、处方或医疗结论。

任务：把一条结构化的补剂安全风险，翻译成普通用户能在 30 秒内看懂的中文解释 + 一句具体可执行的规避建议。

严格输出 JSON，且只输出 JSON，不要任何解释、Markdown、代码围栏：
{
  "translation": "面向用户的中文原因解释，≤ 150 字，平实有画面感，不堆砌术语",
  "avoidance": "用户下一步可做的事，≤ 50 字，建议性而非命令式"
}

禁止使用以下词汇（含中英文及其变体）：治疗、治愈、处方、药效、根治、诊断、cure、prescribe、diagnosis。
禁止新增风险条目，禁止改变给定的 level，禁止承诺疗效，禁止给出剂量数字以外的处方。
若你不确定，请用"建议向医生咨询"收尾，不要编造。`;

export function buildPrompt(risk: Risk): { system: string; userMsg: string } {
  const lines: string[] = [];
  lines.push(`level=${risk.level}（${levelZh(risk.level)}）`);
  lines.push(`dimension=${risk.dimension}`);
  lines.push(`ingredient=${risk.ingredient}`);
  if (risk.medication) lines.push(`medication=${risk.medication}`);
  if (risk.condition) lines.push(`condition=${risk.condition}`);
  lines.push(`reasonCode=${risk.reasonCode}`);
  lines.push(`reasonShort=${risk.reasonShort}`);
  lines.push(`evidence.sourceType=${risk.evidence.sourceType}, confidence=${risk.evidence.confidence}`);

  const userMsg = `请翻译以下风险为用户可读的解释 + 规避建议：\n${lines.join('\n')}`;

  return { system: SYSTEM_PROMPT, userMsg };
}

function levelZh(l: Risk['level']): string {
  if (l === 'red') return '红';
  if (l === 'yellow') return '黄';
  if (l === 'gray') return '灰';
  return '绿';
}
