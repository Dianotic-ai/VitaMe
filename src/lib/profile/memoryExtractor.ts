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

const EXTRACTOR_PROMPT = `你是健康信息抽取器。从下方一轮对话中识别**用户主动提及的**新健康信息（疾病、用药、过敏、特殊人群、年龄段、性别），输出严格 JSON。

规则：
- **只抽用户原话提到的事实**。助手单方面问"你有没有 X" 而用户没确认，不算。
- **不抽推荐的成分** — 我们要的是用户**自身**情况，不是助手推荐的补剂。
- 同一信息已在对话历史 → 不要重复抽（你只看到本轮，所以保守抽）。
- specialGroups 枚举：pregnancy / breastfeeding / infant / elderly。其他不要塞进去。
- ageRange 枚举：<18 / 18-30 / 30-45 / 45-60 / 60+。
- sex 枚举：M / F。

输出 JSON schema（不要 markdown 包裹，直接 JSON）：
{
  "newConditions": [{"mention":"糖尿病"}, {"mention":"肾结石"}] | [],
  "newMedications": [{"mention":"二甲双胍","isLongTerm":true}] | [],
  "newAllergies": [{"mention":"甲壳类"}] | [],
  "newSpecialGroups": ["pregnancy"] | [],
  "ageRange": "30-45" | null,
  "sex": "M" | null,
  "conversationSummary": {"summary":"用户问 Q10 + 他汀，确认不冲突", "topics":["Q10","他汀"]}
}

如果完全没新信息：所有数组为 []，ageRange/sex 为 null，conversationSummary 仍要给（一句话）。`;

interface ExtractorRawOutput {
  newConditions?: { mention: string; slug?: string }[];
  newMedications?: { mention: string; slug?: string; isLongTerm?: boolean }[];
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
