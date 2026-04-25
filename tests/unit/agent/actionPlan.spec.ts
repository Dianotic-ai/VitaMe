// file: tests/unit/agent/actionPlan.spec.ts — buildActionPlan 4 level × hasMedication 分支覆盖
import { describe, it, expect } from 'vitest';
import { buildActionPlan } from '@/lib/agent/actionPlan';

describe('buildActionPlan', () => {
  it('red → 首位 avoid + ask_doctor，无 reminder_preview（不暗示"放心吃"）', () => {
    const cards = buildActionPlan({ overallLevel: 'red', riskCount: 1, hasMedication: true });
    expect(cards[0]?.intent).toBe('avoid');
    expect(cards[1]?.intent).toBe('ask_doctor');
    expect(cards.find((c) => c.intent === 'reminder_preview')).toBeUndefined();
  });

  it('yellow → ask_doctor 在前，无 reminder_preview', () => {
    const cards = buildActionPlan({ overallLevel: 'yellow', riskCount: 2, hasMedication: false });
    expect(cards[0]?.intent).toBe('ask_doctor');
    expect(cards.find((c) => c.intent === 'avoid')).toBeUndefined();
    expect(cards.find((c) => c.intent === 'reminder_preview')).toBeUndefined();
  });

  it('gray + hasMedication=true → 含 ask_doctor（跨用药 context 提示问医生）', () => {
    const cards = buildActionPlan({ overallLevel: 'gray', riskCount: 0, hasMedication: true });
    expect(cards.some((c) => c.intent === 'ask_doctor')).toBe(true);
    expect(cards.some((c) => c.intent === 'reminder_preview')).toBe(true);
  });

  it('green + hasMedication=false → 含 reminder_preview，无 ask_doctor', () => {
    const cards = buildActionPlan({ overallLevel: 'green', riskCount: 0, hasMedication: false });
    expect(cards.some((c) => c.intent === 'reminder_preview')).toBe(true);
    expect(cards.some((c) => c.intent === 'ask_doctor')).toBe(false);
  });

  it('所有 intent 都带可渲染的中文 label 且 enabled=true', () => {
    const cards = buildActionPlan({ overallLevel: 'yellow', riskCount: 1, hasMedication: true });
    for (const c of cards) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.enabled).toBe(true);
    }
  });
});
