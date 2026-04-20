// file: src/lib/types/ingredient.ts — L1 呈现层成分契约（NIH + LPI + 中国 DRIs + PubChem 合并烘焙产物）

import type { SourceRef } from './sourceRef';

/**
 * Ingredient = 标准化单一成分（镁 / 鱼油 / 辅酶 Q10 ...）。
 * 落地在 src/lib/db/ingredients.ts，由 bakeNih + bakeLpi + bakeCnDri + bakePubchem 四个脚本合并写入。
 * §11.4 合规红线：sourceRefs 非空，缺源 = 违规。
 */
export interface Ingredient {
  /** 稳定 slug，bake 脚本保证唯一（如 'magnesium' / 'coenzyme-q10' / 'fish-oil'） */
  id: string;
  nameEn: string;                          // 'Magnesium'
  nameZh: string;                          // '镁'
  /** 同义词/俗名/缩写，供 InputNormalizer 查找 */
  aliases: string[];
  /** 多种化学形式（镁有 4 种、维 D 有 D2/D3、鱼油含 EPA/DHA 等） */
  forms: IngredientForm[];
  /** 中美两套每日推荐摄入 / 可耐受上限 */
  dri: DRIReference;
  /** LPI 增量字段 —— 健康影响关键词（供 prompt + 翻译层引用） */
  healthEffects?: string[];
  /** 证据强度（循证级别） */
  evidenceLevel?: EvidenceStrength;
  /** NIH/LPI 翻译后的作用机制段落（L3 翻译模板可引用） */
  mechanism?: string;
  /** 关联的硬编码 Contraindication id 列表（查 contraindications.ts） */
  contraindicationIds: string[];
  /** 按字段级挂源的证据来源数组（不是条目级一个 tag） */
  sourceRefs: SourceRef[];
}

export type EvidenceStrength = 'strong' | 'moderate' | 'limited' | 'insufficient';

/**
 * IngredientForm = 同一成分的不同化学形式。
 * 对镁来说是氧化/柠檬酸/甘氨酸/苏糖酸；对鱼油是 EPA/DHA 比例；对维 D 是 D2/D3。
 * FormComparator 在 L3 翻译层引用此结构做吸收率对比。
 */
export interface IngredientForm {
  nameEn: string;                          // 'Magnesium Glycinate'
  nameZh: string;                          // '甘氨酸镁'
  /** PubChem Compound ID（bakePubchem 填入，供化学形式校验） */
  pubchemCid?: number;
  /** 吸收率 0–1，相对参考值（如氧化镁 ≈ 0.04，甘氨酸镁 ≈ 0.40） */
  absorptionRate?: number;
  /** 使用建议短语（"助眠 / 刺激小 / 敏感人群推荐"） */
  notes: string;
  /** 该 form 特有的源（甘氨酸镁来自 PubChem CID 84753 等） */
  sourceRefs?: SourceRef[];
}

/**
 * DRIReference = 剂量参考值。双轨：美国 NIH ODS + 中国营养学会。
 * 任一侧可能缺失（如冷门成分中国未立标准）。
 */
export interface DRIReference {
  us: DRIValues;
  cn: DRIValues;
}

export interface DRIValues {
  /** Recommended Daily Intake / Recommended Nutrient Intake（美国叫 RDI，中国叫 RNI） */
  rdi?: number;
  /** Tolerable Upper Intake Level */
  ul?: number;
  unit: string;                            // 'mg' / 'mcg' / 'IU' / 'g'
}
