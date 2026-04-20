// file: src/lib/db/cn-dri-values.ts — 由 scripts/bakeCnDri.ts 生成；勿手改
//
// 源: 中国营养学会《中国居民膳食营养素参考摄入量（2023 版）》
// 采集日: 2026-04-19
// 入库条目: 23  / 原始行数: 30  / 跳过（rdi 与 ul 均空）: 7

import 'server-only';
import type { DRIValues } from '@/lib/types/ingredient';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface CnDriEntry {
  ingredientId: string;
  cn: DRIValues;
  sourceRef: SourceRef;
  note?: string;
}

export const CN_DRI_VALUES: readonly CnDriEntry[] = [
  {
    ingredientId: "biotin",
    cn: { rdi: 40, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "biotin",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI",
  },
  {
    ingredientId: "calcium",
    cn: { rdi: 800, ul: 2000, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "calcium",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "choline",
    cn: { rdi: 500, ul: 3000, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "choline",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI；成年男性；成年女性 AI 400mg",
  },
  {
    ingredientId: "chromium",
    cn: { rdi: 30, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "chromium",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI；中国 DRIs 未列 UL",
  },
  {
    ingredientId: "copper",
    cn: { rdi: 0.8, ul: 8, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "copper",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "folate",
    cn: { rdi: 400, ul: 1000, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "folate",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "单位 µg DFE；备孕/孕早期另有 600 µg DFE 推荐，不在本表默认值",
  },
  {
    ingredientId: "iodine",
    cn: { rdi: 120, ul: 600, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "iodine",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "孕期另有 230 µg RNI 推荐，不在本表默认值",
  },
  {
    ingredientId: "iron",
    cn: { rdi: 12, ul: 42, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "iron",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "成年男性/绝经后女性 RNI；育龄女性 RNI 20mg 需 ingredients.ts 按性别分支",
  },
  {
    ingredientId: "magnesium",
    cn: { rdi: 330, ul: 700, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "magnesium",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "UL 仅针对补充剂来源；膳食镁不计入",
  },
  {
    ingredientId: "manganese",
    cn: { rdi: 4.5, ul: 11, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "manganese",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI",
  },
  {
    ingredientId: "niacin",
    cn: { rdi: 15, ul: 35, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "niacin",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "单位 mg NE（niacin equivalent）；成年男性 RNI；成年女性 12mg NE",
  },
  {
    ingredientId: "pantothenic-acid",
    cn: { rdi: 5, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "pantothenic-acid",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI",
  },
  {
    ingredientId: "riboflavin",
    cn: { rdi: 1.4, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "riboflavin",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "成年男性 RNI；成年女性 1.2mg",
  },
  {
    ingredientId: "selenium",
    cn: { rdi: 60, ul: 400, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "selenium",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "thiamin",
    cn: { rdi: 1.4, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "thiamin",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "成年男性 RNI；成年女性 1.2mg",
  },
  {
    ingredientId: "vitamin-a",
    cn: { rdi: 800, ul: 3000, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-a",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "单位 µg RAE；成年男性 RNI；成年女性 700 µg RAE",
  },
  {
    ingredientId: "vitamin-b12",
    cn: { rdi: 2.4, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-b12",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-b6",
    cn: { rdi: 1.4, ul: 60, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-b6",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-c",
    cn: { rdi: 100, ul: 2000, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-c",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-d",
    cn: { rdi: 10, ul: 50, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-d",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "单位 µg；400 IU ≈ 10 µg，2000 IU ≈ 50 µg",
  },
  {
    ingredientId: "vitamin-e",
    cn: { rdi: 14, ul: 700, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-e",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI；单位 mg α-TE",
  },
  {
    ingredientId: "vitamin-k",
    cn: { rdi: 80, unit: "mcg" },
    sourceRef: {
      source: 'cn-dri',
      id: "vitamin-k",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "AI",
  },
  {
    ingredientId: "zinc",
    cn: { rdi: 12.5, ul: 40, unit: "mg" },
    sourceRef: {
      source: 'cn-dri',
      id: "zinc",
      url: "https://www.cnsoc.org/",
      retrievedAt: "2026-04-19",
    },
    note: "成年男性 RNI；成年女性 RNI 7.5mg",
  },
];

export const CN_DRI_BY_ID: ReadonlyMap<string, CnDriEntry> = new Map(
  CN_DRI_VALUES.map((e) => [e.ingredientId, e]),
);
