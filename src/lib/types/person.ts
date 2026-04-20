// file: src/lib/types/person.ts — 档案中的"人"实体契约（self / 父母 / 其他家人）

/**
 * PersonRole = 为 FamilyScopeResolver 提供角色分类。
 * 'self' 默认匿名自己；'parent' 由"我妈/爸/老人"等关键词触发；'other' 用户自定义。
 */
export type PersonRole = 'self' | 'parent' | 'other';

/**
 * Person = 档案内一个独立的人。
 * P0 存 LocalStorage（不上传服务器），id 为前端生成的 uuid（self 也不特殊，默认就是一个 id='self' 的 Person）。
 */
export interface Person {
  id: string;
  role: PersonRole;
  /** 用户可见的 label（"自己" / "妈妈" / "爸爸" / "外婆"），可编辑 */
  label: string;
  /** 慢性/持续状况（"肝炎"、"脂肪肝"、"胃溃疡"），字符串允许自由文本，SafetyJudgment 做标准化 */
  conditions: string[];
  /** 当前在服药物 */
  medications: string[];
  allergies: string[];
  /** "pregnancy" / "lactation" / "pediatric" / "elderly" ... */
  specialGroups: string[];
  /** 精准医学扩展：基因型（如 'apoe4'），P0 仅采集不推断 */
  genes?: string[];
  createdAt: string;                       // ISO
  updatedAt: string;
}

/**
 * PersonRef = API 入参中的人物引用。
 * 简单处理为 personId（字符串）；'self' 或 uuid 皆可；留空时按默认 'self' 处理。
 * 未来如需携带"建议角色"（FamilyScopeResolver 推断结果）再扩为 interface。
 */
export type PersonRef = string;
