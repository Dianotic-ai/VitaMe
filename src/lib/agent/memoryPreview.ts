// file: src/lib/agent/memoryPreview.ts — session-local Memory seed 预览（不写长期存储）
// 红线（Agent-北极星.md §5 Memory + §8 Privacy）：
//   - privacyMode 固定 'local'（不上云）
//   - facts 去重 + cap 5 条（防止 LLM 注入一长串）
//   - personLabel 白名单：self/mom/dad/child/other

export type PersonLabel = 'self' | 'mom' | 'dad' | 'child' | 'other';

export interface MemoryPreview {
  personLabel: PersonLabel;
  facts: string[];
  privacyMode: 'local';
}

const MAX_FACTS = 5;
const VALID_LABELS: PersonLabel[] = ['self', 'mom', 'dad', 'child', 'other'];

export function buildMemoryPreview(input: { personLabel: string; factsFromSession: string[] }): MemoryPreview {
  const personLabel: PersonLabel = (VALID_LABELS as string[]).includes(input.personLabel)
    ? (input.personLabel as PersonLabel)
    : 'other';
  // 去重（保留出现顺序）+ cap 5
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const f of input.factsFromSession) {
    const trimmed = f.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      facts.push(trimmed);
      if (facts.length >= MAX_FACTS) break;
    }
  }
  return { personLabel, facts, privacyMode: 'local' };
}
