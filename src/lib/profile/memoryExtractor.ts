// file: src/lib/profile/memoryExtractor.ts — 从对话轮次抽出新健康事实
//
// 调用：/api/extract Node route 收到 {userMsg, assistantMsg} → 调本函数 → 返回 ProfileDelta → 客户端 merge
//
// LLM call 用同一 minimax 国际版 endpoint（CLAUDE.md §4），但 model 用同一个（M2.7），prompt 极短，预期 ~3-5s
//
// 这是"轻量"调用，不在 chat 流路径上（不阻塞用户感知延迟）

import { generateText } from 'ai';
import { createExtractorProvider, getChatModelId } from '@/lib/llm/edgeProvider';
import type { ProfileDelta, SpecialGroup, AgeRange, Sex } from './types';

const EXTRACTOR_PROMPT = `你是健康档案抽取器。从下方一轮对话中识别**用户主动陈述的、长期有效的**健康信息，输出严格 JSON。

# 严格规则（违反任何一条 → 不抽）

## conditions（疾病 / 病史）— 只接受确诊慢病或医生告知的诊断
✅ 抽：糖尿病、高血压、甲减、胃溃疡、肾结石、冠心病、慢性肾病、肝硬化、抑郁症、老年痴呆等**慢性疾病**
❌ 不抽：
  - 任何**症状**：眼睛不适/酸胀/疲劳、视物模糊、视力下降、失眠、头痛、头晕、疲劳、便秘、口干、长痘、掉发、心慌、出汗 等
  - 任何"瞬时态"：今天难受、最近不舒服、偶尔头晕、最近老失眠
  - 助手**推测**的："可能是 X"、"疑似 X"、"建议排查 X"——这些不是用户的事实
  - 助手**问**的："你有 X 吗" 而用户没明确回答的
  - 用户**否认**的：用户说"没有 X"

## medications（长期用药）— 只接受处方药 / OTC 西药 / 中成药
✅ 抽：华法林、二甲双胍、优甲乐（左甲状腺素）、阿司匹林、降压药、SSRI、他汀、奥美拉唑、抗生素 等
❌ 不抽：
  - **保健品**（用户口语可能叫保健品/补品/营养品/补剂/膳食补充剂） → 这些走 **newSupplements**，**不进 medications**
  - 用户偶尔吃的非处方："偶尔吃点感冒药"
  - 助手**推荐**的成分（用户还没买/没吃的）

## newSupplements（用户**已经在吃**的保健品）— 区别于 medications
✅ 抽：
  - 维生素 A/B/C/D/E/AD、钙片、鱼油、Q10、益生菌、叶酸、褪黑素、蛋白粉、葡萄糖胺、辅酶 Q10
  - 任何带"软胶囊/软糖/片剂"的保健品名
  - 用户原话："我在吃 X" / "我现在还在补 Y" / "我每天吃 Z"
✅ 如果用户提到品牌（汤臣倍健 / Swisse / Nordic Naturals 等），抽到 brand 字段
✅ 如果用户提到剂量（"1000mg/天"），抽到 dosage 字段
❌ 不抽：
  - 助手**推荐**的成分（用户还没买/没吃的）
  - 用户**问要不要吃**的（"我想买 Q10" 还没买，不抽）
  - 用户问"该不该吃 X"（疑问态，不抽）

## allergies — 只接受用户明确说"我对 X 过敏"
✅ 抽：海鲜、青霉素、花粉、芒果
❌ 不抽：用户说"我吃 X 不舒服"（这是个体反应不是过敏）

## specialGroups — 严格枚举
✅ 接受值：pregnancy / breastfeeding / infant / elderly
❌ 其他名称（如 "孕妇" / "哺乳" 等中文）→ 用上面英文枚举对应

## ageRange / sex
- ageRange 枚举：<18 / 18-30 / 30-45 / 45-60 / 60+。用户说"29 岁" → "18-30"。模糊的"年轻人"不抽。
- sex 枚举：M / F。

## 关键 bias：保守优先
- 拿不准 → **不抽**
- 同一概念多种说法（如"眼睛不舒服"+"眼睛酸"+"眼睛疲劳"）→ **一条都不抽**（这些都是症状）
- 空数组**永远**比错抽好

# 输出 JSON schema（不要 markdown 包裹，直接 JSON）
{
  "newConditions": [{"mention":"糖尿病"}] | [],
  "newMedications": [{"mention":"二甲双胍","isLongTerm":true}] | [],
  "newSupplements": [{"mention":"维生素 AD","brand":"汤臣倍健","dosage":"1 颗/天"}] | [],
  "newAllergies": [{"mention":"甲壳类"}] | [],
  "newSpecialGroups": ["pregnancy"] | [],
  "ageRange": "30-45" | null,
  "sex": "M" | null,
  "conversationSummary": {"summary":"用户问 Q10 + 他汀，确认不冲突", "topics":["Q10","他汀"]}
}

# Few-shot 示例

## 示例 A — 用户描述症状（应全空）
USER: 我最近老熬夜，眼睛干涩、酸胀，看屏幕时间长
ASSISTANT: 这类症状常关联叶黄素 + Omega-3...
→ 输出: {"newConditions":[],"newMedications":[],"newAllergies":[],"newSpecialGroups":[],"ageRange":null,"sex":null,"conversationSummary":{"summary":"用户因长时间用屏幕咨询眼部支持成分","topics":["眼疲劳","叶黄素"]}}
（眼睛干涩/酸胀是症状不抽；叶黄素是助手推荐不抽）

## 示例 B — 用户陈述慢病和处方药（应抽）
USER: 我有糖尿病，长期吃二甲双胍。想补点 Q10。
ASSISTANT: 好的，Q10 跟二甲双胍一般无冲突...
→ 输出: {"newConditions":[{"mention":"糖尿病"}],"newMedications":[{"mention":"二甲双胍","isLongTerm":true}],"newAllergies":[],"newSpecialGroups":[],"ageRange":null,"sex":null,"conversationSummary":{"summary":"糖尿病患者咨询 Q10 补充，已确认与二甲双胍无禁忌","topics":["糖尿病","二甲双胍","Q10"]}}

## 示例 C — 用户已经在吃保健品（进 newSupplements）
USER: 我现在还在吃维生素 AD 软胶囊，汤臣倍健的，每天 1 颗
ASSISTANT: 好，那叶黄素和 AD 间隔 2 小时...
→ 输出: {"newConditions":[],"newMedications":[],"newSupplements":[{"mention":"维生素 AD 软胶囊","brand":"汤臣倍健","dosage":"1 颗/天"}],"newAllergies":[],"newSpecialGroups":[],"ageRange":null,"sex":null,"conversationSummary":{"summary":"用户已在补充维生素 AD，需注意与叶黄素的吸收间隔","topics":["维生素AD","叶黄素"]}}
（维生素 AD 是保健品 → newSupplements，不进 medications）

## 示例 D — 助手推测疾病（不抽）
USER: 我最近视力下降了，看东西模糊
ASSISTANT: 视力下降可能是近视加深、散光变化或老花，建议先做完整眼科检查
→ 输出: {"newConditions":[],"newMedications":[],"newAllergies":[],"newSpecialGroups":[],"ageRange":null,"sex":null,"conversationSummary":{"summary":"用户报告视力下降，建议先做眼科检查","topics":["视力","眼科"]}}
（视力下降是症状不抽；助手提到的"近视/散光/老花"都是推测，不是用户陈述）

如果完全没新信息：所有数组为 []，ageRange/sex 为 null，conversationSummary 仍要给一句话。`;

interface ExtractorRawOutput {
  newConditions?: { mention: string; slug?: string }[];
  newMedications?: { mention: string; slug?: string; isLongTerm?: boolean }[];
  newSupplements?: { mention: string; slug?: string; brand?: string; dosage?: string }[];
  newAllergies?: { mention: string }[];
  newSpecialGroups?: string[];
  ageRange?: string | null;
  sex?: string | null;
  conversationSummary?: { summary: string; topics: string[] };
}

const VALID_SPECIAL_GROUPS: SpecialGroup[] = ['pregnancy', 'breastfeeding', 'infant', 'elderly'];
const VALID_AGE_RANGES: AgeRange[] = ['<18', '18-30', '30-45', '45-60', '60+'];

function sanitize(raw: ExtractorRawOutput): ProfileDelta {
  const delta: ProfileDelta = {};
  if (Array.isArray(raw.newConditions) && raw.newConditions.length > 0) {
    delta.newConditions = raw.newConditions.filter((c) => c?.mention).map((c) => ({ mention: String(c.mention).trim(), slug: c.slug }));
  }
  if (Array.isArray(raw.newMedications) && raw.newMedications.length > 0) {
    delta.newMedications = raw.newMedications.filter((m) => m?.mention).map((m) => ({
      mention: String(m.mention).trim(),
      slug: m.slug,
      isLongTerm: typeof m.isLongTerm === 'boolean' ? m.isLongTerm : undefined,
    }));
  }
  if (Array.isArray(raw.newSupplements) && raw.newSupplements.length > 0) {
    delta.newSupplements = raw.newSupplements.filter((s) => s?.mention).map((s) => ({
      mention: String(s.mention).trim(),
      slug: s.slug,
      brand: s.brand ? String(s.brand).trim() : undefined,
      dosage: s.dosage ? String(s.dosage).trim() : undefined,
    }));
  }
  if (Array.isArray(raw.newAllergies) && raw.newAllergies.length > 0) {
    delta.newAllergies = raw.newAllergies.filter((a) => a?.mention).map((a) => ({ mention: String(a.mention).trim() }));
  }
  if (Array.isArray(raw.newSpecialGroups) && raw.newSpecialGroups.length > 0) {
    delta.newSpecialGroups = raw.newSpecialGroups.filter((g): g is SpecialGroup => VALID_SPECIAL_GROUPS.includes(g as SpecialGroup));
  }
  if (raw.ageRange && VALID_AGE_RANGES.includes(raw.ageRange as AgeRange)) {
    delta.ageRange = raw.ageRange as AgeRange;
  }
  if (raw.sex === 'M' || raw.sex === 'F') {
    delta.sex = raw.sex as Sex;
  }
  if (raw.conversationSummary?.summary) {
    delta.conversationSummary = {
      summary: String(raw.conversationSummary.summary).trim(),
      topics: Array.isArray(raw.conversationSummary.topics) ? raw.conversationSummary.topics.map(String) : [],
    };
  }
  return delta;
}

function tryParseJson(text: string): ExtractorRawOutput | null {
  // LLM 偶尔会包 ```json ... ``` —— 剥掉
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence && fence[1]) s = fence[1].trim();
  try {
    return JSON.parse(s) as ExtractorRawOutput;
  } catch {
    return null;
  }
}

export async function extractMemoryFromTurn(opts: {
  userMsg: string;
  assistantMsg: string;
}): Promise<ProfileDelta> {
  const provider = createExtractorProvider();

  const prompt = `${EXTRACTOR_PROMPT}

--- 本轮对话 ---
USER: ${opts.userMsg}
ASSISTANT: ${opts.assistantMsg}
--- 输出 JSON ---`;

  try {
    const { text } = await generateText({
      model: provider(getChatModelId()),
      prompt,
      temperature: 0,
    });

    const parsed = tryParseJson(text);
    if (!parsed) {
      console.warn('[memory-extractor] JSON parse failed, raw:', text.slice(0, 200));
      return {};
    }
    return sanitize(parsed);
  } catch (e) {
    console.error('[memory-extractor] LLM call failed:', e);
    return {};
  }
}
