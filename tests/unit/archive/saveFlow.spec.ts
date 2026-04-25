// file: tests/unit/archive/saveFlow.spec.ts — addArchiveEntry / ensurePerson / listEntriesForPerson 单测
import { describe, it, expect } from 'vitest';
import {
  ARCHIVE_SCHEMA_VERSION,
  addArchiveEntry,
  emptyArchive,
  ensurePerson,
  listEntriesForPerson,
} from '@/lib/archive/saveFlow';
import type { Risk } from '@/lib/types/risk';

const sampleRisk: Risk = {
  level: 'red',
  dimension: 'drug_interaction',
  cta: 'stop_and_consult',
  ingredient: 'fish-oil',
  reasonCode: 'bleeding_risk_anticoagulant',
  reasonShort: '鱼油 + 华法林 出血风险',
  evidence: {
    sourceType: 'hardcoded',
    sourceRef: 'vm-rule-fishoil-warfarin',
    confidence: 'high',
  },
};

describe('emptyArchive', () => {
  it('生成空 archive，version 对齐常量', () => {
    const a = emptyArchive();
    expect(a.version).toBe(ARCHIVE_SCHEMA_VERSION);
    expect(a.persons).toEqual([]);
    expect(a.entries).toEqual([]);
  });
});

describe('ensurePerson', () => {
  it('首次见 person → 插入；不 mutate 入参', () => {
    const a = emptyArchive();
    const a1 = ensurePerson(a, 'mom', '妈妈', 'other');
    expect(a.persons).toEqual([]);              // 原对象不变
    expect(a1.persons.length).toBe(1);
    expect(a1.persons[0]?.label).toBe('妈妈');
  });

  it('重复 personId → 不重复插入', () => {
    let a = emptyArchive();
    a = ensurePerson(a, 'self', '自己');
    a = ensurePerson(a, 'self', '自己');
    expect(a.persons.length).toBe(1);
  });
});

describe('addArchiveEntry', () => {
  it('追加 entry + 合并 person context 去重', () => {
    let a = emptyArchive();
    a = ensurePerson(a, 'self', '自己');
    a = addArchiveEntry(
      a,
      {
        personId: 'self',
        sessionId: 's1',
        queryInput: {
          source: 'text',
          ingredients: ['fish-oil'],
          contextSnapshot: {
            conditions: ['hypertension'],
            medications: ['warfarin'],
            allergies: [],
            specialGroups: [],
          },
        },
        risks: [sampleRisk],
        overallLevel: 'red',
      },
      'entry-1',
    );
    expect(a.entries.length).toBe(1);
    const p = a.persons.find((x) => x.id === 'self')!;
    expect(p.conditions).toContain('hypertension');
    expect(p.medications).toContain('warfarin');

    // 第二次加同样 condition 不重复
    a = addArchiveEntry(
      a,
      {
        personId: 'self',
        sessionId: 's2',
        queryInput: {
          source: 'text',
          ingredients: ['coenzyme-q10'],
          contextSnapshot: {
            conditions: ['hypertension', 'diabetes'],
            medications: ['warfarin'],
            allergies: [],
            specialGroups: [],
          },
        },
        risks: [],
        overallLevel: 'green',
      },
      'entry-2',
    );
    const p2 = a.persons.find((x) => x.id === 'self')!;
    expect(p2.conditions).toEqual(['hypertension', 'diabetes']);  // 去重
    expect(p2.medications).toEqual(['warfarin']);                 // 同样去重
  });
});

describe('listEntriesForPerson', () => {
  it('按 personId 过滤 + 按 createdAt 倒序', async () => {
    let a = emptyArchive();
    a = ensurePerson(a, 'self', '自己');
    a = ensurePerson(a, 'mom', '妈妈');
    a = addArchiveEntry(
      a,
      {
        personId: 'self',
        sessionId: 's1',
        queryInput: { source: 'text', ingredients: [], contextSnapshot: { conditions: [], medications: [], allergies: [], specialGroups: [] } },
        risks: [],
        overallLevel: 'green',
      },
      'e-self-1',
    );
    // 人为让第二条时间戳晚一点
    await new Promise((r) => setTimeout(r, 10));
    a = addArchiveEntry(
      a,
      {
        personId: 'self',
        sessionId: 's2',
        queryInput: { source: 'text', ingredients: [], contextSnapshot: { conditions: [], medications: [], allergies: [], specialGroups: [] } },
        risks: [],
        overallLevel: 'green',
      },
      'e-self-2',
    );
    a = addArchiveEntry(
      a,
      {
        personId: 'mom',
        sessionId: 's3',
        queryInput: { source: 'text', ingredients: [], contextSnapshot: { conditions: [], medications: [], allergies: [], specialGroups: [] } },
        risks: [],
        overallLevel: 'green',
      },
      'e-mom-1',
    );
    const selfEntries = listEntriesForPerson(a, 'self');
    expect(selfEntries.map((e) => e.id)).toEqual(['e-self-2', 'e-self-1']);
    expect(selfEntries.every((e) => e.personId === 'self')).toBe(true);
  });
});
