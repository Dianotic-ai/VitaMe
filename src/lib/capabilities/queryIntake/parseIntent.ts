// file: src/lib/capabilities/queryIntake/parseIntent.ts — L0 自然语言 → IntentResult（LLM + Zod .strict() 校验）
//
// 对齐：
//   - docs/engineering/specs/query-intake.md §a / §Error Handling
//   - CLAUDE.md §10.0（L0 rules）/ §11.6（Zod 必校验）/ §11.13（L0 LLM 不许判风险）
//
// 流程：
//   1) 拼 prompt（rawQuery + history + 可选 imageOcrText）
//   2) llmClient.chat({ system, messages, responseFormat: 'json' })
//   3) JSON.parse → IntentResultSchema.parse（.strict() 自动 reject 多余字段）
//   4) 任何失败 → console.warn(audit code) + 返回 unclear + parseIntentFallback()
//
// 严格不透出 raw LLM 文本（§11.6 红线）。

import 'server-only';
import {
  IntentResultSchema,
  type IntentResult,
  type ParseIntentInput,
} from '@/lib/types/intent';
import type { LLMClient } from '@/lib/adapters/llm/types';
import { parseIntentFallback } from './fallbacks';

export interface ParseIntentDeps {
  /** 测试注入；生产由 API route 用 createLLMClient(envConfig) 创建后注入 */
  llmClient?: LLMClient;
}

// Prompt 运行时主版本就是这里。`prompts/parseIntent.zh.md` 仅供人审阅，不被运行时读取
// （原先用 readFileSync(__dirname, ...) 加载，next build 后 __dirname 指向产物目录、prompt 不在那里 → ENOENT → /api/intent 404）。
//
// TODO(D6 prompt tuning, see SESSION-STATE.md "未完成" L0 parseIntent prompt tuning)：
// 当前 prompt 在以下 4 类边界 case 上 LLM 判错（D5 晚 smokeIntent 验证）：
//   1. "X 和 Y 能一起吃吗" → 误判 contraindication_followup（应 product_safety_check）
//   2. "X 现在能吃吗" → 误判 unclear（应 product_safety_check + missingSlots=['medication_context']）
//   3. "我老失眠/疲劳" → 误判 unclear（应 symptom_goal_query + symptomMentions=['失眠']）
//   4. "维生素 AD 软胶囊" → 漏抽 ingredient（应 ingredientMentions=['维生素A','维生素D']）
// 修法：在 PROMPT_TEMPLATE 内加 4-6 条 few-shot example。本文件不动，prompt 字符串内追加。
const PROMPT_TEMPLATE = `你是 VitaMe 的查询解析器。你的任务是把用户的自然语言查询，解析成结构化字段，供后续判断引擎使用。

---
你必须遵守的约束：
1. 你只做识别，不做判断。绝不输出 "安全/不安全/红/黄/绿" 等任何风险字段（不要带 level / safe / dangerous / risk_level / risk 字段）。
2. mention 用用户原话或最自然的中文短语（"鱼油"，不是 "fish oil"；"华法林"，不是 "warfarin"）。slug 转换由下游做。
3. clarifyingQuestion 只在 missingSlots 非空且关键时给出；问句 ≤40 字，选项 2-4 个；不要列穷举（"其他" 由 UI 自动追加）。
4. 不认识的成分名直接放进 ingredientMentions，不要丢，不要猜近似品牌。
5. intent 取值必须从下列枚举中选一个：product_safety_check / photo_label_parse / symptom_goal_query / ingredient_translation / contraindication_followup / profile_update / unclear。
6. missingSlots 取值必须从下列枚举中选（可空）：product_or_ingredient / medication_context / special_group / symptom_specificity。
7. contraindication_followup 仅用于「我刚被告知 A 不能吃，那 B 呢」这种**追问**场景（history 必非空）。用户**首次**问 X 和 Y 能否合用，是 product_safety_check。
8. 用户描述身体感受/不适（失眠 / 疲劳 / 便秘 / 掉发 / 长痘 等）→ symptom_goal_query，symptomMentions 必非空。**不要**输出 unclear。
9. 复合制剂（维生素 AD / B 族 / ACE / 鱼油钙 等）必须拆成独立成分一一列在 ingredientMentions；产品名同时也保留在 productMentions。
10. 单独问「X 现在/能不能/可以吃吗」但没给上下文 → product_safety_check + missingSlots=["medication_context"]，**不是 unclear**。

---
示例（严格按 schema 输出 JSON，无 Markdown，无解释）：

例1（rawQuery="辅酶 Q10 和华法林能一起吃吗?"）：
{"intent":"product_safety_check","productMentions":[],"ingredientMentions":["辅酶Q10"],"medicationMentions":["华法林"],"conditionMentions":[],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

例2（rawQuery="辅酶 Q10 现在能吃吗?"）：
{"intent":"product_safety_check","productMentions":[],"ingredientMentions":["辅酶Q10"],"medicationMentions":[],"conditionMentions":[],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":["medication_context"],"clarifyingQuestion":null}

例3（rawQuery="我最近老失眠"）：
{"intent":"symptom_goal_query","productMentions":[],"ingredientMentions":[],"medicationMentions":[],"conditionMentions":[],"specialGroupMentions":[],"symptomMentions":["失眠"],"missingSlots":[],"clarifyingQuestion":null}

例4（rawQuery="感冒期间可以吃维生素 AD 软胶囊吗?"）：
{"intent":"product_safety_check","productMentions":["维生素AD软胶囊"],"ingredientMentions":["维生素A","维生素D"],"medicationMentions":[],"conditionMentions":["感冒"],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

例5（rawQuery="甲减在吃优甲乐,有人说不能和钙片一起吃?"，剂型词如「钙片/软糖/滴剂」必须同时拆出底层成分到 ingredientMentions）：
{"intent":"product_safety_check","productMentions":["钙片"],"ingredientMentions":["钙"],"medicationMentions":["优甲乐"],"conditionMentions":["甲减"],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

例6（rawQuery="葡萄糖酸锌、甘草锌、吡啶甲酸锌,哪个吸收好?"，多形式对比/「哪个好」「哪种吸收好」是 ingredient_translation，不是 symptom，也不是 unclear）：
{"intent":"ingredient_translation","productMentions":[],"ingredientMentions":["葡萄糖酸锌","甘草锌","吡啶甲酸锌"],"medicationMentions":[],"conditionMentions":[],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

例7（rawQuery="准备怀孕,叶酸什么时候开始吃?"，备孕/孕期/哺乳/婴幼儿是 specialGroupMentions，不要因为带「什么时候」就归 unclear）：
{"intent":"product_safety_check","productMentions":[],"ingredientMentions":["叶酸"],"medicationMentions":[],"conditionMentions":[],"specialGroupMentions":["备孕"],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

例8（rawQuery="鱼油 EPA 和 DHA 比例怎么看?买哪种?"，「比例怎么看/买哪种/选哪个」是产品形式咨询 → ingredient_translation，禁止误判 product_safety_check 触发药物 clarify）：
{"intent":"ingredient_translation","productMentions":[],"ingredientMentions":["鱼油","EPA","DHA"],"medicationMentions":[],"conditionMentions":[],"specialGroupMentions":[],"symptomMentions":[],"missingSlots":[],"clarifyingQuestion":null}

---
输入：{{rawQuery}}
（多轮上下文：{{history}}）

输出 JSON（严格符合 schema，不要 Markdown，不要解释，仅 JSON 对象）：
{
  "intent": "...",
  "productMentions": ["..."],
  "ingredientMentions": ["..."],
  "medicationMentions": ["..."],
  "conditionMentions": ["..."],
  "specialGroupMentions": ["..."],
  "symptomMentions": ["..."],
  "missingSlots": ["..."],
  "clarifyingQuestion": null
}
`;

const SYSTEM_PROMPT = [
  '你是 VitaMe 的查询解析器,你只做识别,不做判断。',
  '严禁输出 level / safe / dangerous / risk_level / risk 等任何安全判断字段。',
  '严格输出 JSON,不要 Markdown 围栏,不要解释。',
  '不认识的成分名直接放进 ingredientMentions,不要丢,不要猜近似品牌。',
].join('\n');

const PARSE_INTENT_TIMEOUT_MS = 30_000;
const PARSE_INTENT_MAX_TOKENS = 1024;

// LLM 输出若含这些字段名,即视为越权(§11.13 红线)。Zod .strict() 也会拦截,
// 此处显式判一次是为了用专属 audit 码 'intent_llm_overreach' 与一般 zod_fail 区分。
const FORBIDDEN_RISK_KEYS = [
  'level',
  'safe',
  'dangerous',
  'risk_level',
  'risk',
  'safety',
  'verdict',
];

type AuditCode = 'intent_llm_timeout' | 'intent_zod_fail' | 'intent_llm_overreach';

export async function parseIntent(
  input: ParseIntentInput,
  deps?: ParseIntentDeps,
): Promise<IntentResult> {
  const llm = deps?.llmClient;
  if (!llm) {
    auditFail('intent_llm_timeout', 'no llmClient injected');
    return fallbackResult();
  }

  const userMsg = buildUserMessage(input);

  const llmResult = await llm.chat({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }],
    responseFormat: 'json',
    maxTokens: PARSE_INTENT_MAX_TOKENS,
  });

  if ('error' in llmResult) {
    // network / rate_limit / auth / invalid_response 全归一到 timeout 审计码
    // (P0 不细分；§Error Handling 规定 timeout / 5xx → fallback 文案 1)
    auditFail('intent_llm_timeout', llmResult.error.kind);
    return fallbackResult();
  }

  const parsedJson = safeJsonParse(llmResult.text);
  if (parsedJson === undefined) {
    auditFail('intent_zod_fail', 'json_parse');
    return fallbackResult();
  }

  // 显式查违规字段(在 Zod 之前),给越权专属 audit 码
  if (hasForbiddenRiskKey(parsedJson)) {
    auditFail('intent_llm_overreach', 'risk_field_present');
    return fallbackResult();
  }

  const validated = IntentResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    auditFail('intent_zod_fail', 'schema_mismatch');
    return fallbackResult();
  }

  return validated.data;
}

function buildUserMessage(input: ParseIntentInput): string {
  const historyStr =
    input.history && input.history.length > 0
      ? input.history.map((h) => `[topic=${h.topic} userChoice=${h.userChoice}]`).join(' ')
      : '(无)';
  const baseQuery = input.imageOcrText
    ? `${input.rawQuery}\n[OCR 文本]: ${input.imageOcrText}`
    : input.rawQuery;
  return PROMPT_TEMPLATE.replace('{{rawQuery}}', baseQuery).replace('{{history}}', historyStr);
}

function safeJsonParse(raw: string): unknown {
  // 容错 ```json fences(M2.7 偶尔会带,与 safetyTranslation/responseSchema 同款处理)
  const stripped = stripFences(raw).trim();
  if (!stripped) return undefined;
  try {
    return JSON.parse(stripped) as unknown;
  } catch {
    return undefined;
  }
}

function stripFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return m?.[1] ?? s;
}

function hasForbiddenRiskKey(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return keys.some((k) => FORBIDDEN_RISK_KEYS.includes(k.toLowerCase()));
}

function fallbackResult(): IntentResult {
  return {
    intent: 'unclear',
    productMentions: [],
    ingredientMentions: [],
    medicationMentions: [],
    conditionMentions: [],
    specialGroupMentions: [],
    symptomMentions: [],
    missingSlots: [],
    clarifyingQuestion: parseIntentFallback(),
  };
}

function auditFail(code: AuditCode, detail: string): void {
  // P0 没接真实 audit infra,先 console.warn(CLAUDE.md §11.10 真审计 D9 后接)。
  // 严禁打印 LLM raw text,只打 code + 简短 detail。
  console.warn(`[parseIntent] ${code} ${detail}`);
}
