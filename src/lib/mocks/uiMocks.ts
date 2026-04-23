// file: src/lib/mocks/uiMocks.ts — UI 页面壳的 mock 数据（W2-E 落 5 页用）；仅供 /query /intake /result /archive /recheck 消费，不接真实 API

import type { ArchiveEntry } from '@/lib/types/archive';
import type { Question } from '@/lib/types/query';
import type {
  RiskCta,
  RiskDimension,
  TranslatedRisk,
  TranslationResult,
} from '@/lib/types/risk';

/** /query 页的例子链接，点一下直接填入并提交 */
export const EXAMPLE_QUERIES: string[] = [
  '鱼油',
  'Doctor\'s Best Magnesium 200mg',
  '维生素 D3',
  'Swisse 葡萄籽',
  '辅酶 Q10',
  '益生菌',
];

/** /intake 页固定 4 题（取自 query-intake-design.md 场景 1） */
export const MOCK_INTAKE_QUESTIONS: Question[] = [
  {
    id: 'current-medications',
    promptZh: '你目前正在服用哪些药物？',
    answerType: 'multi',
    options: [
      '华法林 / 抗凝药',
      'SSRI / 抗抑郁药',
      '降压药',
      '二甲双胍 / 降糖药',
      '胃药（质子泵抑制剂）',
      '都没有',
    ],
    required: true,
    reasonHint: '用于判断补剂与药物是否冲突（例如鱼油 × 华法林）',
  },
  {
    id: 'chronic-conditions',
    promptZh: '你有以下慢性病史吗？（可多选）',
    answerType: 'multi',
    options: ['高血压', '糖尿病', '肝病 / 脂肪肝', '肾病', '甲状腺疾病', '都没有'],
    required: true,
    reasonHint: '部分补剂对特定病史人群禁用（例如维 A × 肝病）',
  },
  {
    id: 'allergies',
    promptZh: '是否对以下成分过敏？',
    answerType: 'multi',
    options: ['鱼 / 海鲜', '大豆', '乳制品', '坚果', '无已知过敏'],
    required: false,
    reasonHint: '过敏体质需要避开对应来源补剂（例如鱼油）',
  },
  {
    id: 'special-groups',
    promptZh: '是否属于特殊人群？',
    answerType: 'single',
    options: ['孕期', '哺乳期', '备孕期', '14 岁以下', '65 岁以上', '无'],
    required: false,
    reasonHint: '孕期等特殊人群对某些补剂有额外限制',
  },
];

/** dimension / cta 的中文展示文案（UI 标签用） */
export const DIMENSION_LABEL_ZH: Record<RiskDimension, string> = {
  drug_interaction: '药物相互作用',
  condition_contra: '病史禁忌',
  population_caution: '人群提示',
  dose_caution: '剂量 / 时序',
  form_difference: '成分形式',
  coverage_gap: '证据不足',
};

export const CTA_LABEL_ZH: Record<RiskCta, string> = {
  stop_and_consult: '停用并就医',
  consult_if_needed: '必要时咨询医生',
  recheck_with_more_context: '补充信息后重查',
  proceed_with_caution: '谨慎使用',
  basic_ok: '可正常使用',
};

/** evidence source 的 glyph（DESIGN.md §4.3 允许 emoji 作为源类型字形） */
export const EVIDENCE_GLYPH: Record<string, string> = {
  hardcoded: '📕',
  database: '📗',
  literature: '📘',
  limited: '📙',
  none: '📄',
};

/** /result 主 mock：2 红 + 1 黄 + 1 灰，覆盖 dimension 3 种 */
export const MOCK_TRANSLATED_RISKS: TranslatedRisk[] = [
  {
    level: 'red',
    dimension: 'drug_interaction',
    cta: 'stop_and_consult',
    ingredient: '鱼油 EPA/DHA',
    medication: '华法林',
    reasonCode: 'fish-oil_warfarin',
    reasonShort: '与华法林同服可能增加出血风险',
    evidence: {
      sourceType: 'hardcoded',
      sourceRef: 'VitaMe-rule-fishOil_warfarin',
      confidence: 'high',
    },
    secondaryEvidence: [
      { sourceType: 'database', sourceRef: 'SUPP.AI:fish-oil×warfarin', confidence: 'medium' },
    ],
    translation:
      '鱼油具有轻度抗凝作用，与华法林同服可能叠加出血风险。建议先暂停鱼油并与医生沟通。',
    avoidance: '暂停鱼油；保留华法林；下次复诊时告知医生，由医生决定是否恢复补充。',
    fallbackUsed: false,
  },
  {
    level: 'yellow',
    dimension: 'form_difference',
    cta: 'proceed_with_caution',
    ingredient: '镁（氧化镁）',
    reasonCode: 'magnesium_form_diff',
    reasonShort: '氧化镁吸收率偏低，胃肠敏感者易腹泻',
    evidence: {
      sourceType: 'literature',
      sourceRef: 'NIH-ODS:Magnesium-FactSheet-2024',
      confidence: 'medium',
    },
    translation:
      '你选的是氧化镁，吸收率约为甘氨酸镁的 1/4，胃肠敏感人群更容易腹泻。若目的是助眠，形式选择更关键。',
    avoidance: '考虑换成甘氨酸镁或苏糖酸镁形式；若坚持氧化镁，请随餐服用并从半量起试。',
    fallbackUsed: false,
    formComparison: [
      { form: 'oxide', nameZh: '氧化镁', absorptionRate: 0.04, noteZh: '最便宜；吸收低；偏通便' },
      { form: 'glycinate', nameZh: '甘氨酸镁', absorptionRate: 0.25, noteZh: '温和；助眠友好' },
      { form: 'threonate', nameZh: '苏糖酸镁', absorptionRate: 0.18, noteZh: '偏认知；价格高' },
    ],
  },
  {
    level: 'gray',
    dimension: 'coverage_gap',
    cta: 'recheck_with_more_context',
    ingredient: '辅酶 Q10',
    reasonCode: 'coQ10_insufficient_context',
    reasonShort: '尚未采集到与辅酶 Q10 相关的关键信息',
    evidence: { sourceType: 'none', sourceRef: 'coverage_gap', confidence: 'unknown' },
    translation:
      '暂未获得足够信息来判断辅酶 Q10 是否适合你。你是否在服用他汀类药物？是否有心脏病史？补充后可获得更精准判断。',
    avoidance: '在 /recheck 中补充"当前用药"与"心脏病史"两项后重新检查。',
    fallbackUsed: false,
  },
];

/** /result mock 总包 */
export const MOCK_TRANSLATION_RESULT: TranslationResult = {
  sessionId: 'mock-session-001',
  overallLevel: 'red',
  translatedRisks: MOCK_TRANSLATED_RISKS,
  disclaimer:
    'VitaMe 提供补剂安全信息和决策辅助，不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况，请及时咨询医生。',
};

/**
 * P0 设定：50 条禁忌规则的 pharmacistReviewed 全部为 false（CLAUDE.md §11.11 / §15.2）。
 * 所以 /result 页恒挂 <DemoBanner />。
 */
export const MOCK_PHARMACIST_REVIEWED = false;

/** /archive 列表 mock（3 条，覆盖红/黄/绿） */
export const MOCK_ARCHIVE_ENTRIES: ArchiveEntry[] = [
  {
    id: 'arc-001',
    personId: 'self',
    sessionId: 'mock-session-001',
    createdAt: '2026-04-18T10:23:00.000Z',
    queryInput: {
      source: 'text',
      ingredients: ['fish-oil', 'magnesium', 'coenzyme-q10'],
      contextSnapshot: {
        medications: ['华法林'],
        conditions: [],
        allergies: [],
        specialGroups: [],
      },
    },
    risks: [
      {
        level: 'red',
        dimension: 'drug_interaction',
        cta: 'stop_and_consult',
        ingredient: 'fish-oil',
        medication: '华法林',
        reasonCode: 'fish-oil_warfarin',
        reasonShort: '鱼油 × 华法林：出血风险',
        evidence: {
          sourceType: 'hardcoded',
          sourceRef: 'VitaMe-rule-fishOil_warfarin',
          confidence: 'high',
        },
      },
    ],
    overallLevel: 'red',
  },
  {
    id: 'arc-002',
    personId: 'self',
    sessionId: 'mock-session-002',
    createdAt: '2026-04-10T08:12:00.000Z',
    queryInput: {
      source: 'ocr',
      ingredients: ['vitamin-d3'],
      contextSnapshot: { medications: [], conditions: [], allergies: [], specialGroups: [] },
    },
    risks: [
      {
        level: 'yellow',
        dimension: 'dose_caution',
        cta: 'proceed_with_caution',
        ingredient: 'vitamin-d3',
        reasonCode: 'vitD3_dose_upper',
        reasonShort: '维 D3 日剂量接近上限',
        evidence: {
          sourceType: 'literature',
          sourceRef: 'NIH-ODS:VitaminD',
          confidence: 'medium',
        },
      },
    ],
    overallLevel: 'yellow',
  },
  {
    id: 'arc-003',
    personId: 'mom',
    sessionId: 'mock-session-003',
    createdAt: '2026-03-28T19:45:00.000Z',
    queryInput: {
      source: 'text',
      ingredients: ['probiotics'],
      contextSnapshot: { medications: [], conditions: [], allergies: [], specialGroups: [] },
    },
    risks: [
      {
        level: 'green',
        dimension: 'coverage_gap',
        cta: 'basic_ok',
        ingredient: 'probiotics',
        reasonCode: 'probiotics_clear',
        reasonShort: '常规使用未见明显风险',
        evidence: { sourceType: 'literature', sourceRef: 'LPI:Probiotics', confidence: 'low' },
      },
    ],
    overallLevel: 'green',
  },
];

/** /archive 上的人物名中文映射（mock 里只有 self / mom） */
export const PERSON_LABEL_ZH: Record<string, string> = {
  self: '我',
  mom: '妈妈',
  dad: '爸爸',
  kid: '孩子',
};
