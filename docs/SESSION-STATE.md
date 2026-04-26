---
title: "VitaMe P0 Session State Ledger"
description: "VitaMe 当前工程进度、关键决策、阻塞和下一步的运行态记录。"
doc_type: "state"
status: "active"
created: "2026-04-18"
updated: "2026-04-26"
canonical: true
privacy: "internal"
tags: ["session-state", "progress", "p0", "v0.3-rag-chatbot", "engineering"]
---

# VitaMe — Session State Ledger

> **Operational state file** — "where are we right now" 的单一事实源。
> CC 在每个新会话（或压缩重启）之后的**第一件事**是读本文件，再执行用户请求。
> 每完成一个 batch、换方向、或做关键决策后**必须更新本文件**。

---

## 最后更新

**2026-04-26（v0.3 D1+D2 夜间独立完工）** — 用户睡后独立完成 RAG chatbot 完整链路。
**当前分支**：`v0.3-rag-chatbot`（已 push 到 `dianotic/main` 触发 Vercel 自动部署）
**架构**：CLAUDE.md v3.0 — Conversational Shell + RAG + 客户端 LocalStorage profile（v2.10 4 层流水线物理保留但 chat 路径不调用）
**回滚锚**：`git checkout v0.2`（= commit `0ff1c4a`）

**v0.3 完成清单**：
- T-23 ✅ types + Edge LLM provider（src/lib/chat/types.ts + src/lib/llm/edgeProvider.ts）
- T-24 ✅ KB Retriever：keyword grep 8 源 + 别名表 ~500 + Critical 高危标记
- T-25 ✅ system prompt builder：落地 system-prompt-v0.3.md + XML scaffold + 5 few-shot
- T-26 ✅ Edge audit logger：纯 Upstash REST（无 fs fallback）
- T-27 ✅ /api/chat：Vercel Edge runtime + streamText
- T-28 ✅ **本地 smoke**：22.5s 流式 + Critical 红警 + 引证 + 免责
- T-29 ✅ profile types + zustand persist store
- T-30 ✅ profile injector + memory extractor + /api/extract Node route
- T-31 ✅ chat UI：DemoBanner + MessageList + MessageBubble + ChatInput + CitationPill
- T-32 ✅ profile UI：查看/编辑/一键清空（CLAUDE.md §9.8 硬要求）
- T-33 ✅ 根路由 / → /chat
- T-34 ✅ **Vercel 部署 + 远端 smoke**：7.4s（vs v0.2 agent 38.8s = **5x faster**）
- T-35 ✅ wake-up summary：docs/v0.3-handoff-2026-04-26.md

**验证**：typecheck 0 error / `npm run build` 18 路由全绿（含新 /api/chat Edge + /api/extract Node）/ Vercel /chat /profile / 三个页面 200 / Vercel /api/chat 7.4s 流式 + Critical 命中 / Vercel /api/extract 11.9s 抽取通过

**核心 commit**：`1110bf4` feat(v0.3): RAG chatbot D1+D2

**待用户 review**（早醒后）：
1. 浏览器跑 https://vita-me-ebon.vercel.app/chat 体验对话
2. 给 docs/v0.3-handoff-2026-04-26.md "开放问题"4 个 P1 + 4 个 P2 + 2 个阻塞决策点反馈
3. 接 Kevin 流程后做 prompt 第二轮迭代

---

## 历史归档（v0.2）

**2026-04-24（D8 凌晨加班，11 task 完成 / 19，58%）** — 用户睡后 24×7 推进，实测 minimax Anthropic-compat **支持完整 tool use**（端到端 35s、5 tool 按序调用、overallLevel=red）。

**完成清单**：
- T-D8.1 ✅ 3 Vercel skill（ai-sdk + nextjs 安装，react-best-practices SSL 失败搁置）+ `ai@6.0.168` / `@ai-sdk/anthropic@3.0.71` / `@upstash/redis@1.37.0` / `zustand@5.0.12` 入 deps
- T-D8.2 ✅ CLAUDE.md §3.3 +agent 第 3 LLM 点 / §4 SV→Vercel + Upstash audit / §8 临时开 parallel-agents
- T-D8.3 ✅ Agent shell 脚手架（9 文件：provider / vitameAgent / 5 tool / route）
- T-D8.4 ✅ 3 wrap tool 真实实现（parseIntent/runJudgment/translateRisk 直调 capability）+ factory.ts 抽 LLMClient 公共工厂
- T-D8.5 ✅ createActionPlanTool + createMemoryPreviewTool 实装 + 11 新单测（actionPlan.spec / memoryPreview.spec）
- T-D8.6 ✅ **Agent shell 真 LLM smoke PASS** — 35s / 5 tool / red verdict / disclaimer 齐备。关键发现：Vercel SDK 补 `/messages`，Anthropic SDK 补 `/v1/messages`，`provider.ts` 帮 Vercel 侧补 `/v1`
- T-D9.1 ✅ archive save：Zustand persist store + saveFlow 纯函数 helpers + /api/archive/save 路由 + 4 个单测
- T-D9.2 ✅ archive recheck：POST /api/archive/recheck 合并 archived context + 新 ingredient/medication/condition → judge()
- T-D9.3 ✅ auditLogger 三级路由（Upstash > FS > console）+ 5 单测 + wire 进全部 6 个 API 路由（/api/agent / intent / judgment / translation / archive/save / archive/recheck）
- T-D9.4 ✅ fish oil × warfarin yellow→red（文案升级"咨询医生并监测 INR"）
- T-D9.5 ✅ **主链 e2e smoke PASS** — 18.6s 总时长（intent 9.3s + judgment 9ms + translation 9.3s），低于 60s SLA，overallLevel=red 对齐预期
- T-D11.3 ✅ docs/product/demo-pitch-ppt-outline.md 起草 5 分钟汇报 7 片段 + speaker notes + 出处

**验证**：typecheck 0 error / test:unit **307 pass**（+21 vs D7） / test:seed **29 pass**（+0） / npm run build **12 路由全绿**（6 static + 6 dynamic，新增 /api/agent + /api/archive/save + /api/archive/recheck）。

**待用户人工**（5 task 剩余全部卡在这）：
1. **Upstash 免费 Redis**：去 upstash.com 建 → 把 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` 加入 `.env.local`（dev 现在用 FS fallback，prod 必需）
2. **Vercel SSO 登录**（T-D10.1）：`vercel link` + `vercel env add`（需人工一次）
3. **vitame.live DNS CNAME**（T-D10.2）：Vercel dashboard 加域 → Cloudflare 改 CNAME
4. **微信 WebView 真机**（T-D11.1）：iPhone + 安卓扫码访问 vitame.live
5. **录 90s demo 视频**（T-D11.2）：按 demo-script-map.md §2 脚本录
6. **WAIC 报名材料**（T-D12.1）：D11-12 提交

**API key 安全提醒**：你在聊天里明文贴过 minimax key，会话历史里有一份；demo 录完建议到 minimax 控制台 rotate。

**2026-04-24（D7 / 12，Agent v2 文档体系）** — **长期方向正式升级为 Agent app**：在 P0 补剂安全判断楔子之上，新增并重写一套 canonical 文档，明确 P1/P2 为 Reminder、Feedback、Memory、Hermit Agent 自我进化闭环。新增 `docs/product/Agent-北极星.md`、`docs/product/指标体系.md`、`docs/product/demo-script-map.md`、`docs/engineering/specs/system-architecture.md`、`data-flow.md`、`implementation-map.md`、`medical-review-workflow.md`、`data-source-status.md`、`compliance-audit-status.md`、`launch-checklist.md`。API contract 已区分 implemented (`/api/intent`、`/api/judgment`、`/api/translation`) 和 planned（archive、recheck、reminder、feedback、memory、hermit-cycle）。

**2026-04-24（D7 / 12，Agent v2 文档体系）** — **长期方向正式升级为 Agent app**：在 P0 补剂安全判断楔子之上，新增并重写一套 canonical 文档，明确 P1/P2 为 Reminder、Feedback、Memory、Hermit Agent 自我进化闭环。新增 `docs/product/Agent-北极星.md`、`docs/product/指标体系.md`、`docs/product/demo-script-map.md`、`docs/engineering/specs/system-architecture.md`、`data-flow.md`、`implementation-map.md`、`medical-review-workflow.md`、`data-source-status.md`、`compliance-audit-status.md`、`launch-checklist.md`。API contract 已区分 implemented (`/api/intent`、`/api/judgment`、`/api/translation`) 和 planned（archive、recheck、reminder、feedback、memory、hermit-cycle）。

**2026-04-24（D7 / 12，文档重建）** — **唯一事实源重建**：新增 `docs/START-HERE.md`、`docs/product/当前判断.md`、`docs/DOCS-COVERAGE.md`；产品/工程文档按短路径重命名；重复根目录文档和过期 strategy 文档归档到 `docs/_archive/`；当前阅读路径改为 START-HERE → 当前判断 → DOCS-COVERAGE → P0-执行总纲。

**2026-04-24（D7 / 12，下午）** — **三分支对齐 + docs 重组 + PR #1 合入**：把 Kevin 的 `codex/spec-hardening` specs（41 份独有文档）+ PR #1 的 3 条命名约定（camelCase / disclaimer 顶层 / Risk 保留结构化溯源）合入 Sunny 的代码分支。为不打扰 Sunny 的开发，整合后推到**新分支 `dev-merged-2026-04-24`**，本地 `vitame-dev-v0.1` 已 reset 回 `f55d138`（= 远程，Sunny 无感）。  
（v2.9 P0 红规则 +4 D6 晚、v2.8 架构升级 D5 晚、v2.7 LLM Client 等内容已推到下方"刚完成"段。）

### 本次会话主要产出
1. **分支对齐**：`main`（僵尸不动）+ `codex/spec-hardening`（Kevin docs，PR #1 已 MERGED）+ `dev-merged-2026-04-24`（新集成分支，Phase 0-6 产出在这）+ `vitame-dev-v0.1`（Sunny 不受影响的代码开发分支）。
2. **PR #1 合入**：gh pr merge 1 --merge，PR #1 状态 MERGED at 2026-04-24T07:29:51Z，merge commit d052623。
3. **unrelated-histories 合并**（commit `a1cb8b2`）：把 `origin/codex/spec-hardening`（41 份 Kevin 独有文档 + PR #1 产物）合入本地代码分支。7 份重叠 specs 冲突全部取 vitame-dev 侧（v2.8/v2.9 新于 codex D3）。`.gitignore` 手动合并两边条目（Next.js + TypeScript + IDE + GStack + Playwright MCP + 健康数据隐私 + 音频）。
4. **最小重组**（commit `691bf40`）：
   - `_bmad/ _bmad-output/` → `docs/_archive/`（BMAD 残留，不再使用）
   - `docs/engineering/` → `docs/engineering/`（更贴近职能语义）
   - `docs/小红书需求调研/Demo种子问题清单-100条.md` → `docs/research/`（D6 产出）
   - dedup 删 2 份合并重复文件（`小红书用户需求调研.md` / `Demo种子问题清单-20条.md`）
   - `scripts/smoke100.ts:25` SEED_FILE 路径同步更新
   - `.gitignore` 加音频（`*.m4a` / `*.mp3` / `*.wav` 防 42MB 会议录音误推）
5. **命名规范 + §7 刷新**（commit `0969dea`）：
   - 新增 `docs/naming-conventions.md`（30 行规范：product=中文主题 / engineering=英文 kebab / decisions=YYYY-MM-DD-主题 / research=中文主题 / 运行态=大写锚点）
   - CLAUDE.md §0.1 加 naming-conventions 行 + §3.1/§11.1/§11.11/§16 路径改到 `docs/engineering/`
   - README.md + SESSION-STATE.md 同步路径
6. **验证全绿**：test:unit 286 pass / 72 skip（25 files）；test:seed 29 pass / 72 skip（+1 vs D6 基线，v2.9 红规则 +4 多解锁 1 条）；build 12/12 routes 生成（8 static + 3 API + 1 icon）。

### 三分支未来职能（写进 auto-memory）
| 分支 | 职能 | 谁动 | 合并策略 |
|---|---|---|---|
| `main` | 发版分支（live 代码 + 归档文档）| deploy 前推；deadline 后讨论 | 从 `dev-merged-2026-04-24` fast-forward |
| `codex/spec-hardening` | Kevin 的 PRD / 决策 / 策略 / 研究 | Kevin | 新 spec 先提 PR 到这里，再定期合入 dev |
| `dev-merged-2026-04-24` | 集成分支（代码 + 工程文档 + Kevin 吸收过来的产品文档）| Sunny (主 CC) 主攻 | day-to-day 开发在这；吸收 codex 定期 cherry-pick |
| `vitame-dev-v0.1` | 老开发分支（备用）| 暂不动 | — |
| `backup/*-pre-merge-2026-04-24` | Phase 0 安全锚 | 永不动 | — |
1. **时间目标 30s → 60s**（"Demo 视频可剪，产品稳定可靠优先"）
2. **B-full 症状→成分推荐作 P0 例外**（接受工作量超 P0；带 §11.14 强 disclaimer + 用户必须二次点击 product_safety_check）
3. **L2 grading 语义 root fix**（不是 UI 文案：no-data→gray、known+no-rule→green，写入 §10.2 + spec + 改 `judgmentEngine.ts:17-31` + 新增 `KnowledgeBaseLookup`）

## 当前 Sprint 阶段
**D7 — 文档事实源重建完成；L0 intake 代码已落；Phase 3.6 UI 三组件 + 主链联调 未开始**

- Sprint: 12 天 P0（2026-04-18 → 2026-04-29）
- 初赛截止: 2026-04-30（WAIC 超级个体黑客松）

---

## ✅ 刚完成

### D7 — 三分支对齐 + docs 重组 + PR #1 合入 ✅
**触发**：跨分支信息不对齐（代码分支看不到 Kevin 的 PRD / api-contract，Kevin 分支看不到 v2.8/v2.9 红线与 L0 架构），docs/ 10+ 目录分散命名混乱。用户决策：先解阻塞（合并 + 吸收文档），新结构推到**新分支不打扰 Sunny**。

**执行 7 个 Phase**（详见 `docs/CLAUDE.md-changelog.md` v2.10）：
- Phase 0: Backup 分支（`backup/vitame-dev-v0.1-pre-merge-2026-04-24` + `backup/codex-spec-hardening-pre-merge-2026-04-24`）+ stash untracked
- Phase 1: `gh pr merge 1 --merge` → PR #1 MERGED，codex/spec-hardening HEAD → `d052623`
- Phase 2: `git merge --allow-unrelated-histories origin/codex/spec-hardening` → 41 份独有文档 + PR #1 产物合入，7 冲突全 `--ours`，`.gitignore` 合并 → commit `a1cb8b2`
- Phase 3: 重组 `_bmad → _archive / 小红书 → research / superpowers → engineering` + dedup 2 份重复 + scripts/smoke100.ts 路径同步 → commit `691bf40`
- Phase 4: 新增 `docs/naming-conventions.md` + CLAUDE.md §0.1/§3.1/§11.1/§11.11/§16 路径同步 + README.md / SESSION-STATE.md 路径同步 → commit `0969dea`
- Phase 5: 验证 test:unit 286 pass / test:seed 29 pass / build 12/12 routes ✅
- Phase 6: SESSION-STATE + changelog + auto-memory 三处同步；branch fork 到 `dev-merged-2026-04-24`（本地 `vitame-dev-v0.1` reset 回 `f55d138` = 远程 Sunny 无感）

**验证**：
- 3 套测试全绿，Phase 2 的 --ours 决策正确（没把 v2.9 红线丢掉）
- `.playwright-mcp/` + `docs/research/gemini-health-consultation.md` + `*.m4a/*.mp3` 隐私/大文件被 `.gitignore` 挡住
- 本地 `vitame-dev-v0.1` 与 `origin/vitame-dev-v0.1` 一致 → Sunny 完全无感

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
- **历史 API 命名说明**：旧会话里的 `app/api/{query-intake,safety-judgment,safety-translation,archive-recheck}/route.ts` 是 W2 旧计划，不再作为当前事实源。当前 implemented routes 是 `src/app/api/{intent,judgment,translation}/route.ts`；archive / recheck 仍是 planned。
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

**D7 三分支对齐完成**（commit `a1cb8b2 → 691bf40 → 0969dea` 在新分支 `dev-merged-2026-04-24` 上）。下一步候选（按 deadline 倒数 5 天排序）：

1. **D7 主链联调**（Phase 3.6 前置）— text input → /api/intent → /api/judgment → /api/translation → 渲染 RiskBadge + Disclaimer + DemoBanner，跑 60s end-to-end 时间预算；修复发现的集成问题。
2. **Phase 3.6 L0 UI 三组件** — DESIGN §4.7-4.9 ClarifyBubble / IntentFallbackForm / SymptomCandidateList（L0 架构已落，UI 三件套把 user-visible 部分补上）。
3. **P1/P2 细化文档** — 根据 `docs/DOCS-COVERAGE.md` 补 Reminder 属性查表、Feedback Ritual 文案库、Memory schema、Hermit Agent 任务设计。
4. **D6 prompt tuning 真 LLM 验证**（暂挂）— `scripts/smokeIntent.ts` 真 LLM 跑 5 case（需联网 + minimax key）；4 few-shot 是否修复 A/C/D/E 失败 case，主链联调后再验。
5. **P1/P2 L1 增量**（暂挂）— 🟡 8 条 / 🟢 9 条 missing-l1-substance 长尾；看 D7/D8 主链联调后是否有余量。

**用户拍板需求**：
- `main` 何时更新到 `dev-merged-2026-04-24`？建议 D10-11 发版前（deploy target 锁定）。
- Kevin 合并模型：codex/spec-hardening 未来如何同步到 dev？（单向 PR？定期 cherry-pick？）

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

- **2026-04-24（D7 下午, 三分支对齐 + docs 重组, CLAUDE.md v2.10）** — 用户拍板：(1) 3 条命名约定（PR #1 §2.1-2.3 camelCase / disclaimer 顶层 / Risk 结构化溯源）全接受 → `gh pr merge 1 --merge` 合入 codex/spec-hardening；(2) unrelated-histories 合并（方案 C）把 Kevin 的 41 份独有文档 + PR #1 产物合进代码分支，7 冲突全取 vitame-dev 侧 --ours；(3) 最小重组 `_bmad → _archive / 小红书 → research / superpowers → engineering` + dedup 2 份重复；(4) 中文命名规范（`docs/naming-conventions.md`），大规模 rename 推迟到 D8-9；(5) **新结构推到新分支 `dev-merged-2026-04-24` 不打扰 Sunny**，本地 `vitame-dev-v0.1` reset 回 `f55d138` = 远程。三分支未来职能写入 auto-memory + SESSION-STATE 头部。验证 test:unit 286 pass / test:seed 29 pass (+1 vs D6) / build 12/12。
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
4. `docs/decisions/VitaMe-Migration-Superpowers-DESIGN-TDD-2026-04-19.md` — Superpowers + DESIGN + Tier 3 TDD 决策
5. `docs/START-HERE.md` — 当前唯一入口
6. `docs/product/当前判断.md` — 最新思考和保留洞察
7. `docs/DOCS-COVERAGE.md` — 文档完整性矩阵
8. `docs/engineering/plans/p0-plan.md` — 12 天主任务表
9. `docs/engineering/specs/*.md` — design + demo acceptance

---

## 🛠 本文件维护规则

- 完成 `T-0.x` / batch / 关键决策 → 更新 "刚完成" + "下一步" + "决策日志"
- 文件长度控制 **< 200 行**，超了把旧"决策日志"归档到 `docs/session-state-history.md`
- "阻塞"不清除，除非阻塞真被解除
- 用户明确说不做的事（如"UI 延后"）记进"决策日志"，避免未来会话撞车
