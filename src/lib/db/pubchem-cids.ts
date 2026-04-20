// file: src/lib/db/pubchem-cids.ts — 由 scripts/bakePubchem.ts 生成；勿手改
//
// 源: PubChem PUG REST
// 采集日: 2026-04-19
// 总条目: 31  /  命中 CID: 0  /  未命中（null）: 31

import 'server-only';
import type { SourceRef } from '@/lib/types/sourceRef';

export interface PubchemCidEntry {
  ingredientId: string;
  formNameEn: string;
  formNameZh: string;
  /** null = PubChem 未命中；上游 composer 应降级到 sourceType='limited' */
  pubchemCid: number | null;
  sourceRef: SourceRef;
}

export const PUBCHEM_CIDS: readonly PubchemCidEntry[] = [
  {
    ingredientId: "calcium",
    formNameEn: "Calcium Carbonate",
    formNameZh: "碳酸钙",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Calcium Carbonate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "calcium",
    formNameEn: "Calcium Citrate",
    formNameZh: "柠檬酸钙",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Calcium Citrate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "coenzyme-q10",
    formNameEn: "Ubiquinol",
    formNameZh: "泛醇",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ubiquinol",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "coenzyme-q10",
    formNameEn: "Ubiquinone",
    formNameZh: "泛醌",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ubiquinone",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "curcumin",
    formNameEn: "Curcumin",
    formNameZh: "姜黄素",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Curcumin",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "fish-oil",
    formNameEn: "Docosahexaenoic acid",
    formNameZh: "DHA (二十二碳六烯酸)",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Docosahexaenoic acid",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "fish-oil",
    formNameEn: "Icosapent",
    formNameZh: "EPA (二十碳五烯酸)",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Icosapent",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "folate",
    formNameEn: "Folic acid",
    formNameZh: "叶酸",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Folic acid",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "folate",
    formNameEn: "Levomefolic acid",
    formNameZh: "L-5-甲基四氢叶酸",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Levomefolic acid",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "iron",
    formNameEn: "Ferrous Bisglycinate",
    formNameZh: "甘氨酸亚铁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ferrous Bisglycinate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "iron",
    formNameEn: "Ferrous Sulfate",
    formNameZh: "硫酸亚铁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ferrous Sulfate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "magnesium",
    formNameEn: "Magnesium Citrate",
    formNameZh: "柠檬酸镁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Magnesium Citrate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "magnesium",
    formNameEn: "Magnesium Glycinate",
    formNameZh: "甘氨酸镁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Magnesium Glycinate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "magnesium",
    formNameEn: "Magnesium L-Threonate",
    formNameZh: "L-苏糖酸镁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Magnesium L-Threonate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "magnesium",
    formNameEn: "Magnesium Oxide",
    formNameZh: "氧化镁",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Magnesium Oxide",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "melatonin",
    formNameEn: "Melatonin",
    formNameZh: "褪黑素",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Melatonin",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "selenium",
    formNameEn: "Selenomethionine",
    formNameZh: "硒甲硫氨酸",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Selenomethionine",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-a",
    formNameEn: "Beta-Carotene",
    formNameZh: "β-胡萝卜素",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Beta-Carotene",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-a",
    formNameEn: "Retinol",
    formNameZh: "视黄醇",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Retinol",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-a",
    formNameEn: "Retinyl Palmitate",
    formNameZh: "棕榈酸视黄酯",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Retinyl Palmitate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-b12",
    formNameEn: "Cyanocobalamin",
    formNameZh: "氰钴胺",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Cyanocobalamin",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-b12",
    formNameEn: "Methylcobalamin",
    formNameZh: "甲钴胺",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Methylcobalamin",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-b6",
    formNameEn: "Pyridoxal phosphate",
    formNameZh: "5-磷酸吡哆醛 (P5P)",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Pyridoxal phosphate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-b6",
    formNameEn: "Pyridoxine",
    formNameZh: "吡哆醇",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Pyridoxine",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-c",
    formNameEn: "Ascorbic acid",
    formNameZh: "抗坏血酸",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ascorbic acid",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-c",
    formNameEn: "Sodium ascorbate",
    formNameZh: "抗坏血酸钠",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Sodium ascorbate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-d",
    formNameEn: "Cholecalciferol",
    formNameZh: "胆钙化醇 (维 D3)",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Cholecalciferol",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-d",
    formNameEn: "Ergocalciferol",
    formNameZh: "麦角钙化醇 (维 D2)",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Ergocalciferol",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "vitamin-e",
    formNameEn: "Alpha-Tocopherol",
    formNameZh: "α-生育酚",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Alpha-Tocopherol",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "zinc",
    formNameEn: "Zinc Gluconate",
    formNameZh: "葡萄糖酸锌",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Zinc Gluconate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
  {
    ingredientId: "zinc",
    formNameEn: "Zinc Picolinate",
    formNameZh: "吡啶甲酸锌",
    pubchemCid: null,
    sourceRef: {
      source: 'pubchem',
      id: "name:Zinc Picolinate",
      url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/",
      retrievedAt: "2026-04-19",
    },
  },
];

export const PUBCHEM_CID_BY_KEY: ReadonlyMap<string, PubchemCidEntry> = new Map(
  PUBCHEM_CIDS.map((e) => [`${e.ingredientId}|${e.formNameEn}`, e]),
);
