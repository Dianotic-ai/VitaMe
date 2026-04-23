import { describe, expect, it } from 'vitest';
import { buildPrompt } from '@/lib/capabilities/safetyTranslation/promptBuilder';
import type { Risk } from '@/lib/types/risk';

const baseRisk: Risk = {
  level: 'red',
  dimension: 'drug_interaction',
  cta: 'stop_and_consult',
  ingredient: 'coq10',
  medication: 'warfarin',
  reasonCode: 'vitamin_k_like_effect',
  reasonShort: '类维生素 K 效应',
  evidence: { sourceType: 'hardcoded', sourceRef: 'VitaMe-rule-coQ10_warfarin', confidence: 'high' },
};

describe('buildPrompt', () => {
  it('returns system + userMsg strings', () => {
    const out = buildPrompt(baseRisk);
    expect(typeof out.system).toBe('string');
    expect(typeof out.userMsg).toBe('string');
    expect(out.system.length).toBeGreaterThan(0);
    expect(out.userMsg.length).toBeGreaterThan(0);
  });

  it('system instructs JSON-only output with translation + avoidance keys', () => {
    const { system } = buildPrompt(baseRisk);
    expect(system).toMatch(/JSON/);
    expect(system).toMatch(/translation/);
    expect(system).toMatch(/avoidance/);
  });

  it('system enumerates banned words so the model self-censors', () => {
    const { system } = buildPrompt(baseRisk);
    // 至少列出 3 个核心禁词供模型自检
    expect(system).toMatch(/治疗/);
    expect(system).toMatch(/处方/);
    expect(system).toMatch(/诊断/);
  });

  it('system constrains the role (not a doctor) per CLAUDE.md §11.5', () => {
    const { system } = buildPrompt(baseRisk);
    expect(system).toMatch(/不是医生|非医生|不提供诊断/);
  });

  it('userMsg includes ingredient + reasonCode + reasonShort', () => {
    const { userMsg } = buildPrompt(baseRisk);
    expect(userMsg).toContain('coq10');
    expect(userMsg).toContain('vitamin_k_like_effect');
    expect(userMsg).toContain('类维生素 K 效应');
  });

  it('userMsg includes medication when present', () => {
    const { userMsg } = buildPrompt(baseRisk);
    expect(userMsg).toContain('warfarin');
  });

  it('userMsg includes condition when present and omits medication when absent', () => {
    const conditionRisk: Risk = {
      ...baseRisk,
      medication: undefined,
      condition: 'pregnancy',
      dimension: 'population_caution',
      reasonCode: 'retinol_pregnancy_teratogenicity',
      reasonShort: '孕期视黄醇致畸风险',
    };
    const { userMsg } = buildPrompt(conditionRisk);
    expect(userMsg).toContain('pregnancy');
    expect(userMsg).not.toContain('warfarin');
  });

  it('userMsg surfaces the risk level so model can match tone', () => {
    const yellow: Risk = { ...baseRisk, level: 'yellow', cta: 'consult_if_needed' };
    const red = buildPrompt(baseRisk).userMsg;
    const yellowMsg = buildPrompt(yellow).userMsg;
    expect(red).toMatch(/red|红/);
    expect(yellowMsg).toMatch(/yellow|黄/);
  });
});
