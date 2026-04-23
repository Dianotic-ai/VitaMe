// file: src/lib/api/slugMappings.ts — UI 文案 → contraindications.ts 规范 slug 的桥
//
// 为什么要这层：
//   /query 页用户敲的是 '鱼油'，/intake 页选项是 '华法林 / 抗凝药'，但 hardcodedAdapter
//   只认 'fish-oil' / 'warfarin' 这种 slug（src/lib/db/contraindications.ts）。这里集中
//   维护映射，避免在 UI 文件里散落字符串硬编码。
//
// 覆盖：
//   1. EXAMPLE_QUERIES（/query 页 6 条快捷链接）
//   2. MOCK_INTAKE_QUESTIONS 4 题选项（/intake 页）
//   3. 20 条 demo 种子题里出现的成分中文名（docs/小红书需求调研/Demo种子问题清单-20条.md）
//
// 已知留白（无对应 slug，保持空映射 → 走 gray no_data）：
//   - chronic-conditions: '高血压' / '糖尿病' / '肾病' （contraindications.ts 未覆盖）
//   - special-groups: '哺乳期' / '备孕期' / '14 岁以下' / '65 岁以上'
//   - 部分长尾成分（葡萄籽、Q10 以外的辅酶等）

import type { LookupRequest } from '@/lib/types/adapter';

/**
 * 关键词 → ingredient slug[]。
 * 用于 /query 页文本输入：includes() 命中即返回 slug。
 * 一个 key 可映射多个 slug（虽然 P0 暂未出现一对多场景，留 string[] 给未来扩展）。
 */
export const INGREDIENT_QUERY_MAP: Record<string, string[]> = {
  // EXAMPLE_QUERIES
  鱼油: ['fish-oil'],
  'fish oil': ['fish-oil'],
  omega: ['fish-oil'],
  epa: ['fish-oil'],
  dha: ['fish-oil'],
  镁: ['magnesium'],
  magnesium: ['magnesium'],
  '维生素 d': ['vitamin-d'],
  维生素d: ['vitamin-d'],
  '维 d': ['vitamin-d'],
  维d: ['vitamin-d'],
  d3: ['vitamin-d'],
  'vitamin d': ['vitamin-d'],
  q10: ['coenzyme-q10'],
  '辅酶 q10': ['coenzyme-q10'],
  辅酶q10: ['coenzyme-q10'],
  coq10: ['coenzyme-q10'],
  益生菌: ['probiotic'],
  probiotic: ['probiotic'],
  // 20 seed 里额外出现的成分
  '维 b6': ['vitamin-b6'],
  b6: ['vitamin-b6'],
  '维 b': ['vitamin-b-complex'],
  '维生素 b': ['vitamin-b-complex'],
  维生素b: ['vitamin-b-complex'],
  'vitamin b': ['vitamin-b-complex'],
  '维 c': ['vitamin-c'],
  '维生素 c': ['vitamin-c'],
  维生素c: ['vitamin-c'],
  'vitamin c': ['vitamin-c'],
  钙: ['calcium'],
  calcium: ['calcium'],
  铁: ['iron'],
  iron: ['iron'],
  铬: ['chromium'],
  chromium: ['chromium'],
  肉桂: ['cinnamon'],
  cinnamon: ['cinnamon'],
  '维 a': ['vitamin-a'],
  '维生素 a': ['vitamin-a'],
  维生素a: ['vitamin-a'],
  '维 e': ['vitamin-e'],
  '维生素 e': ['vitamin-e'],
  维生素e: ['vitamin-e'],
  硒: ['selenium'],
  selenium: ['selenium'],
  碘: ['iodine'],
  iodine: ['iodine'],
  锌: ['zinc'],
  zinc: ['zinc'],
  叶酸: ['folate'],
  folate: ['folate'],
  胆碱: ['choline'],
  choline: ['choline'],
  'b12': ['vitamin-b12'],
  '维 b12': ['vitamin-b12'],
  维生素k: ['vitamin-k'],
  '维生素 k': ['vitamin-k'],
  // P0 D6 红规则解锁
  圣约翰草: ['st-johns-wort'],
  贯叶连翘: ['st-johns-wort'],
  'st johns wort': ['st-johns-wort'],
  'st-johns-wort': ['st-johns-wort'],
  银杏: ['ginkgo'],
  银杏叶: ['ginkgo'],
  ginkgo: ['ginkgo'],
};

/**
 * MOCK_INTAKE_QUESTIONS '当前用药' 选项 → drug/drugClass slug[]。
 * 一对多场景：'降压药' 同时匹配单药 amlodipine 与药类 antihypertensive-stack。
 */
export const MEDICATION_OPTION_MAP: Record<string, string[]> = {
  '华法林 / 抗凝药': ['warfarin'],
  'SSRI / 抗抑郁药': ['ssri-use'],
  降压药: ['amlodipine', 'antihypertensive-stack'],
  '二甲双胍 / 降糖药': ['metformin', 'diabetes-medications'],
  '胃药（质子泵抑制剂）': [], // PPI 暂未进硬编码规则
  优甲乐: ['levothyroxine'],
  左甲状腺素: ['levothyroxine'],
  // P0 D6 红规则解锁
  避孕药: ['oral-contraceptive'],
  口服避孕药: ['oral-contraceptive'],
  短效避孕药: ['oral-contraceptive'],
  // D7 alias 增量（contraindications 暂无 slug，标 recognized=true 防 ungrounded → clarify 反复）
  他汀: [],
  他汀类: [],
  他汀类药物: [],
  辛伐他汀: [],
  阿托伐他汀: [],
  瑞舒伐他汀: [],
  甲巯咪唑: [],
  丙基硫氧嘧啶: [],
  都没有: [],
};

/**
 * MOCK_INTAKE_QUESTIONS '慢性病史' 选项 → condition slug[]。
 * '高血压' / '糖尿病' / '肾病' 等暂无对应禁忌规则，保留空映射（走 gray no_data）。
 */
export const CONDITION_OPTION_MAP: Record<string, string[]> = {
  高血压: [],
  糖尿病: [],
  '肝病 / 脂肪肝': ['active-hepatitis'],
  肝炎: ['active-hepatitis'],
  肾病: ['kidney-impairment'],
  肾功能不全: ['kidney-impairment'],
  肾功能下降: ['kidney-impairment'],
  慢性肾病: ['kidney-impairment'],
  ckd: ['kidney-impairment'],
  肾结石: ['kidney-stone-history'],
  甲状腺疾病: ['thyroid-disorder'],
  甲减: ['thyroid-disorder'],
  甲亢: ['thyroid-disorder'],
  甲状腺功能亢进: ['thyroid-disorder'],
  甲状腺功能减退: ['thyroid-disorder'],
  桥本: ['thyroid-disorder'],
  桥本甲状腺炎: ['thyroid-disorder'],
  胃溃疡: ['gastric-ulcer'],
  胃肠敏感: ['gastric-sensitivity'],
  易腹泻: ['diarrhea-prone'],
  凝血异常: ['coagulation-abnormality'],
  都没有: [],
};

/**
 * MOCK_INTAKE_QUESTIONS '特殊人群' 选项 → specialGroup slug[]。
 *
 * 注：含 LLM 在自然语言里常用的 alias（孕妇/哺乳/儿童/老人 等）。
 * value 为 [] 的 key 表示"业务承认但暂无禁忌规则"，groundFromOptionMap 会标 recognized=true，
 * 不进 ungroundedMentions，下游 L2 自然 no-hit 走 gray no_data — 比"没听懂"体验好。
 */
export const SPECIAL_GROUP_OPTION_MAP: Record<string, string[]> = {
  孕期: ['pregnancy'],
  孕妇: ['pregnancy'],
  孕中: ['pregnancy'],
  怀孕: ['pregnancy'],
  备孕: ['pregnancy'],
  备孕期: ['pregnancy'],
  哺乳期: [],
  哺乳中: [],
  哺乳: [],
  '14 岁以下': [],
  儿童: [],
  小孩: [],
  小朋友: [],
  '65 岁以上': [],
  老年: [],
  老人: [],
  // P0 D6 红规则：婴幼儿维 A
  婴儿: ['infant'],
  婴幼儿: ['infant'],
  '6 个月': ['infant'],
  宝宝: ['infant'],
  新生儿: ['infant'],
  无: [],
};

/**
 * 基因 slug 映射（P0 contraindications.ts 仅 apoe4，UI 暂未暴露选项；保留导出给将来 intake 扩展）。
 */
export const GENE_OPTION_MAP: Record<string, string[]> = {
  APOE4: ['apoe4'],
  apoe4: ['apoe4'],
};

/**
 * 把用户敲入的 query 文本拆成 ingredient slug[]。
 * 简单 includes() 模糊匹配，命中即去重收集。
 */
export function parseIngredientQuery(query: string): string[] {
  const lower = query.toLowerCase();
  const out = new Set<string>();
  for (const [keyword, slugs] of Object.entries(INGREDIENT_QUERY_MAP)) {
    if (lower.includes(keyword.toLowerCase())) {
      for (const s of slugs) out.add(s);
    }
  }
  return Array.from(out);
}

/**
 * 通用：option 标签数组 → 拼平去重的 slug 数组。
 */
function mapOptions(options: string[], table: Record<string, string[]>): string[] {
  const out = new Set<string>();
  for (const opt of options) {
    const slugs = table[opt];
    if (slugs) for (const s of slugs) out.add(s);
  }
  return Array.from(out);
}

export interface IntakeAnswers {
  /** /query 页的文本 query（如 '鱼油 + Q10'） */
  query: string;
  /** /intake current-medications 选项标签数组 */
  currentMedications?: string[];
  /** /intake chronic-conditions 选项标签数组 */
  chronicConditions?: string[];
  /** /intake special-groups 选项标签数组（single answerType，但仍传数组保持一致） */
  specialGroups?: string[];
}

/**
 * 把 UI 收集到的「query 文本 + intake 答案」组装成 LookupRequest。
 * Adapter 只认 slug，所以这里负责一次性翻译干净。
 */
export function buildLookupRequest(answers: IntakeAnswers): LookupRequest {
  return {
    ingredients: parseIngredientQuery(answers.query),
    medications: mapOptions(answers.currentMedications ?? [], MEDICATION_OPTION_MAP),
    conditions: mapOptions(answers.chronicConditions ?? [], CONDITION_OPTION_MAP),
    specialGroups: mapOptions(answers.specialGroups ?? [], SPECIAL_GROUP_OPTION_MAP),
  };
}
