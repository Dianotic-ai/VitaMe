// file: src/lib/agent/actionPlan.ts — deterministic: overallLevel + 上下文 → action cards
// 契约（api-contract.md §3 ActionCard）：每张卡 { label, intent, enabled }
// 红线：不诊断、不处方、不具体剂量；高风险场景必含 ask_doctor。
// 该模块纯函数 + 无 LLM，可单元测（T-D8.5 可补测试）。

import type { RiskLevel } from '@/lib/types/risk';

export type ActionIntent =
  | 'avoid'
  | 'ask_doctor'
  | 'review_evidence'
  | 'save_preview'
  | 'reminder_preview';

export interface ActionCard {
  label: string;
  intent: ActionIntent;
  enabled: boolean;
}

export interface ActionPlanInput {
  overallLevel: RiskLevel;
  riskCount: number;
  hasMedication: boolean;
}

const LABEL: Record<ActionIntent, string> = {
  avoid: '先不要自行服用',
  ask_doctor: '带这份结果问医生/药师',
  review_evidence: '查看证据来源',
  save_preview: '保存到档案',
  reminder_preview: '服用后设个轻提醒',
};

/** 按 overallLevel + hasMedication 决定 action cards。red 永远 avoid + ask_doctor 置顶。 */
export function buildActionPlan(input: ActionPlanInput): ActionCard[] {
  const cards: ActionCard[] = [];

  if (input.overallLevel === 'red') {
    cards.push(card('avoid'));
    cards.push(card('ask_doctor'));
  } else if (input.overallLevel === 'yellow') {
    cards.push(card('ask_doctor'));
  }

  // gray 和 green：仍给 ask_doctor 选项但作为 secondary（尤其 hasMedication 时）
  if (input.hasMedication && input.overallLevel !== 'red' && input.overallLevel !== 'yellow') {
    cards.push(card('ask_doctor'));
  }

  cards.push(card('review_evidence'));
  cards.push(card('save_preview'));

  // reminder_preview 仅在 green/gray（低风险）显示，避免对 red/yellow 暗示"放心吃"
  if (input.overallLevel === 'green' || input.overallLevel === 'gray') {
    cards.push(card('reminder_preview'));
  }

  return cards;
}

function card(intent: ActionIntent): ActionCard {
  return { label: LABEL[intent], intent, enabled: true };
}
