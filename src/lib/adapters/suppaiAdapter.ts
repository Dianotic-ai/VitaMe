import type { SuppaiInteraction } from '@/lib/db/suppai-interactions';
import { SUPPAI_BY_PAIR } from '@/lib/db/suppai-interactions';
import { ctaForLevel, dimensionForSubstanceKind } from '@/lib/capabilities/safetyJudgment/riskDefaults';
import type { LookupRequest, LookupResponse, SafetyAdapter } from '@/lib/types/adapter';
import type { Risk } from '@/lib/types/risk';

function uniqueIds(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function confidenceForEvidenceCount(evidenceCount: number): 'high' | 'medium' {
  return evidenceCount >= 10 ? 'high' : 'medium';
}

function suppaiToRisk(interaction: SuppaiInteraction): Risk {
  return {
    level: interaction.severity,
    dimension: dimensionForSubstanceKind(interaction.substanceB.kind),
    cta: ctaForLevel(interaction.severity),
    ingredient: interaction.substanceA.id,
    medication: interaction.substanceB.id,
    reasonCode: interaction.reasonCode,
    reasonShort: interaction.reason,
    evidence: {
      sourceType: 'database',
      sourceRef: interaction.sourceRef.id,
      confidence: confidenceForEvidenceCount(interaction.evidenceCount),
    },
  };
}

export const suppaiAdapter: SafetyAdapter = {
  name: 'suppai',
  async lookup(req: LookupRequest): Promise<LookupResponse> {
    const ingredients = uniqueIds(req.ingredients);
    const medications = uniqueIds(req.medications);
    const risks: Risk[] = [];

    // SUPP.AI is baked as supplement x drug, so only ingredient x medication pairs are checked.
    for (const ingredientId of ingredients) {
      for (const medicationId of medications) {
        const interaction = SUPPAI_BY_PAIR.get(`${ingredientId}|${medicationId}`);
        if (interaction) {
          risks.push(suppaiToRisk(interaction));
        }
      }
    }

    return {
      risks,
      partialData: false,
      source: 'suppai',
    };
  },
};
