---
title: "Migration: Superpowers, DESIGN, and TDD"
description: "2026-04-19 关于 Superpowers 精简接入、DESIGN.md 和 Tier 3 TDD 的决策纪要。"
doc_type: "decision-memo"
status: "reference"
created: "2026-04-19"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["decision", "migration", "superpowers", "design", "tdd"]
---

# MIGRATION 2026-04-19

> Decision memo for future-me. Written the day the decisions were made, so that in two weeks nobody has to reconstruct the reasoning from scratch.
> Audience: Sunny (PM), engineer partner, and any future Claude instance resuming this project.
> Not a spec. Not a plan. Just **why**.

---

## 0. TL;DR

On 2026-04-19 (D2 / 12 of the WAIC sprint), three decisions were made in one session:

1. **Adopt Superpowers** (`obra/superpowers`) as the CC workflow backbone, but only 4 of its 11 skills.
2. **Adopt DESIGN.md** as a separate design-system file, based on the Notion template from `awesome-design-md`.
3. **TDD tier 3** — selective TDD on risky code + end-to-end seed-question test as the safety net.

`CLAUDE.md` v1 → v2 was rewritten to reflect all three. `DESIGN.md` was created fresh.

---

## 1. What changed

| File | Change | Size |
|---|---|---|
| `CLAUDE.md` | v1 → v2. Added §8 Superpowers integration, §13 TDD policy. Removed v1's "Phase vs Task mode" (superseded by Superpowers `writing-plans`). Removed v1's "Role split" (not CC's concern). Updated §0, §7, §9.5 to reference `DESIGN.md`. | ~580 lines |
| `DESIGN.md` | **NEW**. Based on the Notion template from `VoltAgent/awesome-design-md`. Three VitaMe-specific additions: (a) four-risk-color safety palette, (b) `DisclaimerBlock` / `RiskBadge` / `EvidenceSource` component specs, (c) WeChat WebView + iOS Safari quirks section. | ~390 lines |
| `docs/decisions/VitaMe-Migration-Superpowers-DESIGN-TDD-2026-04-19.md` | **NEW**. This file. | ~180 lines |

---

## 2. Decision log

### 2.1 Superpowers — lean install (4 of 11 skills)

**Decision**: install via `/plugin install superpowers@claude-plugins-official`, enable only:

- `writing-plans`
- `subagent-driven-development`
- `test-driven-development`
- `requesting-code-review`

**Rejected skills**:

| Skill | Why rejected |
|---|---|
| `brainstorming` | P0 spec is already locked in 5 design docs; re-brainstorming wastes sprint time. |
| `using-git-worktrees` | 2-person team; worktrees are overhead for us. |
| `executing-plans` (batched) | Prefer `subagent-driven-development` for isolation. |
| `dispatching-parallel-agents` | 2-person team; no parallel subagent load. |
| `finishing-a-development-branch` | Don't want auto-merge decisions during a 12-day sprint. |

**Why this matters**: Superpowers is strongly opinionated. If we let it run full-force, it would insist on `brainstorming` before every code task. At D2 with an already-locked spec, that loop burns 30+ minutes per task. Lean install gives us the leverage (2–5 min plans, subagent isolation, TDD where it matters, review gate) without the overhead.

**Precedence rule** (`CLAUDE.md` §8.3): `CLAUDE.md` and `DESIGN.md` **always win** when they conflict with Superpowers defaults. The explicit example in §8.3 is TDD: Superpowers says "test everything", we say "test only the risky stuff" (§13).

---

### 2.2 DESIGN.md — Notion-based, VitaMe-specialized

**Decision**: create `vitame-p0/DESIGN.md` using the Notion template from `awesome-design-md` as base, extended with three VitaMe-specific sections.

**Base choice rationale** (considered 3 options):

| Option | Why not chosen |
|---|---|
| `awesome-design-md/claude/` (Anthropic style) | Warm terracotta + editorial is close to our mood, but too tech-audience. Our users are worried parents buying supplements for their parents, not devs reading docs. |
| Write from scratch, VitaMe-specific | Would take 1–2 days. In a 12-day sprint, that's 10–17% of total budget for work that doesn't ship features. |
| **Notion style (chosen)** | Warm minimalism + serif headings + soft surfaces is exactly the "careful pharmacist" mood we want. Gets us 80% of the way in 1 hour. |

**VitaMe-specific additions** (the 20% we had to add):

1. **Four risk colors** (`risk-red #C8472D`, `risk-amber #D4933A`, `risk-gray #8A8278`, `risk-green #5B8469`). Warm rather than neon; see `DESIGN.md` §2.2 for the "don't say PANIC, say 'pay attention'" rationale.
2. **Dedicated Disclaimer palette** (§2.5) so the disclaimer block is unmistakable and cannot blend with normal surfaces.
3. **WeChat WebView + iOS Safari quirks** (§8.4–8.5). Notion's DESIGN.md is desktop-centric; 95% of our traffic is WeChat WebView, so this section is mandatory.

---

### 2.3 TDD — Tier 3 (selective + seed E2E safety net)

**Decision**: don't run full Superpowers TDD. Instead:

- **Test-first strict**: compliance middleware, L2 judgment, LLM/OCR adapters, core type business logic.
- **Skip TDD**: React components, bake scripts, page-level wiring, Tailwind.
- **Safety net**: `npm run test:seed` (20 questions) MUST pass before every PR merge — enforced by git pre-push hook + CI check.

**Considered and rejected**:

| Tier | Why not chosen |
|---|---|
| Tier 1: full TDD everywhere | +30–50% time overhead. Blows the 12-day sprint. Kent Beck himself doesn't actually do this. |
| Tier 2: selective TDD only (no seed E2E net) | UI or bake bugs would slip past unit tests; we'd only find them during demo recording. |
| **Tier 3 (chosen)** | +10–15% overhead. Covers the risky code strictly. The seed test catches whatever falls through. |

**Why the seed test works as a safety net**: we were going to maintain 20 seed questions for demo acceptance anyway (`docs/demo-acceptance-checklist.md`). Making it a merge gate costs nothing extra — we just elevate it from "run before demo" to "run before every merge". And because the 20 questions are real end-user scenarios, they catch bugs no unit test would.

**Promotion rule** (`CLAUDE.md` §13.4): if a §13.2 "skip TDD" area keeps breaking the seed test, we promote it to §13.1 strict TDD and record the promotion in the change log. This is the feedback loop that keeps the TDD policy honest.

---

## 3. What was NOT decided today (still open)

- **AGENTS.md** — Superpowers docs mention an `AGENTS.md` for agent-build instructions. We don't have one. Reason: its scope overlaps heavily with `CLAUDE.md`. Decision deferred; we'll revisit if Superpowers auto-expects it.
- **Pharmacist reviewer** — still an open gap (tracked in `CLAUDE.md` §16 risk matrix). Sunny is pursuing via LinkedIn / 小红书 / friend network.
- **Component library** — haven't decided between shadcn/ui, Radix primitives, or hand-rolled. Blocked on first UI task (should resolve on D3 or D4).

---

## 4. Next review trigger

Review this memo and the related files if **any** of these happen:

1. A seed-question test fails for a reason that should have been caught by TDD but wasn't → reconsider `CLAUDE.md` §13.1 / §13.2 split.
2. Superpowers `brainstorming` auto-triggers and wastes CC time → explicitly disable it in plugin config.
3. A DESIGN.md rule gets broken in code review more than twice → the rule is either wrong or not visible enough; clarify it.
4. Scope gate failure (D5 main chain, D6 translation, D9 deploy) → revisit `CLAUDE.md` §15.2 scope tiers.
5. Any red line in `CLAUDE.md` §11 is tested by a real edge case → document the case and the handling.

If none of the above triggers, do a scheduled review on **D12 (2026-04-29)**, the last evening before the WAIC deadline, purely to check "are we consistent with what we decided on D2?"

---

## 5. Who was in the room

Just Sunny and Claude. No engineer partner review yet (partner was on infra / T-0.1~0.17 today). Partner should read this memo and push back if any of the three decisions conflicts with their hands-on-code reality — especially the TDD tier 3 choice, since they'll be the one writing the tests.

---

**End of memo.**
