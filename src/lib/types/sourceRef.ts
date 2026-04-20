// file: src/lib/types/sourceRef.ts — 数据证据来源契约（§11.4 / §12.2 合规红线，每条 L1 + 每条 Risk 必挂）

/**
 * 12 种外部数据源 + 1 种内部硬编码规则。
 * 命名与 CLAUDE.md §12.2 对齐（小写-连字符）。
 * 当某条证据来自多个源（如 NIH + LPI 合并），使用多个 SourceRef 而非拼接字符串。
 */
export type SourceOrigin =
  | 'nih-ods'                      // NIH Office of Dietary Supplements fact sheets
  | 'lpi'                          // Linus Pauling Institute micronutrient pages
  | 'cn-dri'                       // 中国营养学会 Dietary Reference Intakes
  | 'pubchem'                      // PubChem (chemical form CID mapping)
  | 'chebi'                        // ChEBI (chemical entity ontology)
  | 'suppai'                       // Allen AI SUPP.AI supplement × drug interactions
  | 'ddinter'                      // DDInter drug × drug interactions
  | 'hardcoded-contraindication'   // VitaMe 内部 50 条硬编码禁忌（药剂师审核）
  | 'dsld'                         // Dietary Supplement Label Database (用作成分名字典)
  | 'tga'                          // Australia Therapeutic Goods Administration ARTG
  | 'jp-kinosei'                   // 日本機能性表示食品
  | 'cn-bluehat';                  // 中国蓝帽子保健食品注册

/**
 * SourceRef = 一条证据指向一个外部源的稳定指针。
 * 合规中间件 EvidenceAnnotator 会把这类对象转成面向用户的 Evidence.sourceRef 字符串摘要。
 */
export interface SourceRef {
  source: SourceOrigin;
  /** 在该源内的稳定 ID（NIH factsheet slug / DSLD ingredient id / SUPP.AI pair id / rule-<uid>） */
  id: string;
  /** 可公开引用的 URL（可选；硬编码规则无 URL） */
  url?: string;
  /** bake 脚本运行时的 ISO 日期，用于后续对账 */
  retrievedAt: string;
}
