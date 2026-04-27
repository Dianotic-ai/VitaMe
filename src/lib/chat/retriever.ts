// file: src/lib/chat/retriever.ts — v0.3 KB Retriever（关键词 grep L1 8 源）
//
// 设计：
// - 0 LLM 调用（避免增加延迟和成本）；纯关键词 + slug 别名匹配
// - 从 L1 db 在模块加载时构建一次性 alias index（中文名/英文名 → slug）
// - 每条 query 跑：alias index lookup → ingredient/medication/condition slug → 取出相关 fact
// - 每源最多 10 条（CLAUDE.md §14 坑 #2 防 prompt 爆炸）
// - Critical 高危组合（severity=red 的 contraindications）单独标 isCritical
//
// CLAUDE.md §9.3 落地：用户提到 "鱼油 + 华法林" 等 → contraindications 必须命中并强制注入

import { CONTRAINDICATIONS } from '@/lib/db/contraindications';
import { CN_DRI_VALUES } from '@/lib/db/cn-dri-values';
import { LPI_VALUES } from '@/lib/db/lpi-values';
import { SUPPAI_INTERACTIONS } from '@/lib/db/suppai-interactions';
import { SYMPTOM_INGREDIENTS } from '@/lib/db/symptom-ingredients';
import type { Substance } from '@/lib/types/interaction';
import type { Fact, RetrievedFacts } from './types';

// ---------- 别名索引（模块加载时一次性构建） ----------

interface AliasEntry {
  slug: string;
  kind: 'ingredient' | 'medication' | 'condition' | 'specialGroup' | 'symptom';
}

/** key = 小写中/英别名，value = AliasEntry */
const ALIAS_INDEX: Map<string, AliasEntry> = (() => {
  const idx = new Map<string, AliasEntry>();

  function add(name: string | undefined, slug: string, kind: AliasEntry['kind']) {
    if (!name) return;
    const k = name.toLowerCase().trim();
    if (k && !idx.has(k)) idx.set(k, { slug, kind });
  }

  // ingredient slug 来自 cn-dri / lpi / symptom-ingredients
  for (const e of CN_DRI_VALUES) add(e.ingredientId, e.ingredientId, 'ingredient');
  for (const e of LPI_VALUES) add(e.ingredientId, e.ingredientId, 'ingredient');
  for (const e of SYMPTOM_INGREDIENTS) {
    for (const c of e.candidates) add(c.ingredientSlug, c.ingredientSlug, 'ingredient');
  }

  // 从 contraindications 抽 substanceA/B 上的 nameZh/nameEn/id
  function classifySubstance(sub: Substance): AliasEntry['kind'] {
    if (sub.kind === 'supplement') return 'ingredient';
    if (sub.kind === 'drug' || sub.kind === 'drugClass') return 'medication';
    if (sub.kind === 'condition') return 'condition';
    if (sub.kind === 'specialGroup') return 'specialGroup';
    return 'condition'; // gene/usageTiming/usageStrategy 暂归 condition
  }

  for (const c of CONTRAINDICATIONS) {
    for (const sub of [c.substanceA, c.substanceB]) {
      const kind = classifySubstance(sub);
      add(sub.id, sub.id, kind);
      add(sub.nameZh, sub.id, kind);
      add(sub.nameEn, sub.id, kind);
    }
  }

  // suppai 的 substanceB 多是 drug，加入 medication 别名
  for (const s of SUPPAI_INTERACTIONS) {
    add(s.substanceB.id, s.substanceB.id, 'medication');
    add(s.substanceB.nameEn, s.substanceB.id, 'medication');
  }

  // 症状别名（symptom-ingredients 里的 symptomZh + synonyms）
  for (const e of SYMPTOM_INGREDIENTS) {
    add(e.symptomSlug, e.symptomSlug, 'symptom');
    add(e.symptomZh, e.symptomSlug, 'symptom');
    for (const syn of e.synonyms) add(syn, e.symptomSlug, 'symptom');
  }

  // 中文常用别名补丁（覆盖 alias index 不到的高频词）
  const PATCH: Array<[string, string, AliasEntry['kind']]> = [
    ['鱼油', 'fish-oil', 'ingredient'],
    ['omega-3', 'fish-oil', 'ingredient'],
    ['omega3', 'fish-oil', 'ingredient'],
    ['epa', 'fish-oil', 'ingredient'],
    ['dha', 'fish-oil', 'ingredient'],
    ['辅酶q10', 'coenzyme-q10', 'ingredient'],
    ['辅酶 q10', 'coenzyme-q10', 'ingredient'],
    ['q10', 'coenzyme-q10', 'ingredient'],
    ['coq10', 'coenzyme-q10', 'ingredient'],
    ['维生素d', 'vitamin-d', 'ingredient'],
    ['维生素 d', 'vitamin-d', 'ingredient'],
    ['维d', 'vitamin-d', 'ingredient'],
    ['vitamin d', 'vitamin-d', 'ingredient'],
    ['维生素c', 'vitamin-c', 'ingredient'],
    ['维生素 c', 'vitamin-c', 'ingredient'],
    ['维c', 'vitamin-c', 'ingredient'],
    ['维生素b', 'vitamin-b', 'ingredient'],
    ['维生素 b', 'vitamin-b', 'ingredient'],
    ['b族', 'vitamin-b', 'ingredient'],
    ['b 族', 'vitamin-b', 'ingredient'],
    ['钙片', 'calcium', 'ingredient'],
    ['钙', 'calcium', 'ingredient'],
    ['镁', 'magnesium', 'ingredient'],
    ['锌', 'zinc', 'ingredient'],
    ['铁', 'iron', 'ingredient'],
    ['叶酸', 'folate', 'ingredient'],
    ['益生菌', 'probiotics', 'ingredient'],
    ['褪黑素', 'melatonin', 'ingredient'],
    ['华法林', 'warfarin', 'medication'],
    ['warfarin', 'warfarin', 'medication'],
    ['二甲双胍', 'metformin', 'medication'],
    ['优甲乐', 'levothyroxine', 'medication'],
    ['左甲状腺素', 'levothyroxine', 'medication'],
    ['他汀', 'statins', 'medication'],
    ['statin', 'statins', 'medication'],
    ['statins', 'statins', 'medication'],
    ['ssri', 'ssri-use', 'medication'],
    ['抗抑郁药', 'ssri-use', 'medication'],
    ['圣约翰草', 'st-johns-wort', 'ingredient'],
    ['孕妇', 'pregnancy', 'specialGroup'],
    ['怀孕', 'pregnancy', 'specialGroup'],
    ['孕期', 'pregnancy', 'specialGroup'],
    ['哺乳', 'breastfeeding', 'specialGroup'],
    ['哺乳期', 'breastfeeding', 'specialGroup'],
    ['婴幼儿', 'infant', 'specialGroup'],
    ['婴儿', 'infant', 'specialGroup'],
    ['老人', 'elderly', 'specialGroup'],
    ['老年人', 'elderly', 'specialGroup'],
    ['糖尿病', 'diabetes', 'condition'],
    ['高血压', 'hypertension', 'condition'],
    ['肾结石', 'kidney-stone', 'condition'],
    ['胃溃疡', 'gastric-ulcer', 'condition'],
    ['甲减', 'hypothyroidism', 'condition'],
    ['肝病', 'liver-disease', 'condition'],
    ['肾病', 'kidney-disease', 'condition'],
  ];
  for (const [name, slug, kind] of PATCH) add(name, slug, kind);

  return idx;
})();

// ---------- 关键词抽取 ----------

/** 在 query 中扫描 alias index 命中的 slug */
function extractMentions(query: string): {
  ingredients: Set<string>;
  medications: Set<string>;
  conditions: Set<string>;
  specialGroups: Set<string>;
  symptoms: Set<string>;
} {
  const lower = query.toLowerCase();
  const ingredients = new Set<string>();
  const medications = new Set<string>();
  const conditions = new Set<string>();
  const specialGroups = new Set<string>();
  const symptoms = new Set<string>();

  // 简单子串扫描（n×m 复杂度，alias 词表 ~500 条 × query ~50 字符 ≤ 25K ops，可接受）
  for (const [alias, entry] of ALIAS_INDEX.entries()) {
    if (lower.includes(alias)) {
      switch (entry.kind) {
        case 'ingredient': ingredients.add(entry.slug); break;
        case 'medication': medications.add(entry.slug); break;
        case 'condition': conditions.add(entry.slug); break;
        case 'specialGroup': specialGroups.add(entry.slug); break;
        case 'symptom': symptoms.add(entry.slug); break;
      }
    }
  }

  return { ingredients, medications, conditions, specialGroups, symptoms };
}

// ---------- Fact 构建器 ----------

// v0.4 D12: 统一「国家/地区 + 英文缩写」格式（partner 反馈纯英文用户看不懂）
const SOURCE_LABEL: Record<string, string> = {
  'nih-ods': '美国 NIH ODS',                  // National Institutes of Health, Office of Dietary Supplements
  'lpi': '美国 LPI',                          // Linus Pauling Institute, Oregon State University
  'cn-dri': '中国营养学会 DRIs',               // 中国居民膳食营养素参考摄入量
  'pubchem': '美国 NIH PubChem',              // NIH 化合物数据库
  'chebi': '欧洲 EBI ChEBI',                  // EMBL-EBI Chemical Entities of Biological Interest
  'suppai': '美国 AI2 SUPP.AI',               // Allen Institute for AI 补×药相互作用库
  'hardcoded-contraindication': 'VitaMe 内置禁忌',
  'dsld': '美国 NIH DSLD',                    // Dietary Supplement Label Database
  'tga': '澳大利亚 TGA',                       // Therapeutic Goods Administration
  'jp-kinosei': '日本机能性表示食品',           // 日本消费者厅 機能性表示食品制度
  'cn-bluehat': '中国蓝帽子保健食品',           // 国家市场监督管理总局保健食品认证
};

function ingredientLabel(slug: string): string {
  const cn = CN_DRI_VALUES.find((e) => e.ingredientId === slug);
  const lpi = LPI_VALUES.find((e) => e.ingredientId === slug);
  // try contraindications nameZh
  for (const c of CONTRAINDICATIONS) {
    if (c.substanceA.id === slug && c.substanceA.nameZh) return c.substanceA.nameZh;
    if (c.substanceB.id === slug && c.substanceB.nameZh) return c.substanceB.nameZh;
  }
  return slug;
}

// ---------- 主入口 ----------

const PER_SOURCE_CAP = 10;

export function retrieveFacts(
  query: string,
  profile?: {
    conditions?: { mention: string }[];
    medications?: { mention: string }[];
    /** Codex #4: 当前在吃的保健品作为隐式 ingredient mention 喂检索，做冲突检查 */
    currentSupplements?: { mention: string }[];
  },
): RetrievedFacts {
  // 1. 从 query + profile 抽 mention
  const queryMentions = extractMentions(query);

  // 2. 把 profile 里已知 condition/medication/supplement 也作为隐式 mention
  //    （让 retriever 自然检索"用户档案 × 当前 query"组合的禁忌）
  if (profile?.conditions) {
    for (const c of profile.conditions) {
      const m = extractMentions(c.mention);
      m.conditions.forEach((s) => queryMentions.conditions.add(s));
      m.specialGroups.forEach((s) => queryMentions.specialGroups.add(s));
    }
  }
  if (profile?.medications) {
    for (const m of profile.medications) {
      const mm = extractMentions(m.mention);
      mm.medications.forEach((s) => queryMentions.medications.add(s));
    }
  }
  if (profile?.currentSupplements) {
    for (const s of profile.currentSupplements) {
      const m = extractMentions(s.mention);
      m.ingredients.forEach((slug) => queryMentions.ingredients.add(slug));
    }
  }

  const facts: Fact[] = [];
  let criticalHits = 0;

  // 3. 每个 ingredient 取 cn-dri / lpi / 相关 contraindications / suppai
  let dosageCount = 0;
  let mechanismCount = 0;
  let interactionCount = 0;
  let contraCount = 0;

  for (const ingSlug of queryMentions.ingredients) {
    // cn-dri 剂量
    if (dosageCount < PER_SOURCE_CAP) {
      const dri = CN_DRI_VALUES.find((e) => e.ingredientId === ingSlug);
      if (dri) {
        const parts: string[] = [`${ingredientLabel(ingSlug)} 中国 RDA: ${dri.cn.rdi ?? '—'} ${dri.cn.unit}`];
        if (dri.cn.ul) parts.push(`UL 上限: ${dri.cn.ul} ${dri.cn.unit}`);
        if (dri.note) parts.push(`备注: ${dri.note}`);
        facts.push({
          id: `dri:${ingSlug}`,
          category: 'dosage',
          content: parts.join('；'),
          sourceRef: dri.sourceRef,
        });
        dosageCount++;
      }
    }

    // lpi 机制 / 缺乏症 / 过量风险
    if (mechanismCount < PER_SOURCE_CAP) {
      const lpi = LPI_VALUES.find((e) => e.ingredientId === ingSlug);
      if (lpi) {
        const parts: string[] = [`${ingredientLabel(ingSlug)}：${lpi.summaryZh.functionBrief}`];
        if (lpi.summaryZh.deficiencySymptoms.length) parts.push(`缺乏会出现：${lpi.summaryZh.deficiencySymptoms.join('、')}`);
        if (lpi.summaryZh.excessRisks.length) parts.push(`过量风险：${lpi.summaryZh.excessRisks.join('、')}`);
        facts.push({
          id: `lpi:${ingSlug}`,
          category: 'mechanism',
          content: parts.join('；'),
          sourceRef: lpi.sourceRef,
        });
        mechanismCount++;
      }
    }
  }

  // 4. 命中的 contraindications（双向匹配 ingredient × medication / ingredient × condition / × specialGroup）
  const allMentions = new Set<string>([
    ...queryMentions.ingredients,
    ...queryMentions.medications,
    ...queryMentions.conditions,
    ...queryMentions.specialGroups,
  ]);

  for (const c of CONTRAINDICATIONS) {
    if (contraCount >= PER_SOURCE_CAP) break;
    const aHit = allMentions.has(c.substanceA.id);
    const bHit = allMentions.has(c.substanceB.id);
    // 命中条件：双侧都中（最强信号）OR 单侧中且对侧是 medication（用户档案里会显式记录）
    const matches = aHit && bHit;
    if (!matches) continue;

    const isRed = c.severity === 'red';
    if (isRed) criticalHits++;

    const labelA = c.substanceA.nameZh ?? c.substanceA.id;
    const labelB = c.substanceB.nameZh ?? c.substanceB.id;
    const sevTag = c.severity === 'red' ? '🔴 高风险' : c.severity === 'yellow' ? '🟡 谨慎' : 'ℹ️';
    const dose = c.doseThreshold ? `（剂量门槛: ${c.doseThreshold}）` : '';

    facts.push({
      id: `contraindication:${c.id}`,
      category: 'contraindication',
      content: `${sevTag} ${labelA} × ${labelB}${dose}：${c.reason}`,
      sourceRef: c.sourceRef,
      isCritical: isRed,
    });
    contraCount++;
  }

  // 5. SUPP.AI 相互作用（只取 ingredient × medication 双侧命中）
  if (queryMentions.ingredients.size > 0 && queryMentions.medications.size > 0) {
    for (const s of SUPPAI_INTERACTIONS) {
      if (interactionCount >= PER_SOURCE_CAP) break;
      const aHit = queryMentions.ingredients.has(s.substanceA.id);
      const bHit = queryMentions.medications.has(s.substanceB.id);
      if (!(aHit && bHit)) continue;
      facts.push({
        id: `suppai:${s.id}`,
        category: 'interaction',
        content: `${s.substanceA.id} × ${s.substanceB.nameEn ?? s.substanceB.id}：${s.reason}`,
        sourceRef: s.sourceRef,
      });
      interactionCount++;
    }
  }

  // 6. 症状 → 候选成分（用户问"我失眠该补什么"这类）
  let symptomCount = 0;
  for (const symSlug of queryMentions.symptoms) {
    if (symptomCount >= PER_SOURCE_CAP) break;
    const sym = SYMPTOM_INGREDIENTS.find((e) => e.symptomSlug === symSlug);
    if (!sym) continue;
    const candList = sym.candidates.slice(0, 5).map((c) => `${c.ingredientSlug}（${c.evidenceNote.slice(0, 40)}）`).join('；');
    facts.push({
      id: `symptom:${symSlug}`,
      category: 'symptom',
      content: `${sym.symptomZh} 常关联候选成分：${candList}`,
      // 取第一个 candidate 的第一个 sourceRef（symptom-ingredients 的 sourceRefs 在 candidate 上）
      sourceRef: sym.candidates[0]?.sourceRefs[0] ?? {
        source: 'lpi' as const,
        id: symSlug,
        retrievedAt: '2026-04-22',
      },
    });
    symptomCount++;
  }

  return {
    facts,
    ingredientSlugs: Array.from(queryMentions.ingredients),
    medicationSlugs: Array.from(queryMentions.medications),
    conditionSlugs: Array.from(queryMentions.conditions),
    criticalHits,
  };
}

/** 给 prompt builder / 调试用：source slug → 人类可读名 */
export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source;
}
