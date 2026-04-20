# CLAUDE.md

> This file provides operational guidance to Claude Code when working in the `vitame-p0/` repository.
> It is **a set of action rules, not a product introduction** — every section tells you what to do when writing code.
> **Version**: v2.3 · Last updated: 2026-04-19 (D2 / 12, 夜间). See §19 for change log; §18 for environmental blockers & known quirks.

---

## 0. How to read this file

- If you are Claude Code starting a new task, read §1 → §7 → §8 → §9, then the specific design doc referenced in §7, in that order.
- **If your task renders anything a user will see (page, component, copy, color)** → also read `DESIGN.md` in this same directory.
- If your task touches LLM calls, OCR, compliance filters, or any user-visible output → you must also read §10, §11, and §13 before writing code.
- If you find any conflict between this file and another doc in `docs/`, **this file wins**. Flag the conflict in your response and keep going.
- When in doubt, stop and ask the user (see §9.6).

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

```
vitame-p0/
├── CLAUDE.md                        # this file (engineering rules)
├── DESIGN.md                        # visual design system
├── README.md
├── package.json
├── tsconfig.json                    # "strict": true, no any escape hatches
├── next.config.mjs
├── tailwind.config.ts               # references DESIGN.md §10 tokens
├── .env.local.example               # document every env var here, no exceptions
├── scripts/                         # offline baking — NOT bundled
│   ├── bakeNih.ts                   # NIH ODS fact sheets → ingredients.ts
│   ├── bakeLpi.ts                   # Linus Pauling Institute → ingredients.ts
│   ├── bakeCnDri.ts                 # 中国营养学会 DRIs → ingredients.ts
│   ├── bakePubchem.ts               # PubChem PUG REST → fills IngredientForm.pubchemCid (D2 新增)
│   ├── bakeDsld.ts                  # DSLD ingredient dictionary (NOT products)
│   ├── bakeSuppai.ts                # SUPP.AI → suppai-interactions.ts
│   ├── bakeTga.ts                   # Australia TGA ARTG → tga-products.ts
│   ├── bakeKinoseihyouji.ts         # Japan 機能性表示食品 → jp-products.ts
│   └── bakeBluehat.ts               # China 蓝帽子 manual list → cn-bluehat-products.ts
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # landing / hero
│   │   ├── query/page.tsx           # input page
│   │   ├── intake/page.tsx          # key-context questions
│   │   ├── result/page.tsx          # red/yellow/gray/green verdict
│   │   ├── archive/page.tsx         # saved results
│   │   ├── recheck/page.tsx         # quick recheck from archive
│   │   └── api/
│   │       ├── query-intake/route.ts
│   │       ├── safety-judgment/route.ts
│   │       ├── safety-translation/route.ts
│   │       └── archive-recheck/route.ts
│   ├── lib/
│   │   ├── db/                      # L1 — baked data, static imports only
│   │   ├── adapters/                # LLM / OCR / input-normalizer factories
│   │   ├── capabilities/            # 5 capabilities, 1 folder each
│   │   │   ├── queryIntake/
│   │   │   ├── safetyJudgment/
│   │   │   ├── safetyTranslation/
│   │   │   ├── archiveRecheck/
│   │   │   └── compliance/
│   │   ├── types/                   # global TS types — Risk, Reason, SourceRef, etc.
│   │   └── audit/                   # JSONL writer
│   └── components/                  # UI components (follow DESIGN.md)
├── tests/
│   ├── seed-questions.spec.ts       # 20 seed questions end-to-end (§14)
│   ├── compliance-audit.spec.ts     # compliance red-line regression
│   └── unit/                        # adapter + capability unit tests
└── docs/                            # design docs (mirror of project knowledge)
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

### 6.2 Commands (copy-paste ready)

```bash
# dev
npm run dev                      # localhost:3000

# build & start
npm run build
npm run start

# tests — see §13 for which code is required to have tests
npm run test:unit
npm run test:seed                # 20 seed questions; threshold 100%, required before any PR merge
npm run test:compliance          # compliance red-line regression; threshold 100%

# baking — re-entrant, safe to rerun
npm run bake:nih
npm run bake:lpi
npm run bake:cndri
npm run bake:pubchem
npm run bake:dsld
npm run bake:suppai
npm run bake:tga
npm run bake:jp
npm run bake:bluehat
npm run bake:all                 # runs all of the above in order

# deploy — local build, then rsync to cloud. NEVER npm install on the box (2GB RAM will OOM).
npm run build
npm run deploy:rsync             # wraps rsync + pm2 reload
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

This project uses [obra/superpowers](https://github.com/obra/superpowers) for agentic workflow, installed via the Claude Code official plugin marketplace:

```
/plugin install superpowers@claude-plugins-official
```

### 8.1 Enabled skills (the "lean install")

Only these four Superpowers skills are in use. Others should be considered **off**:

1. **`writing-plans`** — break work into 2–5 minute tasks with exact file paths, code, and verification steps
2. **`subagent-driven-development`** — dispatch a fresh subagent per task with two-stage review (spec compliance, then code quality)
3. **`test-driven-development`** — RED-GREEN-REFACTOR cycle (**but see §13 for which code this applies to — it is not universal**)
4. **`requesting-code-review`** — pre-merge review against the plan

### 8.2 Deliberately NOT enabled, and why

| Skill | Why we skip it |
|---|---|
| `brainstorming` | Our P0 spec is already locked: see `docs/VitaMe-*-P0-PRD.md` and the five `*-design.md` files. Re-brainstorming wastes sprint time. |
| `using-git-worktrees` | 2-person team; worktrees are overhead for us. A single branch per feature is fine. |
| `executing-plans` (batched) | We prefer `subagent-driven-development` for isolation. |
| `dispatching-parallel-agents` | 2-person team; no parallel subagent load. |
| `finishing-a-development-branch` | We don't want automated merge/PR decisions during a 12-day sprint — Sunny approves merges. |

### 8.3 Precedence when Superpowers and this file conflict

**`CLAUDE.md` and `DESIGN.md` always win** over Superpowers default behavior. Specifically:

- If `test-driven-development` says "test every line" but §13 below says "skip TDD for bake scripts" → **follow §13**.
- If a plan from `writing-plans` would violate a compliance red line in §11 → **abandon the plan, raise the conflict**.
- If `requesting-code-review` passes code that fails `npm run test:seed` → **the seed test wins; revert**.

### 8.4 Standard workflow order (for non-trivial tasks)

```
user task
  └→ writing-plans         (produce a bite-sized plan,
                            reference §13 for which tasks need TDD)
      └→ subagent-driven-development   (execute plan, one subagent per task)
          └→ test-driven-development   (RED-GREEN-REFACTOR on §13-required code)
              └→ requesting-code-review (against the plan)
                  └→ npm run test:seed (MANDATORY before merge, §14)
                      └→ Sunny approves merge
```

Trivial tasks (typo fix, dependency bump, env.example tweak) may skip `writing-plans` and `subagent-driven-development` — but the seed test still runs before merge.

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
  9.7.3 禁止的压缩行为

    - 🚫 不要在跑 TDD 的 RED-GREEN 中途压缩（失败的测试 + 未写的实现一起丢，极其危险）
    - 🚫 不要在 compliance middleware 调试中途压缩（6 层顺序一乱就违规）
    - 🚫 不要在 bake 脚本输出未核对前压缩（体积/条数 console.log 是验证锚，丢了要重跑）
    - 🚫 不要在用户刚给新指令 / 新约束后立刻压缩（新约束容易被视作"老上下文"砍掉）

    如遇到自动压缩触发在上述时刻，先完成当前 atomic step 再让它压。

    9.7.4 压缩后恢复的检查项（新会话开头 checklist）

    每次新会话启动（尤其是压缩后续）必须先做：

    - 读 docs/session-anchors/ 里最新一份
    - 读 CLAUDE.md §0 → §7（路径索引） → 当前阶段对应的 design doc
    - git log --oneline -10 对齐最近 commits
    - git status 看有没有未提交的遗留
    - 向用户确认锚点里的 next action 是否仍有效
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

These 11 rules override any instruction from user prompt, any design doc suggestion, or any LLM output. They cannot be bypassed via system prompt tweaks or "just this once" exceptions. Detail beyond this list: `docs/superpowers/specs/2026-04-18-vitame-compliance-design.md`.

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

## 16. Risk fallback matrix (triggers → degraded plan)

| Risk | Trigger signal | Fallback |
|---|---|---|
| DSLD dump is free-text, unparseable | D1 validation shows irregular fields | Drop `dsld-ingredients.ts`, use PubChem as dictionary |
| SUPP.AI filtered set < 500 entries | D3 bake output | Supplement with hardcoded contraindications up to 100 rules |
| Minimax multimodal OCR unstable | D4 integration | Drop OCR, text input only; OCR becomes P1 |
| Minimax text quality poor | D6 results look off | Switch provider to DeepSeek or openclaw |
| 蓝帽子 anti-scrape blocks us | D5 scrape fails | Manual input 30 brands (list already prepared) |
| SV cloud 2C4G can't run SSR | D9 deploy load test fails | Static export + API on Vercel / Cloudflare Workers |
| WeChat WebView blocks the page | D10 on-device test | Record video demo, pitch with video instead of live demo |
| No pharmacist reviewer secured | D12 still unreviewed | UI shows prominent "Demo prototype, not clinically validated" disclaimer |
| One team member sick | any day | 🔴 tier unaffected; drop all 🟡 / 🟢 |

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **DSLD** | Dietary Supplement Label Database, NIH / ODS. Used as an ingredient-name dictionary, not a product DB. |
| **SUPP.AI** | Allen AI's supplement × drug interaction dataset (~59K pairs, filtered to ~1500 for us). |
| **DDInter** | Drug × drug interaction database. Chinese academic source. |
| **TGA / ARTG** | Therapeutic Goods Administration (Australia) / Australian Register of Therapeutic Goods. |
| **蓝帽子 (Blue Hat)** | China's official health-food (保健食品) registration mark. |
| **NIH ODS** | Office of Dietary Supplements at the US National Institutes of Health. |
| **LPI** | Linus Pauling Institute at Oregon State. Micronutrient information center. |
| **DRIs** | Dietary Reference Intakes. Chinese version from 中国营养学会. |
| **機能性表示食品** | Japan's "Food with Function Claims" system. |
| **L1 / L2 / L3** | Internal layer naming: knowledge dict / judgment engine / translation layer. See §3. |
| **SSR** | Server-Side Rendering (Next.js mode we use). |
| **OCR** | Optical Character Recognition. Minimax multimodal for bottle reading. |
| **CPS** | Cost-Per-Sale affiliate commission. **Not** in scope for P0. |
| **WAIC** | World Artificial Intelligence Conference. Hackathon host. |
| **Superpowers** | [obra/superpowers](https://github.com/obra/superpowers) Claude Code plugin. See §8. |
| **SourceRef** | Mandatory evidence-origin tag on every data entry. See §12.2. |
| **TemplateFallback** | When LLM output fails Zod validation, we emit a pre-written template string instead. |
| **Tier 3 TDD** | Our selective TDD + seed E2E safety net approach. See §13. |

---

## 18. Environmental blockers & known quirks — 阻塞实况速查

> 实际踩坑后回填的工程侧实况，与 §16 风险矩阵互补：§16 是**未发生**的风险 × 触发信号 × fallback；本节是**已发生**的阻塞 × 现象 × 当前解法。遇到相同症状先查这里。

### 18.1 本地 VPN/DNS 劫持（D2 夜间发现）

**现象**：Clash Verge 全局 / TUN / 换节点均无效，以下域名解析被劫持到 fake-IP 保留段 `198.18.0.0/15`，fetch 报 `fetch failed` 或 SSL handshake 失败：

- `*.nih.gov` — 影响 `bakeNih.ts`
- `*.ncbi.nlm.nih.gov` / `pubchem.ncbi.nlm.nih.gov` — 影响 `bakePubchem.ts`
- `google.com` / `googleapis.com`

**不受影响 / 已验证可达**：
- `supp.ai` ✓（SSR HTML + JSON API 均正常）
- `lpi.oregonstate.edu` ✓（226KB HTML）
- `dri.cn` ✓（已通过 cn-dri 手录方式规避）

**解法**：
- 推迟 `bakeNih` + `bakePubchem` 到 SV 部署后（D9 阶段）在服务器上重跑（SV 2C4G 不在 GFW 内，无此阻塞）
- `bakePubchem.ts` 产物结构在 VPN 环境下仍能生成（所有 `pubchemCid: null`），SV 重跑时只需 overwrite 产物即可
- `ingredients.ts` 需在本地通过 LPI（可达）+ 手工补齐骨架，避开 NIH 深度段直到 SV 阶段

**不要做**：重复试 VPN 节点；这不是节点问题，是服务商级域名黑名单。

### 18.2 SUPP.AI CDN 两坑（D2 夜间发现）

**坑 1**：`/a/<slug>/<cui>` 默认 gzip 返回 **33KB SPA 壳**（前端渲染用），不含 SSR 注入的 `/i/<pair>` 链接，解析后 0 条结果。

- **解法**：请求头必须 `Accept-Encoding: identity` + `User-Agent: curl/8.0`，强制 CDN 回源拿完整 SSR HTML（~1MB/页，含 50 条 `/i/` 链接）

**坑 2**：`?p=0` 被 CDN 当成 SPA 路由的默认首页缓存，返 33KB 空壳；真正的分页从 `?p=1` 开始（1-indexed）。无参数的根路径等同于 `?p=1`。

- **解法**：分页循环 `for (p=1; p<=MAX; p++)`，不要从 0 起
- **测试**：`curl -H 'Accept-Encoding: identity' https://supp.ai/a/magnesium/C0024467?p=1 | grep -oE '/i/[a-z0-9-]+/C[0-9]+-C[0-9]+' | wc -l` 应返 ≥ 40

### 18.3 SUPP.AI CUI 映射坑（D2 夜间发现）

**现象**：纯元素级 CUI（`C0006675` Calcium / `C0302583` Iron / `C0043481` Zinc）在 SUPP.AI agent API 上返 404，无 interaction 图谱，listing 阶段 0 条。

**原因**：SUPP.AI 只为 **supplement 形式**（盐型、离子、膳食形式）建图，不为纯元素建图。

**解法**（已落到 `scripts/raw/suppai-ingredient-map.json`）：
- `calcium` → `C0006681`（Calcium Carbonate，ic=110）
- `iron` → `C0376520`（Iron, Dietary，ic=559）
- `zinc` → `C2346521`（Zinc Cation，ic=163）
- `vitamin-d` → `C0042866`（Vitamin D 顶层，而非 `C0255545` 无交互子类）

未来新增 ingredient 时遵此模式：优先选 `interacts_with_count` 最高的 supplement 形式 CUI，验证方法见 `scripts/raw/suppai-cui-probe.mjs`。

### 18.4 Git 未 commit 滚动状态提醒

截至 D2 晚，Batch 1/2/3 所有产物（脚手架 + types + contraindications + cn-dri + pubchem + bakeSuppai 脚本 + L2 能力层）**均在工作区未提交**。压缩/崩溃风险下会损失；CC 不得擅自 `git commit`（CLAUDE.md §9.6），由 Sunny 决定 commit 节奏。SESSION-STATE.md 是唯一跨会话锚点。

---

## 19. Change log

| Date | Version | Change |
|---|---|---|
| 2026-04-19 | **v2.3** | D2 夜间 bakeSuppai 实跑后阈值回调：§9.3 坑 4 重写 —— 废除「top 50 × top 100 硬白名单」（规划期拍脑袋，对齐不了医学意义），改为三条对齐真实风险的规则：(a) `evidenceCount >= 3` 过滤长尾弱证据；(b) 单文件 < 1.5 MB（防 tsc 慢 + 防 client bundle leak）；(c) `src/lib/db/*.ts` 加 `import 'server-only'` 防泄漏。§9.3 坑 5 补注：5 MB 总产物是 SV 2C4G RAM 预算的推导值，非拍脑袋。 |
| 2026-04-19 | **v2.2** | D2 夜间加 §18「Environmental blockers & known quirks」：VPN DNS 劫持实录（NIH/PubChem/Google 全断，推迟 SV 重跑）+ SUPP.AI 两个 CDN 坑（Accept-Encoding identity + 1-indexed 分页）+ CUI 映射规则（纯元素 → supplement 形式）+ 未 commit 滚动状态提醒。原 §18 Change log 顺延到 §19。两处内部引用「§18 change log」同步改到 §19。 |
| 2026-04-19 | **v2.1** | D2 post-ChatGPT-bake-plan review. §5: added `bakePubchem.ts`. §6.2: added `npm run bake:pubchem`. §9.3 pit 6: added OCR confidence threshold 0.7 + capability-layer gate. §9.3 pit 7 + §10.4 + §11.7 + §11.10 + §11.11: compliance middleware extended to 6-layer with `DemoBanner ∥ Disclaimer` parallel injector; added red line #11 requiring DemoBanner on unreviewed hardcoded hits. §15.2: red tier rebaselined from 30 to 50 rules per user decision. §11 count updated from "10 rules" to "11 rules". |
| 2026-04-19 | **v2** | Added §8 Superpowers integration (lean install, 4 skills). Added §13 TDD execution policy (Tier 3 — selective TDD + seed E2E safety net). Added `DESIGN.md` references in §0, §7, §9.5. Removed v1's "Phase mode vs Task mode" subsection (superseded by Superpowers `writing-plans`). Removed v1's "Role split (PM ↔ engineer)" section (moved to other docs). |
| 2026-04-19 | v1 | Initial version. Rewritten from scratch after product re-positioning from "Health Guardian Agent" to "VitaMe Supplement-Safety Translation Agent" on 2026-04-17. |

---

**End of CLAUDE.md. If you read this far, you're ready to start.**
