// file: src/lib/capabilities/safetyTranslation/templates.ts — LLM 降级兜底文案
//
// 触发条件：L3 LLM 输出 Zod 校验失败（CLAUDE.md §11.6）→ 调用本模块的 renderFallback()
// 不包含 LLM 调用，纯字符串拼接。所有用户可见字符串必须过 bannedWordsFilter。

import type { Risk } from '@/lib/types/risk';

export interface FallbackRender {
  headline: string;      // 一行结论，≤ 30 字
  body: string;          // 主解释段，≤ 150 字
  actionHint: string;    // 用户下一步建议，≤ 50 字；禁用命令式"必须/应当"
}

/**
 * 当 LLM 翻译层失效时的兜底渲染函数
 * 核心原则：平实、去学术、有画面感、绝对不包含禁用词
 */
export function renderFallback(risk: Risk): FallbackRender {
  const { level, reasonCode } = risk;

  // 1. Red 严重风险分支
  if (level === 'red') {
    switch (reasonCode) {
      case 'vitamin_k_like_effect':
        return {
          headline: '这组搭配建议避开',
          body: '辅酶 Q10 的成分特点可能影响身体对特定药物的反应。为了维持指标平稳，建议尽量避开这种组合，以免干扰正常的反馈。',
          actionHint: '建议先向医生咨询更适合您的方案。',
        };
      case 'bleeding_risk_anticoagulant':
        return {
          headline: '这组搭配要避开',
          body: '目前的证据显示，这种搭配可能在身体内部产生一定的协同作用，增加了一些原本可控的变数。为了维持目前的指标平稳，建议尽量避开这种组合。',
          actionHint: '建议先咨询医生，探讨更适合您的方案。',
        };
      case 'serotonergic_synergy_high_dose':
        return {
          headline: '建议避开这种搭配',
          body: '这组组合在高剂量下可能对身体反馈产生叠加，产生一些不确定的波动。为了确保各项状态的平滑过度，建议目前阶段不要将它们放在一起使用。',
          actionHint: '为了稳妥，建议在调整方案前先听听医生意见。',
        };
      case 'fat_soluble_accumulation_high_risk':
      case 'retinol_pregnancy_teratogenicity':
        return {
          headline: '目前阶段建议避开',
          body: '这类成分具有在体内长期停留的特性，在高剂量或特殊生理阶段下，可能会带来超出预期的健康变数。建议暂时不要尝试这样的补充。',
          actionHint: '为了安全起见，建议先咨询医生的专业建议。',
        };
      default:
        // 通用 Red 兜底
        return {
          headline: '这次建议先避开',
          body: '目前的资料显示，这组成分搭配在一起可能存在较高的变数。本着谨慎原则，建议暂时不要尝试这样的组合。',
          actionHint: '为了稳妥起见，建议先听听医生的专业建议。',
        };
    }
  }

  // 2. Yellow 注意分支
  if (level === 'yellow') {
    switch (reasonCode) {
      case 'bp_lowering_additive':
      case 'bp_lowering_additive_polypharmacy':
        return {
          headline: '建议留意身体指标的波动',
          body: '这类成分可能带有温和的调节作用。如果已经在用相关类别的产品，两者叠加可能让数值波动超出预期。建议初期多观察身体感受。',
          actionHint: '建议近期增加监测频率，并咨询专业人士。',
        };
      case 'antagonize_warfarin':
        return {
          headline: '留意搭配后的反馈波动',
          body: '这种补充可能会抵消掉部分正在使用的调节产品的作用。如果两者同时出现，可能会让原本稳定的状态出现一些细微的起伏，建议在初期多加留意。',
          actionHint: '建议近期多观察身体反馈，并向医生咨询。',
        };
      case 'reduced_absorption_levothyroxine':
      case 'reduced_absorption_fat_soluble_context':
      case 'mineral_competition_absorption':
      case 'coffee_reduces_iron_absorption':
      case 'coffee_reduces_calcium_absorption':
      case 'tea_polyphenol_reduces_iron':
        return {
          headline: '建议错开服用时间',
          body: '某些成分可能会在胃肠中互相“拉扯”，从而降低了主要成分的吸收。如果不得不一起使用，建议让它们在时间上保持足够的间隔（比如 4 小时以上）。',
          actionHint: '建议错开服用窗口，以保证吸收的稳定性。',
        };
      case 'glucose_lowering_additive':
      case 'glucose_lowering_additive_polypharmacy':
        return {
          headline: '留意反馈数值的起伏',
          body: '这种搭配可能会让身体对能量调节的反馈变得更加敏感，甚至出现一些意料之外的波动。在开始这种组合时，建议保持对相关指标的细心监测。',
          actionHint: '建议近期多留意身体反馈，并咨询专业人士。',
        };
      case 'stone_risk_hypercalciuria':
      case 'stone_risk_total_calcium_load':
      case 'oxalate_stone_risk':
        return {
          headline: '留意剂量与体质的契合度',
          body: '在当前的体质背景下，高剂量的这类成分可能会增加身体代谢的负担。虽然单次影响不大，但建议在长期使用时多留意身体的微小变化。',
          actionHint: '建议在医生指导下，找到更适合您的剂量。',
        };
      case 'pregnancy_requires_medical_confirmation':
      case 'iodine_pregnancy_requires_confirmation':
      case 'pregnancy_self_escalation_caution':
        return {
          headline: '建议咨询医生后再考虑',
          body: '在特殊的生理阶段，身体的需求和代谢都与平时不同。虽然这些成分通常是有益的，但在没有专业确认前，建议先不要自行开始补充。',
          actionHint: '为了稳妥，建议在产检时先听听医生的建议。',
        };
      case 'fat_soluble_accumulation_risk':
      case 'iron_long_term_requires_reassessment':
      case 'zinc_long_term_requires_reassessment':
      case 'selenium_excess_reassessment':
        return {
          headline: '建议定期观察反馈',
          body: '某些成分具有在体内逐渐积累的特点。如果长期保持高剂量使用，可能会让身体的反馈超出预期。建议在使用一段时间后进行复评。',
          actionHint: '建议定期咨询医生，根据指标调整使用频率。',
        };
      case 'timing_goal_mismatch':
        return {
          headline: '建议优化服用时机',
          body: '目前的服用时间点可能无法让成分发挥出最佳的配合效果。为了更好地对齐您的预期目标，建议调整一下每天的使用时段。',
          actionHint: '可以尝试调整服用时间，或咨询我们的建议。',
        };
      case 'stack_complexity_first_one_only':
        return {
          headline: '建议先从单一品种开始',
          body: '当多种新成分同时起步时，身体可能需要较长的时间来适应这种复杂度。为了更清晰地观察身体反馈，建议先从最核心的一项开始。',
          actionHint: '建议给身体 2–4 周的观察期，再考虑叠加。',
        };
      default:
        // 通用 Yellow 兜底
        return {
          headline: '可以用，但留意几点',
          body: '这项搭配通常是可以尝试的，但在特定情况下可能产生一些细微的叠加影响。建议在服用过程中保持细心观察。',
          actionHint: '建议留意身体的反馈，如有不适请咨询医生。',
        };
    }
  }

  // 3. Gray 证据不足分支
  if (level === 'gray') {
    if (reasonCode === 'no_data' || reasonCode === 'insufficient_evidence') {
      return {
        headline: '目前研究资料还不够充分',
        body: '针对这项成分在当前背景下的表现，目前还缺乏足够的证据来给出明确建议。为了安全，我们暂时将其标注为待观察状态。',
        actionHint: '建议咨询医生，或者等资料更完整后再考虑。',
      };
    }
    // 通用 Gray 兜底
    return {
      headline: '这一项没找到足够资料',
      body: '目前在我们的数据库中，还没有搜集到该成分与您当前情况相关的明确结论。这并不代表有风险，只是证据还不够多。',
      actionHint: '建议先问问医生，或者保持谨慎观察。',
    };
  }

  // 4. Green 无风险分支 (Default)
  return {
    headline: '这项看起来没问题',
    body: '目前的分析没有发现明显的冲突。您可以按照常规建议使用，同时也要留意身体最真实的感受。',
    actionHint: '可以继续关注我们的后续更新。',
  };
}
