# CLAUDE.md

> This file provides operational guidance to Claude Code when working in the `vitame-p0/` repository.
> It is **a set of action rules, not a product introduction** — every section tells you what to do when writing code.
> **Version**: v2.5 · Last updated: 2026-04-21 (D4 / 12, 晚). Change log → `docs/CLAUDE.md-changelog.md`.

---

## 0. How to read this file

- If you are Claude Code starting a new task, read §1 → §7 → §8 → §9, then the specific design doc referenced in §7, in that order.
- **If your task renders anything a user will see (page, component, copy, color)** → also read `DESIGN.md` in this same directory.
- If your task touches LLM calls, OCR, compliance filters, or any user-visible output → you must also read §10, §11, and §13 before writing code.
- If you find any conflict between this file and another doc in `docs/`, **this file wins**. Flag the conflict in your response and keep going.
- When in doubt, stop and ask the user (see §9.6).

### 0.1 按需读文档清单（CC 启动时**不读**，下列触发条件来时才读）

| 文档 | 何时读 |
|---|---|
| `docs/SESSION-STATE.md` | 每次新会话开头都读（"我现在在哪")，是唯一跨会话进度锚点 |
| `docs/known-blockers.md` | fetch 失败 / SUPP.AI 抓空 / SSL 错 / VPN 节点切换无效 → 先来这里查 |
| `docs/glossary.md` | 遇到不认识的术语（DSLD / SUPP.AI / 蓝帽子 / SourceRef / ...） |
| `docs/superpowers-workflow.md` | 接到非 trivial 任务、要拆 plan 时 |
| `docs/compression-rules.md` | 会话即将被自动压缩 / 压缩后第一时间恢复 |
| `docs/CLAUDE.md-changelog.md` | "为什么会变成这样"考古时 |

---

## 1. Project context & current phase

### 1.1 One-line positioning

**VitaMe is a supplement-safety translation Agent.** Before a user buys or takes a supplement, it tells them whether they can take it, why, and what to avoid — based on their history, medications, and ingredient form.

It is **not**: a disease diagnosis tool, a symptom tracker, a supplement e-commerce store, or a long-term wellness companion.

### 1.2 Current milestone

- **Target**: WAIC 2026 "Super Individual Hackathon" (超级个体创业黑客松), submission deadline **2026-04-30**.
- **Sprint**: 12-day P0, 2026-04-18 → 2026-04-29. Today is **D2** (2026-04-19).
- **Team**: 2 people — PM (Sunny) + 1 engineer partner.
- **Deliverable**: a working demo at `https://vitame.live` openable in WeChat WebView, 90-second demo video, 20 seed questions passing 100%.

### 1.3 What this means for you (CC)

- Every code change must serve the core UX: **"a user completes one safety check in ≤ 30 seconds and understands why"**. If a change does not serve this, push back.
- We are not building a platform. Do not add abstractions, plugin systems, or config layers "for future flexibility" unless explicitly required by a current task.
- Scope creep is the #1 risk, not code quality. Ship working > ship elegant.

---

## 2. Core narrative & product boundary

### 2.1 What the product does (in scope for P0)

1. Accept a product name / ingredient name / drug name as input.
2. Collect 2–4 key context questions (history, current medications, risk tags).
3. Output a **red / yellow / gray / green** safety verdict per ingredient.
4. Explain **why** in plain language (ingredient form, mechanism, interaction reason).
5. Show evidence source and strength per claim.
6. Suggest "what to avoid" or "a safer direction" — never a prescriptive plan.
7. Save the result to a personal or family archive for next-time recheck.

### 2.2 What the product does NOT do in P0

- No disease diagnosis.
- No full symptom intake.
- No long-term checkin / daily companion.
- No lifestyle plans.
- No CPS / affiliate / e-commerce linkouts.
- No Chinese patent medicine (中成药) full coverage.
- No lab-report OCR (only supplement bottle OCR).
- No multi-member family collaboration features.

### 2.3 When a user request is ambiguous

Default to **refuse**. Add a TODO comment pointing to this section. Do not silently expand scope to "cover the edge case". Scope creep in a 12-day sprint is fatal.

---

## 3. Product architecture — 3 layers × 8 core objects

### 3.1 Three layers (strict)

| Layer | Role | Lives in | Reads from | Writes to |
|---|---|---|---|---|
| **L1 — Knowledge dictionary** | Static, pre-baked data | `src/lib/db/*.ts` | nothing at runtime | nothing |
| **L2 — Judgment engine** | Rule-based risk evaluation | `src/lib/capabilities/safetyJudgment/` | L1 + user profile | structured `Risk` JSON |
| **L3 — Translation & adaptation** | Human-language explanation + multi-region product adaptation | `src/lib/capabilities/safetyTranslation/` | L2 output only | final user-facing strings |

### 3.2 Eight core objects

Defined in `src/lib/types/`. Do not reinvent these or put equivalent shapes elsewhere.

| Object | Purpose |
|---|---|
| `Query` | One lookup instance |
| `Product` | A branded item (Doctor's Best Magnesium, Swisse Fish Oil…) |
| `Ingredient` | A standardized ingredient (magnesium glycinate, EPA…) |
| `Person` | The subject of the query (self / mom / dad…) |
| `Risk` | A structured verdict with level + reason ref + evidence refs |
| `Reason` | A plain-language explanation with one-to-one mapping to a rule |
| `Evidence` | A `SourceRef` pointing to origin data (DSLD ID, SUPP.AI pair ID, NIH fact sheet URL…) |
| `Archive` | A saved snapshot of Query + Person + Risk[], for recheck |

### 3.3 Hard rule: no cross-layer bypass

See §10 for detail. In short: L1 has no imports from `adapters/`; L2 returns JSON only; L3 consumes L2 and never writes back; LLM calls only exist in `safetyTranslation/` and `queryIntake/`.

---

## 4. Tech stack

- **Frontend**: Next.js 14 App Router + TypeScript (strict) + Tailwind CSS. SSR mode.
- **Backend**: Next.js API routes (Node runtime, not Edge — we need filesystem access for audit logs).
- **LLM providers** (factory pattern, switched by `LLM_PROVIDER` env):
  - `minimax` — default, supports chat + vision (OCR)
  - `deepseek` — backup, chat only
  - `openclaw` — on-box fallback (reuses 770 MB RSS), chat only
- **OCR**: Minimax multimodal. No other provider for P0.
- **Data**: 8 sources baked offline into `src/lib/db/*.ts`. Total bundle target **< 5 MB**. Runtime does **not** hit any external data source.
- **Deploy**: self-hosted Silicon Valley cloud (2 vCPU / 4 GB RAM / 30 Mbps / Ubuntu), domain `vitame.live`, Nginx reverse proxy + pm2 + Let's Encrypt + Cloudflare free CDN in front.
- **Access path**: user opens `https://vitame.live` inside WeChat WebView.
- **Audit log**: local JSONL file, rotated daily. No external logging service in P0.

---

## 5. Repository structure

核心路径（细节自己 `ls` / `glob`）：

```
src/lib/db/              L1 — baked data, static imports only, 每个文件首行 'server-only'
src/lib/adapters/        LLM / OCR / input-normalizer factories
src/lib/capabilities/    5 capabilities — queryIntake / safetyJudgment / safetyTranslation / archiveRecheck / compliance
src/lib/types/           global TS types — Risk / Reason / SourceRef / Person / ...
src/app/api/             Next.js API routes — query-intake / safety-judgment / safety-translation / archive-recheck
src/components/          UI components (follow DESIGN.md)
scripts/bake*.ts         offline baking, 9 个 source —— NIH / LPI / CnDri / PubChem / DSLD / SUPP.AI / TGA / JP / Bluehat (见 §6.2)
tests/unit/              adapter + capability unit tests (§13.1 强 TDD)
tests/seed-questions.spec.ts  20 seed E2E (§14, merge gate)
docs/                    design docs (5 份 spec + plan + acceptance + 按需读 5 份, 见 §0)
```

---

## 6. Environments & commands

### 6.1 Required env vars (`.env.local.example` is the source of truth)

```
LLM_PROVIDER=minimax          # minimax | deepseek | openclaw
MINIMAX_API_KEY=
DEEPSEEK_API_KEY=
OPENCLAW_ENDPOINT=http://localhost:8080
NEXT_PUBLIC_APP_ENV=dev       # dev | staging | prod
AUDIT_LOG_DIR=./var/audit
```

### 6.2 Commands

```bash
# dev / build
npm run dev                      # localhost:3000
npm run build && npm run start

# tests — §13 决定哪些代码需要测；test:seed 100% 是 merge gate (§14)
npm run test:unit
npm run test:seed
npm run test:compliance

# baking — 全部 re-entrant，可重复跑
npm run bake:{nih,lpi,cndri,pubchem,dsld,suppai,tga,jp,bluehat}
npm run bake:all

# deploy — 本地 build 后 rsync；千万别在 SV box 上 npm install（2GB RAM 会 OOM）
npm run deploy:rsync
```

### 6.3 What to check after each bake

Every `bake*` script must `console.log('size:', sizeInKB, 'entries:', count)` at the end. If total bundle exceeds 5 MB or any single TS file exceeds 1.5 MB → stop and flag to user.

---

## 7. Document index — read the right doc for the right task

All design docs live in `docs/`. Pick the narrowest one before reading the broadest.

| If your task is… | Read first | Also read |
|---|---|---|
| **First-time project bootstrap** | §8 (Superpowers) + `p0-plan.md` | `数据接入与实现方案.md` §1 |
| **Any UI rendering** (page, component, color, copy) | `../DESIGN.md` | §9 of this file |
| Setting up the repo, package.json, tsconfig | `2026-04-18-vitame-p0-plan.md` | `数据接入与实现方案.md` §1 |
| Writing any `bake*.ts` script | `数据接入与实现方案.md` §2 | `数据源盘点.md` |
| Filling L1 `ingredients.ts` entries | `数据接入与实现方案.md` §2.1 | `compliance-design.md` §SourceRef |
| Writing L2 judgment rules | `safety-judgment-design.md` | `compliance-design.md` §critical-path |
| Writing L3 translation prompts | `safety-translation-design.md` | `compliance-design.md` §banned-phrases |
| Building the intake question flow | `query-intake-design.md` | `User-Journey.md` J1 |
| Building archive / recheck | `archive-recheck-design.md` | `Retention-Loop-Growth-Flywheel.md` |
| Adding any compliance filter | `compliance-design.md` | §10 of this file |
| Writing or updating seed tests | `demo-acceptance-checklist.md` | `Demo种子问题清单-20条.md` |
| OCR integration | `数据接入与实现方案.md` §2.5 | `safety-judgment-design.md` |
| Deploying to Silicon Valley cloud | `p0-plan.md` §deploy | `数据接入与实现方案.md` §5 |

**If the task is not in the table above, stop and ask the user which design doc applies.** Do not guess.

---

## 8. Superpowers integration

精简装 [obra/superpowers](https://github.com/obra/superpowers)（`/plugin install superpowers@claude-plugins-official`），**只启用 4 个 skill**：

| Skill | 用途 |
|---|---|
| `writing-plans` | 把工作拆成 2–5 分钟人审 task |
| `subagent-driven-development` | 每 task 一个新 subagent + 两轮 review |
| `test-driven-development` | RED-GREEN-REFACTOR，仅对 §13.1 列的代码 |
| `requesting-code-review` | merge 前对照 plan review |

其余 7 个 skill（`brainstorming` / `using-git-worktrees` / `executing-plans` / `dispatching-parallel-agents` / `finishing-a-development-branch` 等）一律**关闭**。

### 8.1 优先级

`CLAUDE.md` + `DESIGN.md` 永远覆盖 Superpowers 默认行为：§13 > `test-driven-development`，§11 红线 > 任何 plan，§14 seed test > `requesting-code-review` 通过判断。完整工作流见 `docs/superpowers-workflow.md`。

---

## 9. Claude Code collaboration rules (VitaMe-specific, beyond Superpowers defaults)

The following are rules Superpowers does **not** cover. They are VitaMe-specific and must be applied in addition to §8.

### 9.1 Context pack for every session

When the user kicks off a CC session, they should (and will) give you this bundle. If any item is missing, ask for it **before** writing code:

1. This file (`CLAUDE.md`).
2. `DESIGN.md` (if the task touches UI).
3. `docs/2026-04-18-vitame-p0-plan.md` (master task list).
4. `docs/2026-04-18-vitame-数据接入与实现方案.md` (data & engineering plan).
5. The relevant design doc(s) from §7.
6. `docs/2026-04-18-vitame-demo-acceptance-checklist.md` (acceptance criteria).
7. The specific task IDs for this session (e.g. "run T-0.22 and T-0.23").

### 9.2 Task granularity

- Prefer tasks that take 2–5 minutes of human review at the end. This aligns with Superpowers `writing-plans`.
- If a task will produce more than ~150 lines of new code, split it.
- Never do "entire Phase 0 in one shot" — this is pit #8 in §9.3.

### 9.3 Eight known pits — avoid on sight

| # | Pit | Prevention |
|---|---|---|
| 1 | Baking all 630K DSLD products into TS | DSLD is an **ingredient dictionary** (top ~500 ingredients), not a product DB. See 数据接入方案 §2.4.4. |
| 2 | Forgetting `sourceRefs` on L1 entries | Every L1 type must have `sourceRefs: SourceRef[]` non-empty. Unit test enforces. |
| 3 | LLM output without JSON-schema validation | Always wrap in Zod. On failure → `TemplateFallback`, never raw LLM text. |
| 4 | SUPP.AI pair 质量不足 / 数量膨胀 | **不是限制行数，是限制噪声 + 防 bundle leak**：(a) `evidenceCount >= 3` 过滤长尾弱证据；(b) 单 TS 文件 < 1.5 MB（防 tsc 慢 + 防误被 client component 吃下）；(c) `src/lib/db/*.ts` 首行 `import 'server-only';` 防泄漏到 client bundle。原 v2.1 的「top 50 × top 100 硬白名单」v2.2 起作废 — 证据阈值对齐医学意义，白名单在 ingredient 扩容时反而束缚。 |
| 5 | Bake 总产物 > 5 MB | 5 MB 对齐 SV 2C4G 服务器 SSR + pm2 + openclaw 770MB RSS 的 RAM 预算；每个 `bake*` 必须 `console.log('size:', ...)`；超限 → 立即砍 🟡/🟢 档。 |
| 6 | OCR low-confidence silently accepted | Fixed threshold **0.7**: if `OcrExtractionResult.confidence < 0.7` or `unreadableParts.length > 0`, the capability layer MUST route to hand-verify UI and MUST NOT call SafetyJudgment. Enforced in `src/lib/capabilities/queryIntake/ocrGate.ts` unit test. |
| 7 | Compliance middleware wrong order | Fixed order: **Evidence → Banned → Critical → (DemoBanner ∥ Disclaimer) → Audit**. DemoBanner & Disclaimer are parallel injectors (both write to response, neither depends on the other). Test enforces. |
| 8 | Doing a whole Phase in one CC turn | Cut into 2–5 min bite-sized tasks (Superpowers `writing-plans` default). |

### 9.4 Pre-output checklist (every session, before you return control)

Before ending your turn, verify and report explicitly:

- [ ] Every new file has a header comment: `// file: <path> — <one-line purpose>`
- [ ] Every new `src/lib/db/*.ts` export has `sourceRefs: SourceRef[]` and it is non-empty
- [ ] Every new `src/lib/capabilities/**/*.ts` that is required by §13 has a matching test, written first
- [ ] Every new `Risk` object has both `dimension: RiskDimension` and `cta: RiskCta`（6 种 dimension / 5 种 cta，定义见 `src/lib/types/risk.ts`；默认映射走 `src/lib/capabilities/safetyJudgment/riskDefaults.ts`，不要在 adapter 内各自硬写）
- [ ] `npm run build` succeeds (if you had a sandbox to run it in)
- [ ] `npm run bake:all` is still re-entrant (no side effects on rerun)
- [ ] `.env.local.example` is updated if you introduced new env vars
- [ ] No new LLM call was added outside `safetyTranslation/` or `queryIntake/`
- [ ] No `any` or `@ts-ignore` introduced
- [ ] If any §11 red line was touched → flagged explicitly in your response
- [ ] If any UI was produced, it passes the `DESIGN.md` §9.3 visual checklist

If any box is unchecked, **say so in your output** and explain why.

### 9.5 UI-specific rules

When your task renders anything user-visible:

- Read `DESIGN.md` first. Do **not** pick colors, fonts, or spacing from your own taste.
- Risk-level colors MUST come from the 4 risk tokens in `DESIGN.md` §2.1. Never emit pure `red`, `yellow`, `green`, or `gray`.
- Every AI-generated output page MUST render `<DisclaimerBlock>` visibly. See `DESIGN.md` §4.2 + this file §11.1.

### 9.6 When to stop and ask the user

Stop immediately — do not guess — if any of these occur:

1. A design doc contradicts this file or another design doc.
2. You need to add a new env var or dependency.
3. A task requires LLM behavior outside the two allowed call sites (§10).
4. You need to touch `src/lib/capabilities/compliance/` (every change here is manually reviewed).
5. A hardcoded rule needs to be added or modified (see §11).
6. Seed-question test count would change (currently 20; any change is a scope decision).
7. You are about to skip a pre-output checklist item.
8. A DESIGN.md visual rule would need to be broken (e.g. a new color added).

**Ask by stating the situation plainly and proposing 2–3 concrete options.** Do not ask open-ended questions.

### 9.7 上下文压缩

何时禁止压缩、压缩后如何恢复 → 见 `docs/compression-rules.md`。仅在「会话即将被自动压缩」或「压缩后第一时间恢复」时读。

---

## 10. Layer discipline — forbidden cross-layer patterns

These are architectural hard rules. Violations produce bugs that are very hard to trace in a 12-day sprint.

### 10.1 L1 rules

- ✅ Export pure TS constants. Every entry has `sourceRefs`.
- 🚫 No `import` from `adapters/`, no network, no filesystem at module load, no LLM.
- 🚫 No side effects. Re-running `bake:all` must produce byte-identical files (given identical source data).

### 10.2 L2 rules

- ✅ Input: `(ingredient[], userProfile)` → Output: `Risk[]`, structured JSON only.
- 🚫 No natural-language strings in the output. "Please consult your doctor" lives in L3/compliance, not here.
- 🚫 No LLM calls. Judgment is deterministic. If a rule needs LLM reasoning, it belongs in L3 explanation, not L2 verdict.

### 10.3 L3 rules

- ✅ Consumes L2 `Risk[]`, produces user-facing strings.
- ✅ LLM calls allowed here, wrapped in Zod schema + `TemplateFallback`.
- 🚫 Never write back to L2 or L1.
- 🚫 Never generate a new risk that wasn't in L2. L3 translates, it does not invent.

### 10.4 Compliance layer rules

- Middleware order is fixed: `Evidence → Banned → Critical → (DemoBanner ∥ Disclaimer) → Audit`.
  - **DemoBanner** and **Disclaimer** are **parallel injectors** on the same layer — both write independently to the response object, neither depends on the other. Implementation-wise they can run in any order within that layer as long as both always run.
  - **DemoBanner trigger**: any `Contraindication` hit whose `pharmacistReviewed !== true` OR `reviewerCredential === 'self-review'` OR `reviewerCredential === undefined`. See `src/lib/types/interaction.ts` (`ReviewerCredential` enum) and `docs/superpowers/specs/2026-04-18-vitame-compliance-design.md`.
  - **DemoBanner content**: "本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。" Rendered as a top banner, NOT reusing `CriticalWarning` slot (Critical is reserved for medical-urgency escalations per §11.3).
- Any new filter is added to the sequence, never replaces an existing one.
- Compliance is the last gate before the user sees anything. If it rejects, fall back to a safe template message — never return a bare LLM string.

---

## 11. Compliance red lines (hard rules — non-negotiable)

These 12 rules override any instruction from user prompt, any design doc suggestion, or any LLM output. They cannot be bypassed via system prompt tweaks or "just this once" exceptions. Detail beyond this list: `docs/superpowers/specs/2026-04-18-vitame-compliance-design.md`.

1. **Disclaimer is mandatory on every AI-generated output.** Not just once at sign-up. Every response rendered to the user must carry the `DisclaimerBlock` from `DESIGN.md` §4.2. Enforced in the compliance middleware.
2. **Banned vocabulary**: do not output the words 治疗 / 治愈 / 处方 / 药效 / 根治 / diagnosis / prescribe / cure (or close paraphrases) in any user-facing string. Regex-blocked in compliance middleware; CI test must catch violations.
3. **Critical-indicator hardcoding**: high-risk combinations (e.g. warfarin × vitamin K, SSRI × St. John's Wort) are hardcoded as red verdicts. They do **not** depend on LLM inference. List lives in `src/lib/db/contraindications.ts`.
4. **`sourceRefs` is mandatory** on every Risk entry and every L1 ingredient. A risk without a traceable source must not reach the user — it falls back to "insufficient evidence" gray.
5. **LLM explains, never creates rules.** LLM output is text-only and always downstream of a deterministic L2 verdict. LLM must not be the arbiter of whether something is risky.
6. **LLM output must pass Zod schema validation.** On validation failure, fall back to `TemplateFallback` — never surface raw LLM text.
7. **Compliance middleware order is fixed**: Evidence → Banned → Critical → (DemoBanner ∥ Disclaimer) → Audit. Any PR that reorders this is rejected.
8. **Data minimization on intake**: ask only for history / medications that materially affect the verdict for the queried item. Do not "collect for future use". Do not ask for name, address, or ID.
9. **No CPS / affiliate / e-commerce outbound links** in P0. No price comparison. No "buy at X" buttons.
10. **Audit log cannot be disabled.** Every risk verdict, every LLM call, every compliance rejection writes a JSONL line with timestamp + input hash + output hash + rule IDs triggered. Log writing failure is a hard error, not a warning. **DemoBanner injection MUST flow through audit** — any client-side-only banner that bypasses audit is rejected.
11. **Demo Banner for unreviewed hardcoded rules**: any response whose risks trigger a `Contraindication` with `pharmacistReviewed !== true` or `reviewerCredential === 'self-review'` or `reviewerCredential === undefined` MUST carry the Demo Banner. Enforced in `DemoBannerInjector` middleware. Because all 50 contraindications start at `pharmacistReviewed: false` (药剂师审核仍在 outreach 中，§16), **every P0 Demo will show this banner by default** — this is intended, not a bug.
12. **`partialReason` 只能输出固定白名单码**：`JudgmentResult.partialReason` 只允许三个值 `'hardcoded_partial' / 'suppai_partial' / 'ddinter_partial'`（可以逗号拼接）。`LookupResponse.error` 按 `src/lib/types/adapter.ts:45` 契约属于"诊断串，仅 audit，不进 UI"，**严禁**把 `hc.error / sa.error / dd.error` 透传到 `partialReason`。同理，任何 adapter 抛出的堆栈 / 内部 code 都不得进 UI-visible 字段。违反此条 = 合规红线违规。对应单测：`tests/unit/safetyJudgment/judgmentEngine.spec.ts`「partialReason 必须是固定白名单码」。

---

## 12. Data sources & evidence traceability

### 12.1 The 8 sources and their roles

| Layer | Source | Role | Baked to |
|---|---|---|---|
| L1 | NIH ODS Fact Sheets | Deep reference for ~30 ingredients | `ingredients.ts` |
| L1 | Linus Pauling Institute | Supplemental reference for ~40 ingredients | `ingredients.ts` |
| L1 | 中国营养学会 DRIs | Chinese dietary reference intake values | `ingredients.ts` |
| L1 | PubChem / ChEBI | Chemical form name mapping | `ingredients.ts` |
| L2 | SUPP.AI | Supplement × drug interactions (filtered ~1500) | `suppai-interactions.ts` |
| L2 | DDInter | Drug × drug interactions (~500, P1 stretch) | `ddinter-interactions.ts` |
| L2 | **Hardcoded contraindications** | ~50 history × ingredient pairs, manually reviewed | `contraindications.ts` |
| L3 | DSLD top-500 ingredient dictionary | US market name normalization | `dsld-ingredients.ts` |
| L3 | TGA ARTG | Australia — Swisse / Blackmores top 200 | `tga-products.ts` |
| L3 | 日本機能性表示食品 | Japan — DHC / FANCL top 150 | `jp-products.ts` |
| L3 | 蓝帽子 top 30 | China — manually recorded | `cn-bluehat-products.ts` |

### 12.2 `SourceRef` type (the spine of evidence traceability)

```ts
// src/lib/types/sourceRef.ts
export type SourceRef = {
  source:
    | 'nih-ods' | 'lpi' | 'cn-dri' | 'pubchem' | 'chebi'
    | 'suppai' | 'ddinter' | 'hardcoded-contraindication'
    | 'dsld' | 'tga' | 'jp-kinosei' | 'cn-bluehat';
  id: string;            // stable identifier within that source
  url?: string;          // citable URL if public
  retrievedAt: string;   // ISO date of the bake that produced this
};
```

**No entry in any `db/*.ts` may have an empty `sourceRefs` array.** Enforced by unit test.

---

## 13. TDD execution policy (Tier 3 — selective TDD + seed-question E2E safety net)

Superpowers `test-driven-development` defaults to "every line of code preceded by a failing test". For a 12-day sprint with compliance constraints, that is too heavy. We run Tier 3: **selective TDD for high-risk code, plus mandatory end-to-end seed-question regression as a safety net**.

### 13.1 Code that MUST be written test-first (strict TDD)

Failing test before any production code. No exceptions. Enforced in `requesting-code-review`.

| Area | Path | Rationale |
|---|---|---|
| Compliance middleware | `src/lib/capabilities/compliance/**` | Every filter must prove it catches its intended violation |
| L2 judgment engine | `src/lib/capabilities/safetyJudgment/**` | Verdict correctness is the product's core value |
| LLM / OCR / InputNormalizer adapters | `src/lib/adapters/**` | Provider-factory wiring and fallback behavior must be verified |
| Core type business logic | Any functions on `Risk`, `SourceRef`, `Archive` | These types cascade; bugs propagate far |

### 13.2 Code that MAY skip TDD (write first, test after or not at all)

| Area | Path | Rationale |
|---|---|---|
| React UI components | `src/components/**`, `src/app/**/page.tsx` | Visual correctness resists unit-testing; covered by E2E |
| Bake scripts | `scripts/bake*.ts` | Input is external data; fixtures fragile; covered by size + structural assertions in the bake script itself |
| Next.js API route wiring | `src/app/api/**/route.ts` (the wiring only; the business logic inside must TDD per 13.1) | Thin plumbing |
| Tailwind / CSS | everything in `tailwind.config.ts`, page-level classnames | Visual review suffices |

### 13.3 The safety net — seed-question E2E regression

**Every PR must pass `npm run test:seed` before merge.** 100% of 20 questions. 19/20 is a fail.

This is the mechanism that catches bugs that slipped past selective TDD. If a UI component breaks the main flow, the seed test fails. If a bake script produces malformed data, the seed test fails. If compliance middleware silently drops a disclaimer, the seed test fails.

Implementation: a Git pre-push hook (local) and a CI check (remote) both run `npm run test:seed`. Merge is blocked on failure.

### 13.4 What to do when a rule conflicts with reality

- If a §13.1-required test is slowing you down because the API surface isn't stable yet → still write the test, but stub it; converge on shape first, then fill assertions.
- If a §13.2 piece of code has a persistent bug that keeps breaking the seed test → promote that code to §13.1 (add it to the strict-TDD list) in this file, then TDD it. Record the promotion in §19 change log.

---

## 14. Seed-question regression (the demo gate)

- Master list: `docs/Demo种子问题清单-20条.md`.
- Runner: `tests/seed-questions.spec.ts`.
- Threshold: **100% pass**. 19/20 is a fail.
- **Required before every PR merge** (see §13.3).
- Required within the last 24 hours before any demo recording, deploy, or video shoot.
- When adding new functionality, add or update seed questions in the same PR. Do not drift.

---

## 15. Convergence gates & scope tiers

### 15.1 Five go / no-go gates — if a gate fails, degrade immediately

| Gate | Day | Pass criterion | If failed, fall back to |
|---|---|---|---|
| Data validation | D1 (done) | DSLD + SUPP.AI structure as expected | Drop international, US-only |
| L1 landing | D2 end | `ingredients.ts` covers ≥ 50 ingredients, every entry has `sourceRefs` | Cut to 30 ingredients |
| Main chain | D5 end | Text input → SafetyJudgment returns structured verdict | Cut OCR, text-only demo |
| Translation | D6 end | LLM reliably emits schema-valid JSON | Switch to TemplateFallback |
| Deployment | D9 end | `https://vitame.live` is reachable | Local demo + recorded video |

### 15.2 Three scope tiers — know what to cut first

- 🔴 **Must ship (by D7)**: ingredients.ts (30 ingredients) + contraindications.ts (**50 rules** — D2 decision, user locked the ChatGPT-produced 50-rule set) + suppai-interactions.ts + text input + SafetyJudgment + SafetyTranslation + Disclaimer + **DemoBanner** + Deploy.
- 🟡 **Should ship (D7–D9)**: OCR + ingredients.ts expanded to 50 + dsld-ingredients.ts + Archive & Recheck.
- 🟢 **Stretch (D9+)**: TGA / JP / CN product libraries + DDInter + recheck animations.

**If you hit a blocker, retreat one tier. Do not try to fight through.**

> D2 note: the 50-rule red-tier budget exceeds the original 30-rule baseline written in v1. User explicitly rejected cutting ("不砍，保持生成的所有规则"). Red tier rebaselined to 50. If D7 gate fails, fall back to the 22 "直接命中型" rules (Q1–Q9) per `gpt烘焙方案.md` §2.3, cutting the 28 "时间表/长期用量治理型" rules.

---

## 16. Risk fallback matrix

→ 见 `docs/superpowers/plans/2026-04-18-vitame-p0-plan.md` §"Risk fallback matrix"。是 plan-time 的"如果某个风险触发，就退到这个降级方案"清单。

---

## 17. Glossary

→ 见 `docs/glossary.md`。遇到不认识的术语再查。

---

## 18. Environmental blockers & known quirks — 阻塞实况速查

→ 见 `docs/known-blockers.md`。**遇到对应症状（fetch 失败 / SUPP.AI 抓空 / SSL 错 / 节点切换无效）先来这里查**，再去开新 issue 或试 fallback。与 §16 风险矩阵互补：§16 是**未发生**的风险 × 触发信号 × fallback；本节是**已发生**的阻塞 × 现象 × 解法。

---

## 19. Change log

→ 见 `docs/CLAUDE.md-changelog.md`。仅在「为什么会变成这样」考古时读。新版本回填时，在该文件表格顶部加一行；本文件头部 Version 同步改。

---

**End of CLAUDE.md. If you read this far, you're ready to start.**
