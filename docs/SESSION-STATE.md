# VitaMe P0 — Session State Ledger

> **Operational state file** — "where are we right now" 的单一事实源。
> CC 在每个新会话（或压缩重启）之后的**第一件事**是读本文件，再执行用户请求。
> 每完成一个 batch、换方向、或做关键决策后**必须更新本文件**。

---

## 最后更新
**2026-04-19（D2 / 12，深夜）** — bakeSuppai ✅ 完成（8070 pair → 5243 有证据条目 → evidence≥3 过滤后 **1349 条 / 735.6 KB**）；CLAUDE.md 升 **v2.3**：§9.3 坑 4 阈值改为 evidence≥3 + 单 TS <1.5 MB + `import 'server-only'` 三条可验证规则（原 top-50×top-100 白名单废除）；db 全部文件加 `server-only` 守卫，vitest alias 打桩避免 runtime guard 影响测试；47/47 tests green + typecheck 0 error

## 当前 Sprint 阶段
**Phase 0 — 工程基建 + 数据烘焙前置**

- Sprint: 12 天 P0（2026-04-18 → 2026-04-29）
- 初赛截止: 2026-04-30（WAIC 超级个体黑客松）

---

## ✅ 刚完成

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

## ⏳ 未完成

### Batch 3 — L1/L2 数据烘焙（本会话接下来做）
顺序：bakeNih → bakeLpi → bakeCnDri → bakePubchem → bakeSuppai → contraindications.ts（手写）→ bakeDsld。
产出落到 `src/lib/db/*.ts`，每个文件每个 export 必须有非空 `sourceRefs`（§9.3 坑 2）。

### Batch 4+ — 能力层 + API + UI
受 Batch 3 阻塞。

---

## 👉 下一步（本会话 / 压缩后续会话）

**状态**：L2 判断层闭环跑绿（47/47）+ bakeSuppai ✅ + CLAUDE.md v2.3 阈值合理化完成。下一批方向可选：
- **A**：激活 `suppaiAdapter.partialData=false`（消费 1349 条 suppai-interactions + 补 L2 测试）
- **B**：bakeLpi（lpi.oregonstate.edu 可达 226KB）+ 手工 `ingredients.ts` 落 30 成分骨架（不依赖 NIH VPN）
- **C**：L3 SafetyTranslation（LLM Adapter 从 openclaw 抽取）+ 合规 6 层 — 待用户给 openclaw 路径

### Batch 3 —  烘焙（ChatGPT §6 风险排序）
1. ~~`contraindications.ts`（非 bake，50 条）~~ ✅ 本会话
2. ~~`bakeCnDri.ts` → `cn-dri-values.ts`（23 条）~~ ✅ 本会话
3. `bakeNih.ts` → `src/lib/db/ingredients.ts`（~30 成分，NIH ODS 深度段）⏳ 需 MINIMAX_API_KEY
4. `bakeLpi.ts` → 合并到 ingredients.ts（LPI 补充段）⏳ 需 MINIMAX_API_KEY
5. ~~`bakePubchem.ts` → `src/lib/db/pubchem-cids.ts`~~ ✅（结构 OK，CID 全 null，SV 重跑填充）
6. ~~`bakeSuppai.ts` → `src/lib/db/suppai-interactions.ts`~~ ✅ 1349 条 / 735.6 KB（evidence≥3 过滤）
7. `bakeDsld.ts` → `src/lib/db/dsld-ingredients.ts`（top-500 字典化）⏳ D1 验证后
8. `bakeTga.ts` / `bakeJp.ts` / `bakeBluehat.ts` — D7+ 🟡🟢 层

## 📌 待用户确认

- **LLM Adapter 来源**：用户提到"llm Adapter 的逻辑从 open claw 代码中提取即可"。
  - 需确认：openclaw 代码在哪个路径/仓库？是本机已有项目还是要从某个地址拉？
  - 用途：L3 SafetyTranslation 的 LLM 调用（factory 支持 minimax / deepseek / openclaw 三家）
- **方向选择**：A（继续烘焙）vs B（切 L3 翻译层）vs 其它。

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

- **2026-04-19（D2, 深夜, 阈值合理化）** — CLAUDE.md v2.2→v2.3：§9.3 坑 4 从 top-50×top-100 白名单（planning-time 估值、不可运行时验证）改为 3 条可验证规则（evidence≥3 + <1.5 MB + `server-only`）。bakeSuppai 产出从 2854 KB 缩到 735 KB；用 `filterSuppaiOneShot.mjs` 避免 100 min 重跑
- **2026-04-19（D2, 深夜, server-only 守卫）** — 所有 `src/lib/db/*.ts` 首行 `import 'server-only';` 阻止 client bundle 泄漏；vitest 用 alias 打桩到空模块（Next.js build 时仍由真包守卫）
- **2026-04-19（D2, 夜间, SUPP.AI 纯元素 CUI 回退）** — calcium (C0006675) / iron (C0302583) / zinc (C0043481) 纯元素 CUI 在 SUPP.AI 返 404，通过 search API 评分改用 supplement 形式：Calcium Carbonate (C0006681) / Iron Dietary (C0376520) / Zinc Cation (C2346521)
- **2026-04-19（D2, 夜间, 烘焙策略）** — NIH/PubChem VPN 阻塞无解，推迟到 SV 部署重跑；本地先推 suppai + lpi（两者均可达）。SUPP.AI 纯元素 CUI 无 interaction 页，改用探测评分最高的 supplement 形式（calcium → Calcium Carbonate；iron → Iron, Dietary；zinc → Zinc Cation）
- **2026-04-19（D2, 夜间, SUPP.AI CDN 坑）** — 两个独立坑：(1) gzip 返 33KB SPA 壳，必须 `Accept-Encoding: identity` 才拿完整 SSR；(2) `?p=0` 被 CDN 当 SPA 路由缓存，分页必须 1-indexed
- **2026-04-19（D2, L2 跑绿）** — 先做 contraindications + cn-dri（无外部依赖），然后用 Tier 3 严格 TDD 闭环 L2：adapter 契约 → 3 路 adapter → merger → engine，47/47 tests green + typecheck 0 error
- **2026-04-19（D2, 烘焙顺序调整）** — ChatGPT 把 contraindications 放 #6，CC 前置到 #1（零外部依赖 + Demo 价值最高）；bakeNih/Lpi/Suppai 推迟到 MINIMAX_API_KEY 到位
- **2026-04-19（D2, LLM Adapter 来源）** — 用户指示"从 open claw 代码中提取"，CC 待用户给出 openclaw 代码路径后再启动 L3 翻译层
- **2026-04-19（D2, Batch 1 跑绿）** — 脚手架 8 文件 + 占位 UI 3 文件全写完；install/typecheck/build 三连通过
- **2026-04-19（D2, 用户授权）** — 本地可逆命令（install/build/test/bake/typecheck）CC 直接跑，无需逐条确认；远端/共享状态操作仍需先问（存入 feedback memory）
- **更早的决策**已归档至 `docs/session-state-history.md`（含方案审后 5 条、文档回填、UI 延后、Superpowers 精简装、产品 pivot 等）

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
