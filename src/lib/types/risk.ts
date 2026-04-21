// file: src/lib/types/risk.ts — L2 判断输出 + L3 翻译后 + 合规层附加字段契约（SafetyJudgment / SafetyTranslation / Compliance 共用）

/**
 * RiskLevel = 产品视觉脊梁（DESIGN.md §2.1 四色 token 一对一）。
 * red > yellow > gray > green（RiskLevelMerger 取最严）。
 */
export type RiskLevel = 'red' | 'yellow' | 'gray' | 'green';

/**
 * EvidenceSourceType = 证据的"层级"（高于具体 source）。
 * 给 UI 一个简单的徽章维度。
 * - hardcoded = 药剂师审核 / database = SUPP.AI 类 / literature = 文献
 * - limited   = 弱证据兜底（数据存在但不充分）
 * - none      = 无数据兜底（任何源都未命中，coverage_gap 走这条）
 */
export type EvidenceSourceType = 'hardcoded' | 'database' | 'literature' | 'limited' | 'none';
/** 'unknown' 用于 coverage_gap / 数据不足场景，不要与 'low'（低质证据）混淆 */
export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'unknown';

/**
 * RiskDimension = Risk 的分类维度（前端 RiskCard 顶部的分类标签）。
 * Kevin spec（kevin-risk-matrix.md §5）。映射规则见 safetyJudgment/riskDefaults.ts。
 */
export type RiskDimension =
  | 'drug_interaction'      // 补剂×药 / 补剂×补剂 相互作用
  | 'condition_contra'      // 病史/体质禁忌
  | 'population_caution'    // 特殊人群（孕期、APOE4 基因等）
  | 'dose_caution'          // 剂量 / 时序 / 长期使用
  | 'form_difference'       // 成分形式差异（甘氨酸镁 vs 氧化镁）
  | 'coverage_gap';         // 数据未覆盖（gray no_data 兜底）

/**
 * RiskCta = "下一步动作"标准化按钮（前端 RiskCard 底部）。
 * Kevin spec（kevin-api-contract.md §1.6）。默认映射见 safetyJudgment/riskDefaults.ts，
 * adapter 可针对特定规则覆盖（例如 form_difference 维度的 yellow 不强制 consult）。
 */
export type RiskCta =
  | 'stop_and_consult'             // 红：停用并就医
  | 'consult_if_needed'            // 黄：必要时与医生沟通
  | 'recheck_with_more_context'    // 灰：补充信息后重查
  | 'proceed_with_caution'         // 黄/灰可选：继续使用但谨慎
  | 'basic_ok';                    // 绿：可正常使用

/**
 * Evidence = 每条 Risk 带一份给用户看的"凭什么"摘要。
 * 由 compliance/evidenceAnnotator.ts 填充；缺源时 sourceType='limited'，UI 必须显示"有限证据"徽章。
 * 这里 sourceRef 是**简短字符串**（如 "VitaMe-rule-coQ10_warfarin" / "SUPP.AI:paper_xxx"），
 * 与 SourceRef 对象（L1 证据挂在 Ingredient.sourceRefs 上的富对象）是两个不同概念。
 */
export interface Evidence {
  sourceType: EvidenceSourceType;
  sourceRef: string;
  confidence: EvidenceConfidence;
}

/**
 * Risk = SafetyJudgment 的单条输出（结构化 JSON，只有事实、无自然语言解释）。
 * 严格红线（§10.2）：Risk 不含"请咨询医生"这类 L3 语言，那些在 SafetyTranslation 层才加。
 */
export interface Risk {
  level: RiskLevel;
  /** 风险分类维度（前端分类标签 + reason 模板路由） */
  dimension: RiskDimension;
  /** 标准化"下一步动作"，前端 RiskCard 按此渲染 CTA 按钮 */
  cta: RiskCta;
  /** 命中的成分 id，与 Ingredient.id 一致 */
  ingredient: string;
  /** 与之冲突的病史 id（hardcoded 规则场景） */
  condition?: string;
  /** 与之冲突的药物 id（SUPP.AI / 硬编码场景） */
  medication?: string;
  /** 机器可读原因码，与 L3 templateFallback 里的 reasonCode 一对一 */
  reasonCode: string;
  /** 短中文原因（如 "类维生素 K 效应"），会进入 BannedPhraseFilter */
  reasonShort: string;
  evidence: Evidence;
  /** 同 (ingredient, ...) 其他源的补强；硬编码 Risk 常带 SUPP.AI secondary */
  secondaryEvidence?: Evidence[];
  /** 多源对同一冲突给出不同级别时记录（RiskLevelMerger 采用最严 + 记冲突） */
  conflictingSources?: string[];
}

/**
 * TranslatedRisk = SafetyTranslation 层之后的 Risk，附加用户可读的解释 + 规避建议。
 * translation / avoidance 两个字段进入最终 RiskCard UI。
 */
export interface TranslatedRisk extends Risk {
  /** 面向用户的中文原因解释（L3 LLM 产物，经 GuardrailFilter + BannedPhraseFilter） */
  translation: string;
  /** 规避建议（例如 "建议避免同服；若已开始，请告知医生"） */
  avoidance: string;
  /** 当涉及 form 差异时，附 FormComparator 输出给前端渲染 */
  formComparison?: RiskFormComparison[];
  /** true = 该 Risk 的文字走了 TemplateFallback（LLM 解析失败或被过滤） */
  fallbackUsed: boolean;
}

export interface RiskFormComparison {
  form: string;                            // 'oxide' / 'glycinate'
  nameZh: string;                          // '氧化镁' / '甘氨酸镁'
  absorptionRate?: number;
  noteZh: string;
}

/**
 * JudgmentResult = /api/judgment 的响应 payload（尚未过 L3 翻译）。
 */
export interface JudgmentResult {
  sessionId: string;
  overallLevel: RiskLevel;
  risks: Risk[];
  /** 任一 adapter 超时/降级 → true；前端需标注"数据源降级" */
  partialData: boolean;
  /** partialData=true 时给出原因（'suppai_not_baked' / 'ddinter_timeout' 等），供前端细粒度提示 */
  partialReason?: string | null;
}

/**
 * TranslationResult = /api/translation 的响应 payload（已过合规 5 层）。
 * disclaimer 非空是合规红线（§11.1），前端再做最后兜底。
 */
export interface TranslationResult {
  sessionId: string;
  overallLevel: RiskLevel;
  translatedRisks: TranslatedRisk[];
  /** CriticalEscalation 触发时（pregnancy / red / 华法林等） */
  criticalWarning?: CriticalWarning;
  /** 合规固定文案（DisclaimerInjector 注入） */
  disclaimer: string;
}

export interface CriticalWarning {
  show: true;
  text: string;
}
