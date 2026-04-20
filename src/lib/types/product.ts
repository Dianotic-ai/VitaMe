// file: src/lib/types/product.ts — L3 适配层品牌产品契约（US / AU / JP / CN 四国产品库共用）

import type { SourceRef } from './sourceRef';

export type ProductCountry = 'US' | 'AU' | 'JP' | 'CN';

/**
 * ProductIngredient = 产品成分单元（成分 id + 剂量 + 单位 + 形式）。
 * ingredientId 必须与 src/lib/db/ingredients.ts 的 Ingredient.id 一致；
 * form 可选，若指定则应能在 Ingredient.forms 里找到对应条目（bake 时校验，runtime 不保证）。
 */
export interface ProductIngredient {
  ingredientId: string;
  dose: number;
  unit: string;                            // 'mg' / 'mcg' / 'IU' / 'g'
  form?: string;                           // 'glycinate' / 'ethyl_ester' / 'D3'
}

/**
 * Product = 一款可购买到的品牌补剂（Doctor's Best 镁 / Swisse 鱼油 / DHC 维生素 D ...）。
 * 落地在 tga-products.ts / japan-products.ts / china-products.ts 等；DSLD 不烘焙为产品库（pit #1），只当字典。
 */
export interface Product {
  /** 源 SKU：DSLD id / TGA AUST L / JP 機能性番号 / 蓝帽子批号 */
  sku: string;
  brand: string;
  nameOriginal: string;                    // 原文名
  nameZh?: string;                         // 中文名（若有官方译名）
  country: ProductCountry;
  ingredients: ProductIngredient[];
  /** 条形码（美国普遍有，澳日部分，国产少） */
  upc?: string;
  sourceRef: SourceRef;
}
