// file: src/lib/adapters/hardcodedAdapter.ts — L2 判断层第 1 路：硬编码 50 条禁忌
//
// 依据：docs/superpowers/specs/2026-04-18-vitame-safety-judgment-design.md §Components / §Data Flow
// 角色：消费 src/lib/db/contraindications.ts 的 CONTRAINDICATION_BY_PAIR（O(1) 查表）
// 边界（§10.2）：
//   - 输出只含结构化 Risk[]，无自然语言解释、无 "请咨询医生" 等 L3 语言
//   - 无 LLM，无网络；纯确定性

import type { LookupRequest, LookupResponse, SafetyAdapter } from '@/lib/types/adapter';
import type { Risk } from '@/lib/types/risk';
import type { Contraindication, Substance } from '@/lib/types/interaction';
import { CONTRAINDICATION_BY_PAIR } from '@/lib/db/contraindications';

function contraindicationToRisk(rule: Contraindication): Risk {
  const risk: Risk = {
    level: rule.severity,
    ingredient: rule.substanceA.id,
    reasonCode: rule.reasonCode,
    reasonShort: rule.reason,
    evidence: {
      sourceType: 'hardcoded',
      sourceRef: rule.id,
      confidence: 'high',
    },
  };
  // 按 Substance.kind 拆到 Risk.medication / Risk.condition 两个槽
  if (isMedicationKind(rule.substanceB.kind)) {
    risk.medication = rule.substanceB.id;
  } else {
    risk.condition = rule.substanceB.id;
  }
  return risk;
}

function isMedicationKind(kind: Substance['kind']): boolean {
  return kind === 'drug' || kind === 'drugClass';
}

/**
 * 把 LookupRequest 各非 ingredient 维度的 slug 平铺成 B 侧列表。
 * 去重保障 Q4 那种重复传入不产生重复 Risk。
 */
function collectBSides(req: LookupRequest): string[] {
  const all = [
    ...(req.medications ?? []),
    ...(req.conditions ?? []),
    ...(req.specialGroups ?? []),
    ...(req.genes ?? []),
    ...(req.timings ?? []),
    ...(req.strategies ?? []),
  ];
  return [...new Set(all)];
}

export const hardcodedAdapter: SafetyAdapter = {
  name: 'hardcoded',
  async lookup(req: LookupRequest): Promise<LookupResponse> {
    const ingredients = [...new Set(req.ingredients)];
    const bSides = collectBSides(req);
    const risks: Risk[] = [];
    const seenPairs = new Set<string>();

    for (const ingId of ingredients) {
      for (const b of bSides) {
        const key = `${ingId}|${b}`;
        if (seenPairs.has(key)) continue;
        const rule = CONTRAINDICATION_BY_PAIR.get(key);
        if (rule) {
          risks.push(contraindicationToRisk(rule));
          seenPairs.add(key);
        }
      }
    }

    return {
      risks,
      partialData: false,
      source: 'hardcoded',
    };
  },
};
