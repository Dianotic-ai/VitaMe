# VitaMe P0 — Session State Ledger

> **Operational state file** — "where are we right now" 的单一事实源。
> CC 在每个新会话（或压缩重启）之后的**第一件事**是读本文件，再执行用户请求。
> 每完成一个 batch、换方向、或做关键决策后**必须更新本文件**。

---

## 最后更新
**2026-04-20（D3 / 12，晚）** — Wave 1 外包（Gemini CLI + Codex CLI 并行 5 TASK）全部合入主仓并验收通过：TASK-1/2 LPI 烘焙（30 成分 / 27.7 KB）、TASK-3 20 条 seed fixtures、TASK-4 L3 兜底模板（28/39 reasonCode）、TASK-5 3 个 UI 组件。代码 push 到 `github.com/Dianotic-ai/VitaMe` 分支 **`vitame-dev-v0.1`**（单 commit，80 files / 43313 insertions，敏感 key 已隔离）

## 当前 Sprint 阶段
**Phase 0 → Phase 1 过渡 — Wave 1 外包交付完成，准备 Wave 2**

- Sprint: 12 天 P0（2026-04-18 → 2026-04-29）
- 初赛截止: 2026-04-30（WAIC 超级个体黑客松）

---

## ✅ 刚完成

### Wave 1 外包（2026-04-20 / D3，Gemini + Codex 并行 5 TASK）✅
**模式**：主 CC 做 orchestrator（拆 brief / 两轮验收 / 合仓 typecheck），Gemini CLI + Codex CLI 并行执行 TASK。每 TASK 结构：`brief.md` + `reference/` + `output/`，交付物 PR 式验收。
- **TASK-1**（Gemini，LPI raw）：`scripts/raw/lpi-manual.json` — 30 成分 / 31,851 bytes，schema pass、0 banned word
- **TASK-2**（Codex，bakeLpi）：`scripts/bakeLpi.ts`（128 行）→ `src/lib/db/lpi-values.ts`（27.7 KB / 30 条，md5 幂等）。主仓 typecheck 暴露 `noUncheckedIndexedAccess` TS2532（外包环境 tsconfig 不同）→ 改 `Set<string>` 去重取代 `rows[i-1].id` 越界访问
- **TASK-3**（Gemini，seed fixtures）：`tests/fixtures/seeds.json` — 20 条（red=2 / yellow=10 / gray=3 / green=5），3 轮验收：R1 3 处缺失 → R2 S04 "药效" 违 §11.2 → R3 Gemini 自补 green placeholder risks 满足 Zod `expectedRisks.min(1)`（validate-raw.ts:86 我规划时漏看）
- **TASK-4**（Codex，L3 兜底模板）：`src/lib/capabilities/safetyTranslation/templates.ts`（163 行）— 28/39 reasonCode + 4 level default 分支，纯函数无依赖，0 banned word，所有字符串在 headline≤30 / body≤150 / actionHint≤50 限内
- **TASK-5**（Codex，UI 组件）：`src/components/{RiskBadge,DisclaimerBlock,DemoBanner}.tsx`，主仓 typecheck + build pass

**外包流程 learnings**（写入反思）：
- 两轮验收基本够用（R1 发现 + R2 修复）；R3 只在 schema 解读有分歧时才需要
- Brief 必须把主仓 tsconfig 严格规则（`noUncheckedIndexedAccess` 等）明写，否则外包 typecheck 在外包 repo 通过但合仓失败
- 规划 TASK-3 时 CC 未读 `scripts/validate-raw.ts` schema 细节（`.min(1)` 要求），让 Gemini 在 R1/R2 多走一轮 — 教训：brief 产出前必须把校验脚本先读一遍
- 新增 feedback 记忆 `feedback_verify_before_propose.md`：共享配置（package.json / tsconfig）改动前必 Read/Grep 现状，禁把 brief "应有" 当 "实际有"

### Git 仓库重建（2026-04-20 / D3 晚）✅
原本地 `.git` 在用户清理历史资料时被一起删（项目文件夹层级删除）。现状：
- 本地重新 `git init` + 建分支 `vitame-dev-v0.1`
- Remote `dianotic` = `https://github.com/Dianotic-ai/VitaMe.git`
- 单 commit：80 files / 43,313 insertions（覆盖 scaffold + 8 types + L1 数据 + L2 引擎 + L3 模板 + 3 UI + 20 seeds + bake 脚本 + unit 测试 + CLAUDE.md v2.3 + DESIGN.md + 6 design spec + 3 plan）
- 敏感隔离：`.env.local` 已按 `.gitignore` 排除；`.env.local.example` 模板值空；源码/docs 仅引用变量名，无硬编码 key
- PR 入口：`https://github.com/Dianotic-ai/VitaMe/pull/new/vitame-dev-v0.1`

### Batch 1 + Batch 2 — 脚手架 + 8 份 type 契约 ✅
- `package.json`（next@14.2.15 / react@18.3.1 / zod@3.23.8 / tailwind@3.4.14 / vitest@2.1.3 / playwright@1.48.0 / tsx / cheerio）+ `tsconfig.json`（strict + noUncheckedIndexedAccess）+ `next.config.mjs` + `tailwind.config.ts`（4 risk token 对齐 DESIGN.md §2.1）+ `.env.local.example`（`NEXT_PUBLIC_DEMO_MODE=1`）
- 占位 UI：`src/app/{layout,page}.tsx` + `globals.css`
- 8 份 type：`src/lib/types/{sourceRef,ingredient,interaction,product,person,query,risk,archive}.ts`
- 验证三连：install / typecheck 0 err / build 首屏 87.4 kB
- 路径决策：`src/lib/types/` 胜 plan 的 `src/types/`；`SourceOrigin` 小写-连字符胜 UPPER_SNAKE；`Contraindication.pharmacistReviewed` 类型层强制（§11.3）

### Batch 3（进行中）— contraindications + bakeCnDri
产物：
- `src/lib/db/contraindications.ts` — 50 条禁忌（22 KB，3 red + 47 yellow，全部 `pharmacistReviewed:false`）
  - 导出 `CONTRAINDICATIONS` 数组 + `CONTRAINDICATION_BY_PAIR` O(1) Map + `CONTRAINDICATION_BY_REASON_CODE` Map
  - Substance 8-kind 全部使用到（supplement/drug/drugClass/condition/gene/specialGroup/usageTiming/usageStrategy）
- `scripts/raw/cn-dri-manual.json`（30 条，中国营养学会 DRI 数值，DRAFT）
- `scripts/bakeCnDri.ts` → `src/lib/db/cn-dri-values.ts`（6.5 KB / 23 entries，md5 幂等已验证：a7bf4f4282021453a5bb9f7307bc24e5）

### L2 SafetyJudgment 能力层（本批次 TDD 闭环）
产物：
- `src/lib/types/adapter.ts` — `SafetyAdapter` / `LookupRequest` / `LookupResponse` 契约
- `src/lib/adapters/hardcodedAdapter.ts` — 消费 `CONTRAINDICATION_BY_PAIR`，A 侧 × B 侧枚举匹配
- `src/lib/adapters/suppaiAdapter.ts` — P0 空桩 + `partialData:true`（等 bakeSuppai）
- `src/lib/adapters/ddinterAdapter.ts` — P0 永久空桩 + `partialData:false`（P1 激活）
- `src/lib/capabilities/safetyJudgment/riskLevelMerger.ts` — `pickOverallLevel` + `mergeRisks`（level 优先、同级别 sourceType 优先、同源去重、异源进 `conflictingSources`）
- `src/lib/capabilities/safetyJudgment/judgmentEngine.ts` — `judge(sessionId, req)` 并发 3 路 → merge → 未命中 ingredient 补 gray(no_data) → pickOverallLevel → 聚合 partialData
- 测试（严格 TDD / §13.1）：11 + 8 + 12 + 10 + 6 = **47/47 green**

### Batch 3（续）— bakePubchem + bakeSuppai ✅
产物：
- `scripts/raw/pubchem-forms.json` — 31 条手工 (ingredientId, formNameEn, formNameZh)
- `scripts/bakePubchem.ts` → `src/lib/db/pubchem-cids.ts`（10.3 KB，全 null — PubChem DNS 被 VPN 屏蔽；产物结构 OK，待 SV 部署后重跑填 CID）
- `scripts/raw/suppai-cui-probe.mjs` — 一次性探测 29 成分 → SUPP.AI CUI（自动 + 评分打分）
- `scripts/raw/suppai-ingredient-map.json` — 27 成分（vitamin-d / calcium / iron / zinc 4 条手工覆盖；纯元素 CUI 在 SUPP.AI 无 interaction 页，改用最相近 supplement 形式）
- `scripts/bakeSuppai.ts` — 修复 2 个 CDN 坑：(1) `Accept-Encoding: identity` 拿完整 SSR HTML（默认 gzip 返空壳）；(2) 分页 1-indexed（`?p=0` 是 SPA 路由壳）+ 加 `MIN_EVIDENCE=3` 过滤（CLAUDE.md §9.3 坑 4 v2.3）
- `src/lib/db/suppai-interactions.ts` — 最终 **1349 条 / 735.6 KB**（8070 pair → 5243 有证据 → evidence≥3 过 → 1349）

### CLAUDE.md v2.2 → v2.3（阈值合理化）
触发：bakeSuppai 首轮产出 2854 KB / 5243 entries，违反 §6.3（单文件 <1.5 MB）+ §9.3 坑 4（>5000 pair）。
用户质疑"阈值设置合理吗？为啥需要这个阈值"，授权"按照你的建议修改不合理阈值"。
改动：
- §9.3 坑 4 从"白名单 top-50 成分 × top-100 药"改为 3 条可验证规则：
  1. `evidenceCount >= 3`（长尾 ic=1~2 pair 临床意义弱，一刀砍）
  2. 单 TS 文件 < 1.5 MB（§6.3 既有规则，现显式绑定到坑 4）
  3. 每个 `src/lib/db/*.ts` 首行 `import 'server-only';`（防 client bundle 泄漏）
- 原 v2.1 白名单标记"废除"（planning-time 硬估值无法在运行时验证）
- §9.3 坑 5（5 MB 总包阈值）加注：来源于 SV 2C4G RAM 预算，非拍脑袋
- §19 v2.3 change log 补齐

同步改动：
- `src/lib/db/{contraindications,cn-dri-values,pubchem-cids,suppai-interactions}.ts` — 全加 `import 'server-only';`
- `scripts/{bakeCnDri,bakePubchem,bakeSuppai}.ts` — 生成器模板加 `import 'server-only';`
- `vitest.config.ts` + `tests/stubs/server-only.ts` — alias 打桩（测试环境跳过 runtime guard，生产由 Next.js build 时真守卫）
- `scripts/filterSuppaiOneShot.mjs` — 一次性脚本：按 `evidenceCount >= 3` 过滤现有产物，避免重跑 100 min fetch

验证：
- 47/47 tests green（加 server-only alias 后测试恢复）
- `npm run typecheck` 0 error
- `src/lib/db/` 总体积 780 KB，最大文件 suppai-interactions.ts = 735 KB（<1.5 MB 阈值 ✓）

### 知识库方案外包 ChatGPT（已审，OK）
产物 `gpt烘焙方案.md`：30 成分 + 50 禁忌 + SUPP.AI 1500 条 + 8 个 bake 脚本伪码 + Minimax prompt。
对照 §9.3 八坑 / §11 十红线 / 8 份 types → 整体合格。4 个决策点已拍板（见下方决策日志）。

### 二次扩展 types（因方案审而起）
- `interaction.ts`：`SubstanceKind` 5 → 8（+drugClass/usageTiming/usageStrategy）
- `interaction.ts`：`Contraindication.reviewerCredential` 新增 + `ReviewerCredential` 枚举（5 值）

### 文档共识回填（CLAUDE.md v2 → v2.1 + 3 份 spec）
- `CLAUDE.md` v2.1：§5 加 bakePubchem.ts；§6.2 加 bake:pubchem；§9.3 坑 6 OCR 阈值 0.7；§9.3 坑 7+§10.4+§11.7 中间件扩 6 层（DemoBanner ∥ Disclaimer）；§11 红线 10→11（新增 §11.11 DemoBanner）；§15.2 红色底线 30→50 条；§18 v2.1 change log
- `compliance-design.md`：Components 加 DemoBannerInjector + AuditLogger 字段扩展；Data Flow 加 5a/5b；Testing 加场景 8/9
- `safety-judgment-design.md`：RuleRegistry 描述改 50 条 + 8 类 Substance 用例对照表
- `demo-acceptance-checklist.md`：11 条 → 12 条（+1 条 Demo Banner 验收）；必保 6 → 7

---

## ⏳ 未完成（Wave 2 候选）

- **L3 SafetyTranslation LLM Adapter**（从 openclaw 抽取 chat + vision，待用户给 openclaw 路径）
- **suppaiAdapter 激活**（当前 `partialData:true` 空桩，1349 条 suppai-interactions 已就位，消费即可闭环）
- **API 路由**：`app/api/{query-intake,safety-judgment,safety-translation,archive-recheck}/route.ts`
- **UI 页面**：`app/{query,intake,result,archive,recheck}/page.tsx`（3 个组件已就位，页面壳还没写）
- **bakeNih + bakePubchem CID 填充**：本地 VPN 劫持无解，推迟到 SV 部署后在服务器重跑
- **bakeDsld / bakeTga / bakeJp / bakeBluehat**：🟡🟢 层，D7+ 再说

---

## 👉 下一步

**状态**：Wave 1 全部交付 + 推到 github `vitame-dev-v0.1`。方向三选（待用户拍板）：
- **A**：L3 翻译层 — 用户给 openclaw 路径后从中抽 LLM Adapter，接上已就位的 `templates.ts` 兜底
- **B**：L2 数据闭环 — 激活 `suppaiAdapter.partialData=false`（消费 1349 条）+ 补测试
- **C**：Wave 2 外包 — 主 CC 再拆一批 TASK 给 Gemini/Codex 并行跑（候选：API 路由 / bakeDsld / ingredients.ts NIH 段在 SV 跑好后的合并脚本 / 5 个 UI 页面壳）

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

- **2026-04-20（D3, 晚, Git 重建 + GitHub 推送）** — 用户删项目历史资料时把 `.git` 一起删了；重新 `git init` + 单 commit + 推 `vitame-dev-v0.1` 到 `dianotic` (Dianotic-ai/VitaMe)。不动 GitHub main，让 main 作为项目 pivot 前的历史留档
- **2026-04-20（D3, 晚, 外包两轮验收）** — Wave 1 五个 TASK 全部两轮验收完成（TASK-3 走了三轮，Zod `.min(1)` schema 规划时漏读，让 Gemini 在 R1/R2 多走一轮）；外包 brief 必须前置读 `validate-raw.ts` 校验规则 + 主仓 tsconfig 严格规则，写入 brief 才不会合仓失败
- **2026-04-20（D3, 晚, 共享配置先读再动）** — TASK-2 合流程 CC 根据 brief "应加 bake:lpi" 提议改 package.json，实际 `scripts` 段早已有该条；新增 feedback 记忆 `feedback_verify_before_propose.md`：package.json / tsconfig / CLAUDE.md 等改动前必 Read/Grep 现状
- **2026-04-20（D3, 晚, Wave 1 外包模式验证）** — Gemini CLI（raw 数据 / 文本密集型）+ Codex CLI（代码生成）+ 主 CC（orchestrator）三机分工跑通；原计划 MINIMAX_API_KEY 烘焙 NIH/LPI → 改用 Gemini 直接手录 LPI（绕过 VPN）+ Codex 写 bake 脚本，链路更短
- **2026-04-19（D2, 深夜, 阈值合理化）** — CLAUDE.md v2.2→v2.3：§9.3 坑 4 从 top-50×top-100 白名单改 3 条可验证规则（evidence≥3 + <1.5 MB + `server-only`）。bakeSuppai 从 2854 KB 缩到 735 KB
- **2026-04-19（D2, 夜间, SUPP.AI 纯元素 CUI 回退）** — calcium/iron/zinc 纯元素 CUI 在 SUPP.AI 返 404，改用 supplement 形式（Calcium Carbonate / Iron Dietary / Zinc Cation）
- **2026-04-19（D2, 夜间, SUPP.AI CDN 坑）** — (1) gzip 返 33KB SPA 壳 → `Accept-Encoding: identity`；(2) `?p=0` 是 SPA 路由壳 → 分页 1-indexed
- **2026-04-19（D2, L2 跑绿）** — Tier 3 严格 TDD 闭环：adapter 契约 → 3 路 adapter → merger → engine，47/47 tests green
- **2026-04-19（D2, LLM Adapter 来源）** — 用户指示"从 open claw 代码中提取"，待用户给 openclaw 路径后启动 L3
- **2026-04-19（D2, 用户授权）** — 本地可逆命令（install/build/test/bake/typecheck）CC 直接跑；远端/共享状态操作仍需先问
- **更早的决策**已归档至 `docs/session-state-history.md`

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
