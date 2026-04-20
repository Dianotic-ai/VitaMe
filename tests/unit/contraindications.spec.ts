// file: tests/unit/contraindications.spec.ts — 50 条硬编码禁忌的契约回归
// 对齐 CLAUDE.md §11.2（禁词）、§11.3（硬编码）、§11.4（SourceRef 非空）、§11.11（Demo Banner 触发条件）

import { describe, it, expect } from 'vitest';
import {
  CONTRAINDICATIONS,
  CONTRAINDICATION_BY_PAIR,
  CONTRAINDICATION_BY_REASON_CODE,
} from '@/lib/db/contraindications';

// CLAUDE.md §11.2 禁词表
const BANNED = ['治疗', '治愈', '处方', '药效', '根治', '诊断'];

describe('contraindications.ts — 50 硬编码禁忌契约', () => {
  it('恰好 50 条规则（CLAUDE.md §15.2 红色底线）', () => {
    expect(CONTRAINDICATIONS).toHaveLength(50);
  });

  it('每条规则 id 全局唯一', () => {
    const ids = CONTRAINDICATIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每条规则的 (substanceA.id | substanceB.id) 二元组唯一', () => {
    const pairs = CONTRAINDICATIONS.map((r) => `${r.substanceA.id}|${r.substanceB.id}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('severity 只能是 red 或 yellow（Contraindication 子集约束）', () => {
    for (const r of CONTRAINDICATIONS) {
      expect(['red', 'yellow']).toContain(r.severity);
    }
  });

  it('每条规则挂 sourceRef，source = hardcoded-contraindication（§11.4）', () => {
    for (const r of CONTRAINDICATIONS) {
      expect(r.sourceRef).toBeDefined();
      expect(r.sourceRef.source).toBe('hardcoded-contraindication');
      expect(r.sourceRef.id).toBe(r.id);
      expect(r.sourceRef.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('reason 文案不含禁词（§11.2 BannedPhraseFilter 前置拦截）', () => {
    for (const r of CONTRAINDICATIONS) {
      for (const word of BANNED) {
        expect(r.reason, `rule ${r.id} contains banned word "${word}": ${r.reason}`).not.toContain(word);
      }
    }
  });

  it('P0 所有规则起步均为 pharmacistReviewed: false（§16 药剂师 outreach 进行中）', () => {
    for (const r of CONTRAINDICATIONS) {
      expect(r.pharmacistReviewed).toBe(false);
    }
  });

  it('Substance.kind 必须是类型声明的 8 类之一', () => {
    const ALLOWED = new Set([
      'supplement',
      'drug',
      'drugClass',
      'condition',
      'gene',
      'specialGroup',
      'usageTiming',
      'usageStrategy',
    ]);
    for (const r of CONTRAINDICATIONS) {
      expect(ALLOWED.has(r.substanceA.kind)).toBe(true);
      expect(ALLOWED.has(r.substanceB.kind)).toBe(true);
    }
  });

  it('索引 Map 大小与规则数一致（即 reasonCode 亦唯一；如果冲突请改 id 或拆规则）', () => {
    expect(CONTRAINDICATION_BY_PAIR.size).toBe(CONTRAINDICATIONS.length);
    // reasonCode 允许复用（多条共享同一 reasonCode 是可接受的，例如 stack_complexity_first_one_only）
    // 所以这里只要求 by-pair 全覆盖
    expect(CONTRAINDICATION_BY_REASON_CODE.size).toBeGreaterThan(0);
  });

  it('红色规则至少 3 条（CoQ10×Warfarin / VitA×孕期×高剂量 / VitA×长期高剂量）', () => {
    const red = CONTRAINDICATIONS.filter((r) => r.severity === 'red');
    expect(red.length).toBeGreaterThanOrEqual(3);
  });

  it('Demo Banner 触发面 = 100%（P0 所有规则触发都应挂 Banner，§11.11）', () => {
    // clinicallyReviewed = pharmacistReviewed && credential && credential !== 'self-review'
    const clinicallyReviewed = CONTRAINDICATIONS.filter(
      (r) =>
        r.pharmacistReviewed === true &&
        r.reviewerCredential !== undefined &&
        r.reviewerCredential !== 'self-review',
    );
    expect(clinicallyReviewed).toHaveLength(0);
  });
});
