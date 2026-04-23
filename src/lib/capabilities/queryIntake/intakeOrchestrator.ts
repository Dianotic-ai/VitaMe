// file: src/lib/capabilities/queryIntake/intakeOrchestrator.ts — L0 顶层 4 handler 路由
//
// 流程（design spec §Architecture / §Data Flow）：
//   1) parseIntent(LLM)            → IntentResult
//   2) 按 intent 类型分发：
//      - product_safety_check       → groundMentions → slotResolver → clarify or passThrough
//      - symptom_goal_query         → lookupSymptomCandidates（CLAUDE.md §11.14 P0 例外）
//      - unclear                    → clarify_needed (用 parseIntent 已带的 clarifyingQuestion 或模板)
//      - 其余 4 种 intent           → unsupported（P0 范围外，UI 给"暂不支持"）
//
// 红线：本文件不调 L2，也不直接 LLM 调用（LLM 只在 parseIntent 内部，且已 Zod .strict() 锁死）。
// IntakeOutcome 是 discriminated union，UI 按 kind 切分支渲染。

import 'server-only';
import type { ParseIntentInput, IntentType, ClarifyTopic, ClarifyingQuestion, UngroundedMention, IntentResult, GroundedMentions } from '@/lib/types/intent';
import type { LookupRequest } from '@/lib/types/adapter';
import type { LLMClient } from '@/lib/adapters/llm/types';
import type { SymptomIngredientEntry } from '@/lib/db/symptom-ingredients';
import { parseIntent } from './parseIntent';
import { groundMentions } from './groundMentions';
import { slotResolver } from './slotResolver';
import { clarify } from './clarify';
import { lookupSymptomCandidates } from './symptomCandidates';
import { parseIntentFallback } from './fallbacks';

export type IntakeOutcome =
  | {
      kind: 'pass_through';
      sessionId: string;
      intent: IntentType;
      lookupRequest: LookupRequest;
      ungrounded: UngroundedMention[];
      debug: { intent: IntentResult; grounded: GroundedMentions };
    }
  | {
      kind: 'clarify_needed';
      sessionId: string;
      intent: IntentType;
      topic: ClarifyTopic;
      question: ClarifyingQuestion;
    }
  | {
      kind: 'symptom_candidates';
      sessionId: string;
      intent: 'symptom_goal_query';
      matched: SymptomIngredientEntry[];
      unmatched: string[];
    }
  | {
      kind: 'unsupported';
      sessionId: string;
      intent: IntentType;
      reason: string;
    };

export interface IntakeOrchestratorDeps {
  /** 测试注入；生产由 /api/intent 路由用 createLLMClient(envConfig) 注入。 */
  llmClient?: LLMClient;
}

export async function intakeOrchestrator(
  sessionId: string,
  input: ParseIntentInput,
  deps?: IntakeOrchestratorDeps,
): Promise<IntakeOutcome> {
  const intent = await parseIntent(input, { llmClient: deps?.llmClient });

  switch (intent.intent) {
    case 'product_safety_check':
      return handleProductSafetyCheck(sessionId, intent);

    case 'symptom_goal_query':
      return handleSymptomGoalQuery(sessionId, intent);

    case 'unclear':
      return handleUnclear(sessionId, intent);

    case 'ingredient_translation':
    case 'photo_label_parse':
    case 'contraindication_followup':
    case 'profile_update':
      return {
        kind: 'unsupported',
        sessionId,
        intent: intent.intent,
        reason: `P0 暂不支持 intent='${intent.intent}'，请改用"查某个补剂能不能吃"或"某症状该补什么"。`,
      };

    default: {
      // 防御：若新增 intent type 未在此处分支，TS 会编译失败。
      const exhaustive: never = intent.intent;
      throw new Error(`Unhandled intent: ${String(exhaustive)}`);
    }
  }
}

function handleProductSafetyCheck(sessionId: string, intent: IntentResult): IntakeOutcome {
  const grounded = groundMentions(intent);
  const decision = slotResolver(intent, grounded);

  if (decision.shouldClarify && decision.clarifyTopic) {
    return {
      kind: 'clarify_needed',
      sessionId,
      intent: intent.intent,
      topic: decision.clarifyTopic,
      question: clarify(decision.clarifyTopic, decision.clarifyChoices),
    };
  }

  if (!decision.passThrough) {
    // slotResolver 必须给 passThrough 或 clarify，理论不会到这。
    return {
      kind: 'unsupported',
      sessionId,
      intent: intent.intent,
      reason: 'slotResolver returned neither clarify nor passThrough (defensive fallback)',
    };
  }

  return {
    kind: 'pass_through',
    sessionId,
    intent: intent.intent,
    lookupRequest: decision.passThrough,
    ungrounded: grounded.ungroundedMentions,
    debug: { intent, grounded },
  };
}

function handleSymptomGoalQuery(sessionId: string, intent: IntentResult): IntakeOutcome {
  // symptomMentions 完全空 → 让用户先告诉我们是什么类的不适
  if (intent.symptomMentions.length === 0) {
    return {
      kind: 'clarify_needed',
      sessionId,
      intent: intent.intent,
      topic: 'symptom_specificity',
      question: clarify('symptom_specificity'),
    };
  }

  const result = lookupSymptomCandidates(intent.symptomMentions);

  // 全部 unmatched → 也走 clarify（让用户从 4 大类里选）
  if (result.matched.length === 0) {
    return {
      kind: 'clarify_needed',
      sessionId,
      intent: intent.intent,
      topic: 'symptom_specificity',
      question: clarify('symptom_specificity'),
    };
  }

  return {
    kind: 'symptom_candidates',
    sessionId,
    intent: 'symptom_goal_query',
    matched: result.matched,
    unmatched: result.unmatched,
  };
}

function handleUnclear(sessionId: string, intent: IntentResult): IntakeOutcome {
  // parseIntent fallback 路径会预填 clarifyingQuestion；若 LLM 给的是 unclear 但未填，用模板兜底。
  const question = intent.clarifyingQuestion ?? parseIntentFallback();
  return {
    kind: 'clarify_needed',
    sessionId,
    intent: intent.intent,
    topic: 'product_disambiguation',
    question,
  };
}
