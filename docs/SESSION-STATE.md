# VitaMe P0 — Session State Ledger

> **Operational state file** — "where are we right now" 的单一事实源。
> CC 在每个新会话（或压缩重启）之后的**第一件事**是读本文件，再执行用户请求。
> 每完成一个 batch、换方向、或做关键决策后**必须更新本文件**。

---

## 最后更新
**2026-04-22（D6 / 12，晚）** — **CLAUDE.md v2.9 P0 红规则 +4**：100-条 seed 暴露 32 条 missing-l1-substance 长尾，按 demo ROI 分四档 P0/P1/P2/P3，落地 P0 4 条解锁 4 条 seed（红规则总数 2→6）。  
（v2.8 架构升级 D5 晚的内容已推到下方"刚完成"段。）

### 本次会话主要产出
1. **替换 seed runner**：`tests/seed-questions.spec.ts` 从 20 条版重写为 100 条版（来源 `docs/小红书需求调研/Demo种子问题清单-100条.md`），引入 6-kind 分类（covered / fallback / missing-l1-rule / missing-l1-substance / non-l2-form / non-l2-decision）+ `afterAll` 覆盖率报告 + 自检阈值断言。基线 24 runnable / 76 skip / 全 pass。
2. **P0 L1 扩展（4 条红规则）**：`src/lib/db/contraindications.ts` 50 → 54。
   - `vm-rule-magnesium-kidney-impairment` (red, `magnesium_accumulation_renal_impairment`) → seed Q65
   - `vm-rule-stjohnswort-oral-contraceptive` (red, `cyp3a4_induction_contraceptive_failure`) → seed Q8
   - `vm-rule-ginkgo-warfarin` (red, `bleeding_risk_anticoagulant_synergy`) → seed Q67
   - `vm-rule-vitamina-infant-highdose` (red, `infant_vitamina_overdose_risk`) → seed Q53
3. **配套同步**：`slugMappings.ts` 加 alias（圣约翰草/银杏/避孕药/肾病/婴幼儿）；`knowledgeBaseLookup.ts` `KB_ALIAS_KNOWN_SET` 加 st-johns-wort/ginkgo（避免 KB 误判 gray no_data）；`tests/unit/contraindications.spec.ts` 总数 50 → 54 + 改 `>=50` floor 双断言。
4. **文档侧**：CLAUDE.md v2.8 → v2.9（§3.1 `~50` → `~54` / §15.2 D6 note + 必发清单 +4 条 / 头部 Version + 日期）；`docs/CLAUDE.md-changelog.md` 加 v2.9 条目；本文件本次。
5. **测试**：seed 25→29 pass，runnable 24→28，红 2→6；全 unit 套件 286 pass / 0 fail / 72 skip。
1. **时间目标 30s → 60s**（"Demo 视频可剪，产品稳定可靠优先"）
2. **B-full 症状→成分推荐作 P0 例外**（接受工作量超 P0；带 §11.14 强 disclaimer + 用户必须二次点击 product_safety_check）
3. **L2 grading 语义 root fix**（不是 UI 文案：no-data→gray、known+no-rule→green，写入 §10.2 + spec + 改 `judgmentEngine.ts:17-31` + 新增 `KnowledgeBaseLookup`）

**新增 L0 Query Intake 层**取代 v2 关键词 4 题固定问答：parseIntent (LLM, Zod `.strict()`) + groundMentions (确定性) + slotResolver (业务规则) + clarify (hybrid: 业务定 WHEN/WHAT, LLM 仅 phrase)。7 intent 类型，P0 实装 4 handler（product_safety_check / symptom_goal_query / ingredient_translation / unclear），其他 3 走"礼貌告知"fallback。

**8 文档同步全部完成**（CLAUDE v2.7→v2.8 + query-intake-design 重写 v3 + safety-judgment-design grading 拆分 + DESIGN 加 §4.7-4.9 + p0-plan 加 Phase 1.5/2.5/3.5/3.6 任务簇 + acceptance 12→15 条 + SESSION-STATE 本次 + changelog 待）。CLAUDE.md 加两条新红线：§11.13 L0 LLM 不得判风险 / §11.14 症状→成分需 disclaimer + 二次核查。预估额外工作量 35–43h / 5–6 天。

## 当前 Sprint 阶段
**Phase 1.5（v2.8 新增）— L0 Query Intake 层 + L2 grading fix；Phase 1 L3 LLM Client 已就位**

- Sprint: 12 天 P0（2026-04-18 → 2026-04-29）
- 初赛截止: 2026-04-30（WAIC 超级个体黑客松）

---

## ✅ 刚完成

### D5 晚 — v2.8 架构升级 8 文档同步 ✅
**触发**：本次会话用户连续拍板 3 项产品决策（30s→60s / B-full symptom→ingredient / L2 grading semantic root fix），需把决策落到 8 份文档保持一致性。

**同步范围**（执行顺序：CLAUDE → query-intake → safety-judgment → DESIGN → p0-plan → acceptance → SESSION-STATE → changelog）：
1. **CLAUDE.md v2.7 → v2.8**：架构 3 层 → 4 层（加 L0 行）；§3.3 L0 输出 grounded slugs only；§10.0 L0 rules 段；§10.2 L2 加 no-data ≠ no-risk；§11.13 + §11.14 两条新红线；§13.1 加 L0 三组件 strict TDD；§15.2 L0 进 🔴 / symptom-ingredients 进 🟡；time goal 30s→60s
2. **query-intake-design.md** 全文重写 v3：4 阶段 pipeline + IntentResultSchema (`.strict()`) + 7 intent 类型 + parseIntentFallback 3 固定文案 + clarify hybrid pattern (≤2 轮) + P0 4-handler 实现矩阵 + 7 测试场景（含"感冒期间 维 AD 软胶囊"）+ v2→v3 迁移表
3. **safety-judgment-design.md**：拆 "ingredient not in any DB" → 两规则（gray vs green）+ 删旧 "SUPP.AI miss → green" + 测试场景 5 拆 5a/5b/5c + 加 KnowledgeBaseLookup 组件
4. **DESIGN.md**：date 2026-04-22 + RiskBadge 标签拆 (no_data → "未收录" / legacy → "证据不足") + 新增 §4.7 ClarifyBubble + §4.8 IntentFallbackForm + §4.9 SymptomCandidateList + §9.3 checklist 加 5 项 + §11 provenance 同步
5. **p0-plan.md**：Phase 1.5 (L0 ~10 task) + Phase 2.5 (L2 grading fix ~3 task) + Phase 3.5 (symptom候选 ~4 task) + Phase 3.6 (3 UI) + 日历 D5/D6/D7 重排 + 5 收敛门补 D5/D6 + 3 档 scope 加 v2.8 项
6. **acceptance-checklist.md**：12 条 → 15 条（拆第 6 条 grading 语义 6a/6b/6c + 第 11 条 30s→60s + 新增 12 意图 4-handler + 新增 13 ClarifyBubble UI + 新增 14 schema 不漏 risk 字段 + OCR 改第 15 条）
7. **SESSION-STATE.md**：本次更新
8. **CLAUDE.md-changelog.md**：v2.8 行待加

**验证**：8 份文档全部完成。代码改动尚未启动（D6 起 Phase 1.5/2.5 TDD 推）。

### D5 — L3 LLM Client（Claude Code 模式）✅
**触发**：D4 晚 openclaw 13121 端口鉴权探查无果（用户终端爆窗），D5 用户拍板「参考 Claude Code，env 配置 vendor + model 即可适配」，弃 v1 三家各自 adapter class 的 factory 模式。

**文档侧（CLAUDE.md v2.5 → v2.6）**：
- §4 Tech stack LLM providers 段重写：单 `LLMClient` + OpenAI SDK，`LLM_PROVIDER` 仅作 audit log tag，不进 if/else
- §6.1 env vars 重写：通用 `LLM_* + VISION_* + LLM_FALLBACK_*` shape；vision 单独 endpoint；fallback 链 env 预留
- `.env.local.example` 同步；`docs/CLAUDE.md-changelog.md` append v2.6 条目

**代码侧（commits TBD on `vitame-dev-v0.1`）**：
- 新增 `src/lib/adapters/llm/`：`types.ts`（`LLMConfig / LLMRequest / LLMResponse / LLMError / ChatBackend` 契约）+ `providers.ts`（minimax/deepseek/openai 默认 baseURL map）+ `client.ts`（`createLLMClient(config, backend?)` 工厂，70 行）+ `index.ts`（barrel）
- `client.ts` 用 `ChatBackend` 抽象，测试可注入 fake 不需 mock OpenAI SDK；`import 'server-only'` 守住 API key 不进 client bundle
- error 分类：`auth`(401/403) / `rate_limit`(429) / `network`(ECONNREFUSED|ENOTFOUND) / `timeout`(ETIMEDOUT|message contains "timeout") / `invalid_response`（fallback 默认）
- `tests/unit/llm/llmClient.spec.ts` 10 测试（§13.1 强 TDD）
- 装 `openai@^4.104.0` 依赖

**P0 范围裁剪**：
- 第一版**单 client，无 fallback chain**（env 预留 `LLM_FALLBACK_*`，代码 TODO）— 等主链跑通再补
- vision endpoint 留 placeholder（`MiniMax-VL-01` 是猜测；MiniMax 截图未列专 vision 模型 → P0 OCR 是 🟡 tier 不阻塞，激活时再确认实际 endpoint/model）
- openclaw 不在 P0 client 内（13121 非标 schema，鉴权 D9 进控制台 5 分钟搞定后单独 wrap）

**验证**：
- `npm run typecheck` 0 error
- `npm run test:unit` 8 files / **103 tests pass**（93→103，+10 新）
- `npm run build` 10/10 SSG，First Load 87-93 KB（OpenAI SDK 未漏到 client bundle）

### D4 及更早 — 已归档至 `docs/session-state-history.md`
- D4 跨分支对齐（Kevin specs × Wave 1 代码，3 条命名约定锁定 + commits `4868883` / `371e16e` / `f412170`）
- D3 Wave 1 外包（Gemini + Codex 并行 5 TASK）+ Git 仓库重建
- D2 Batch 1/2/3（脚手架 + 8 types + contraindications 50 + bakeCnDri/Pubchem/Suppai + L2 47/47 green）
- D2 CLAUDE.md v2.2 → v2.3 阈值合理化（evidence≥3 + <1.5 MB + server-only）
- D2 知识库方案审 + 二次扩展 types + 文档共识回填 v2 → v2.1

---

## ⏳ 未完成（Wave 2+ 候选）

- **L3 LLM Client 接到 safetyTranslation 调用链**：`createLLMClient` 已就位，需在 `src/lib/capabilities/safetyTranslation/` 加 prompt builder + Zod 校验 + TemplateFallback 串起来
- **API 路由**：`app/api/{query-intake,safety-judgment,safety-translation,archive-recheck}/route.ts`（W2-B 待启动）
- **LLM fallback chain**：`LLM_FALLBACK_*` env 预留，代码 TODO；主链跑通后补 `createLLMClientWithFallback(primary, fallback)`
- **Vision LLM endpoint 确认**：MiniMax 实际 vision endpoint/model 待用户测试时填入（P0 OCR 🟡 tier 不阻塞）
- **openclaw branch wrap**：D9 SV 部署后进 13119 控制台拿 13121 鉴权 header，单独 wrap（不在 OpenAI-compat client 里）
- **bakeNih + bakePubchem CID 填充**：本地 VPN 劫持无解，推迟到 SV 部署后在服务器重跑
- **bakeDsld / bakeTga / bakeJp / bakeBluehat**：🟡🟢 层，D7+ 再说
- **L0 parseIntent prompt tuning（D6 必修）**：D5 晚 smoke 5 case 暴露 LLM 在边界 case 上判错 intent / 漏抽 ingredient。已用 alias 修补 B（孕妇→pregnancy）；以下 4 类需 prompt 改：
  - **A** "X 和 Y 能一起吃吗" → 当前 LLM 判 `contraindication_followup`，应判 `product_safety_check`
  - **C** "X 现在能吃吗" → 当前 LLM 判 `unclear`，应判 `product_safety_check` + missingSlots=['medication_context']
  - **D** "我老失眠/疲劳" → 当前 LLM 判 `unclear`，应判 `symptom_goal_query` + symptomMentions=['失眠']
  - **E** "维生素 AD 软胶囊" → 当前 LLM 漏抽，应进 ingredientMentions=['维生素A','维生素D']（可考虑同时补 INGREDIENT_QUERY_MAP `'维生素 ad': ['vitamin-a','vitamin-d']`）
  - 改动位置：`src/lib/capabilities/queryIntake/parseIntent.ts` PROMPT_TEMPLATE 加 4-6 个 few-shot 例子
  - 验证：`scripts/smokeIntent.ts` 5 case 至少 4 通过

---

## 👉 下一步

**v2.9 P0 红规则 +4 完成 + 文档同步完成**（CLAUDE / changelog / SESSION-STATE 三处）。下一步候选（按用户决策序）：

1. **D6 prompt tuning 真 LLM 验证（task #63 in_progress）** — `scripts/smokeIntent.ts` 在真 LLM 下跑 5 case，看新加的 4 few-shot examples 是否把 A/C/D/E 4 个失败 case 至少修复 4/5。需联网 + minimax key 在 env。
2. **P1/P2 L1 增量（28 条 missing-l1-substance 长尾）**：
   - 🟡 P1（黄规则高频，~8 条 Q）— melatonin+benzodiazepine+alcohol / quinolone / antibiotic / vitamin-k2 / niacin+gout / caffeine 高剂量
   - 🟢 P2（单 ingredient 低成本，~9 条 Q，每条 ~30 min）— inositol+pcos / cranberry / ginseng / alpha-lipoic-acid / nmn / milk-thistle+nafld / black-cohosh+menopause
   - ⏸ P3（需新机制层，暂缓）— grapefruit-CYP3A4 / 赋形剂层 / 减脂违规识别 / 运动营养 / 婴幼儿剂型 / 双磷酸盐 等
3. **Phase 3.6 L0 UI 三组件**（task #53 pending）— DESIGN §4.7-4.9 ClarifyBubble / IntentFallbackForm / SymptomCandidateList
4. **D7 主链联调** — text input → /api/intent → /api/judgment → /api/translation → 渲染 RiskBadge + Disclaimer + DemoBanner，跑 60s end-to-end 时间预算

**用户拍板需求**：
- D6 smokeIntent 是否本会话跑（需联网/key），还是挂 D7 一起？
- P1 是否进 D7（再 +8 条 seed runnable，红→6 + 黄 +8）？还是直接做 UI（Phase 3.6）让 demo 链路先能跑通再回头扩 L1？

---

## 🚧 已知阻塞

- L1 烘焙需 30 成分清单用户确认（ChatGPT 方案 §2.1 的 30 条；如无异议 CC 按此跑）
- 50 条 contraindication 需**药剂师审核**（outreach 仍在进行中，CLAUDE.md §16；审前 `pharmacistReviewed: false` → DemoBanner 必挂）
- `npm run test:seed` 绿态需等到 Phase 1-3 API 路由落地
- **VPN 阻塞（2026-04-19 夜间发现）**：Clash Verge 全局 / TUN / 换节点均无效，以下域名 DNS 被劫持到 fake-IP 198.18.0.0/15 范围：
  - `*.nih.gov` / `ncbi.nlm.nih.gov` → bakeNih + bakePubchem 暂时无法跑
  - `google.com` / `googleapis.com`
  - 可达：`supp.ai` ✓ / `lpi.oregonstate.edu` ✓（226KB 页正常）
  - 解法：推迟 bakeNih + bakePubchem 到 SV 部署后（D9 阶段）在服务器上重跑；本地先用可达源推进

---

## 📋 决策日志（新 → 旧）

- **2026-04-22（D5 晚, v2.8 架构升级）** — 用户连续拍板 3 项产品决策：(1) 时间目标 30s→60s；(2) B-full 症状→成分推荐作 P0 例外（接受工作量超 P0，要求合规审查就合规审查）；(3) L2 grading 语义 root fix（L2 逻辑改，不是 UI 文案）。CC 落实 8 文档同步：CLAUDE v2.7→v2.8 加 L0 layer + 2 条新红线（§11.13 / §11.14）+ §10.0 / §10.2 / §13.1 / §15.2 同步；query-intake-design 重写 v3；safety-judgment-design grading 拆分 + 新组件 KnowledgeBaseLookup；DESIGN 加 §4.7-4.9 三组件 + §9.3 checklist 5 项；p0-plan 加 Phase 1.5/2.5/3.5/3.6 任务簇 + 日历 D5/D6/D7 重排；acceptance 12→15 条；本文件；changelog v2.8 行。预估额外工作量 35–43h / 5–6 天。
- **2026-04-22（D5, 协议修正, CLAUDE.md v2.7）** — v2.6 误选 OpenAI-compat，用户给的 token `sk-cp-...` 实际走 minimax `/anthropic` 入口（Anthropic Messages 协议 + Bearer authToken）。同日改用 `@anthropic-ai/sdk` 重写 client.ts，`LLMRole` 收窄、加 `system` 字段、`stop_reason` 映射。Smoke test 真调 minimax 通过（M2.7 返中文）。fallback DeepSeek 因只 OpenAI-compat → P0 暂不做。
- **2026-04-22（D5, LLM Adapter 架构, CLAUDE.md v2.6）** — 用户拍板「参考 Claude Code 模式」：env 配置 `LLM_PROVIDER + LLM_MODEL + LLM_BASE_URL + LLM_API_KEY` 通用 shape，单 `LLMClient` 适配所有 厂商。弃 v1 三家各自 adapter class 的 factory 模式。openclaw 非标 schema 不进 P0 client（D9 SV 后 wrap）。第一版无 fallback chain（env 预留代码 TODO），vision endpoint placeholder（OCR 是 🟡 tier）。
- **2026-04-21（D4, 晚, CLAUDE.md v2.4）** — 用户拍板只在 `vitame-dev-v0.1` 本分支同步 3 条对齐约定的影响（§11 红线 12 条、§9.4 checklist Risk dimension/cta、§19 v2.4 change log、SESSION-STATE 更新）；暂不合 `codex/spec-hardening`，继续单分支开发直到 Kevin review 完 PR #1
- **2026-04-21（D4, 晚, Kevin handoff）** — 创建 `docs/2026-04-21-kevin-review-handoff.md`（128 行，7 section）+ PR #1 issue comment 指向它；让 Kevin 先读 handoff 再看 diff
- **2026-04-21（D4, 晚, Codex review 补丁）** — `371e16e`：`partialReason` 只出固定白名单码，不再透 `adapter.error`（合规契约锁死）；merger dimension/cta 冲突先加 TODO，Wave 2 再加 `conflictingDimensions / conflictingCtas`
- **2026-04-21（D4, 白天, 跨分支 3 条命名约定）** — 锁定：(1) TS 字段 camelCase / 枚举值 snake_case；(2) disclaimer 顶层 1 份；(3) Risk 保留 ingredient/condition/medication 结构化溯源。代码侧 Plan B（增量加 dimension + cta）落到 `4868883`；文档侧 PR #1 同步改 Kevin 的 8 份 specs
- **D3 及更早的决策**已归档至 `docs/session-state-history.md`（2026-04-20 Wave 1 外包 + Git 重建；2026-04-19 D2 SUPP.AI 坑 + 阈值合理化 + L2 跑绿 + 用户授权）

---

## 📚 文档优先级（冷启动顺序）

1. `CLAUDE.md`（根） — 工程规则，§11 红线
2. `DESIGN.md`（根） — 视觉规范（UI 阶段才需要）
3. **本文件** `docs/SESSION-STATE.md` — 当前进度
4. `MIGRATION-2026-04-19.md`（根） — Superpowers + DESIGN + Tier 3 TDD 决策
5. `docs/superpowers/plans/2026-04-18-vitame-p0-plan.md` — 12 天主任务表
6. `docs/superpowers/plans/2026-04-18-vitame-数据接入与实现方案.md` — 数据层方案
7. `docs/superpowers/specs/*.md` — 5 份 design + demo acceptance
8. `docs/小红书需求调研/Demo种子问题清单-20条.md` — MVP 边界

---

## 🛠 本文件维护规则

- 完成 `T-0.x` / batch / 关键决策 → 更新 "刚完成" + "下一步" + "决策日志"
- 文件长度控制 **< 200 行**，超了把旧"决策日志"归档到 `docs/session-state-history.md`
- "阻塞"不清除，除非阻塞真被解除
- 用户明确说不做的事（如"UI 延后"）记进"决策日志"，避免未来会话撞车
