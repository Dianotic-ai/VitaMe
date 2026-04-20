// file: tests/unit/cn-dri-values.spec.ts — bakeCnDri 产物契约回归
// 对齐 CLAUDE.md §11.4（sourceRef 非空）+ §6.3（bake 体积与条数）

import { describe, it, expect } from 'vitest';
import { CN_DRI_VALUES, CN_DRI_BY_ID } from '@/lib/db/cn-dri-values';

describe('cn-dri-values.ts — bakeCnDri 产物', () => {
  it('至少 20 条（30 成分扣除复合/无 DRI 条目后应余 20+）', () => {
    expect(CN_DRI_VALUES.length).toBeGreaterThanOrEqual(20);
  });

  it('每条 sourceRef 非空且 source = cn-dri（§11.4）', () => {
    for (const e of CN_DRI_VALUES) {
      expect(e.sourceRef).toBeDefined();
      expect(e.sourceRef.source).toBe('cn-dri');
      expect(e.sourceRef.id).toBe(e.ingredientId);
      expect(e.sourceRef.url).toMatch(/^https?:\/\//);
      expect(e.sourceRef.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('rdi 与 ul 不得同时为 undefined（空条目应在 bake 阶段剔除）', () => {
    for (const e of CN_DRI_VALUES) {
      const hasAny = e.cn.rdi !== undefined || e.cn.ul !== undefined;
      expect(hasAny, `entry ${e.ingredientId} has both rdi and ul undefined`).toBe(true);
    }
  });

  it('unit 枚举合法（mg / mcg / IU / g）', () => {
    const ALLOWED = new Set(['mg', 'mcg', 'IU', 'g']);
    for (const e of CN_DRI_VALUES) {
      expect(ALLOWED.has(e.cn.unit)).toBe(true);
    }
  });

  it('ingredientId 唯一（索引 Map 大小一致）', () => {
    expect(CN_DRI_BY_ID.size).toBe(CN_DRI_VALUES.length);
  });

  it('核心营养素高覆盖（calcium / iron / zinc / magnesium / vitamin-d 均在表）', () => {
    const core = ['calcium', 'iron', 'zinc', 'magnesium', 'vitamin-d'];
    for (const id of core) {
      expect(CN_DRI_BY_ID.has(id), `missing ${id}`).toBe(true);
    }
  });

  it('rdi 与 ul 均为正数（Zod 已在 bake 时限定 .positive()）', () => {
    for (const e of CN_DRI_VALUES) {
      if (e.cn.rdi !== undefined) expect(e.cn.rdi).toBeGreaterThan(0);
      if (e.cn.ul !== undefined) expect(e.cn.ul).toBeGreaterThan(0);
    }
  });

  it('若同时提供 rdi 与 ul，ul 必须 ≥ rdi（剂量学基本约束）', () => {
    for (const e of CN_DRI_VALUES) {
      if (e.cn.rdi !== undefined && e.cn.ul !== undefined) {
        expect(e.cn.ul, `${e.ingredientId} ul<rdi`).toBeGreaterThanOrEqual(e.cn.rdi);
      }
    }
  });
});
