---
title: "VitaMe P0 Implementation Plan"
description: "补剂安全翻译 Agent P0 MVP 的工程落地执行计划:Bite-Sized Tasks + TDD + 完整文件路径。"
doc_type: "plan"
status: "active"
created: "2026-04-18"
updated: "2026-04-22"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "p0-plan"]
---

# VitaMe P0 Implementation Plan

> **📌 2026-04-19（D2 晚）进度回填**：Batch 1 脚手架 + Batch 2 类型契约 + Batch 3 部分烘焙 + L2 判断层全部跑绿。标记说明：✅ 已完成 / ⏳ 进行中 / 🚫 阻塞 / 💀 已删除或合并 / 无标记 = 未开始。路径变更见下方「路径修正总表」。
>
> **📌 2026-04-22（D5）架构升级**：v2.8 引入 L0 Query Intake 层（取代 v2 关键词 4 题固定问答）+ L2 grading 语义对齐（no-data → gray、known + no-rule → green）+ 时间目标 30s → 60s + 症状→成分推荐作为 P0 例外（带二次安全核查）。新增任务簇：Phase 1.5 (L0 意图层 ~10 task)、Phase 2.5 (L2 grading fix ~3 task)、Phase 3.5 (L0 意图层 UI ~3 task)。预估额外工作量 35–43h / 5–6 天。详见 §"v2.8 任务簇" 与 `docs/CLAUDE.md-changelog.md`。

## 路径修正总表（实际代码与原 plan 不一致处）

| 原 plan 路径 | 实际落地路径 | 原因 |
|---|---|---|
| `src/types/*.ts` | `src/lib/types/*.ts` | CLAUDE.md §5 胜，types 归 lib |
| `src/lib/judgment/*.ts` | `src/lib/capabilities/safetyJudgment/*.ts` | CLAUDE.md §3.1 L2 约定 capabilities 分层 |
| `src/lib/query/*.ts` | `src/lib/capabilities/queryIntake/*.ts` | 同上（未开始，预记） |
| `src/lib/translation/*.ts` | `src/lib/capabilities/safetyTranslation/*.ts` | 同上（未开始，预记） |
| `src/lib/compliance/*.ts` | `src/lib/capabilities/compliance/*.ts` | 同上（未开始，预记） |
| `scripts/bakeNihFactSheets.ts` | `scripts/bakeNih.ts` | CLAUDE.md §5 标准名 |
| `scripts/raw/` 不提交 | `scripts/raw/*.json` + `*.mjs` 提交 | 手工策划数据需可审计 |

## Goal

把 5 份 design(QueryIntake / SafetyJudgment / SafetyTranslation / ArchiveRecheck / Compliance)落地为一个可在 Next.js 14 H5 上跑的 MVP,Demo 中能对 20 条种子问题给出正确的红黄灰绿判定 + 可懂的原因翻译 + 风险规避建议 + 家人档案复查。跑通后即可作为 WAIC 黑客松 Demo 演示。

## Architecture

```
[用户 H5 浏览器]
    │
    ▼
[Next.js 14 App Router (SSR + CSR)]
    │
    ├── POST /api/query          → QueryIntake   (ocrAdapter[多模态,可选] → InputNormalizer[DSLD字典] → ProductMatcher → IntakeOrchestrator)
    ├── POST /api/query/context  → QueryIntake   (ContextCollector)
    ├── POST /api/judgment       → SafetyJudgment (hardcodedAdapter ∥ suppaiAdapter ∥ ddinterAdapter[P0 空/P1 落地] → RiskLevelMerger)
    ├── POST /api/translation    → SafetyTranslation (PromptBuilder → LlmAdapter[Minimax/DeepSeek/openclaw 三选一] → GuardrailFilter → TemplateFallback)
    └── POST /api/archive/save   → ArchiveRecheck (SaveFlow → ArchiveStore[LocalStorage via Zustand persist])
         │
         ▼
    每层输出 → [Compliance middleware]
         (EvidenceAnnotator → BannedPhraseFilter → CriticalEscalation → DisclaimerInjector → AuditLogger)
         │
         ▼
    结构化 JSON 响应 → 前端渲染
```

## Tech Stack

- **Framework**:Next.js 14.2(App Router)+ TypeScript 5 + React 18
- **State**:Zustand 4(含 persist middleware,持久化到 LocalStorage)
- **Validation**:Zod 3(API schema + LLM response schema)
- **Styling**:Tailwind CSS 3
- **Testing**:Vitest 1(unit)+ Playwright 1(E2E 跑 20 条种子问题)
- **LLM Adapter**(借鉴 openclaw-gateway 模式,config 驱动切换,支持文本 + 多模态):
  - `LlmProvider` interface(chat) + `MultimodalProvider` interface(vision,for OCR)
  - Providers:**Minimax**(默认;chat + vision)/ **DeepSeek**(备选;chat only) / **openclaw-gateway**(本机,复用 770MB RSS;chat only)
  - Factory `getLlmProvider()` + `getMultimodalProvider()` switch `process.env.LLM_PROVIDER ∈ {minimax,deepseek,openclaw}`
  - 设计意图:代码不改,改 env 即切;vision 固定走 Minimax;Minimax quota 不足或网络抖动时热切 openclaw-gateway(仅 chat)
- **Data(离线烘焙 8 源 + 1 手工)**:
  - L1 呈现层字典:**NIH ODS Fact Sheets**(30 成分深度) + **Linus Pauling Institute**(40 篇补强) + **中国营养学会 DRIs**(dri.cn 关键值) + **PubChem/ChEBI**(化学形式映射)→ 全部合并进 `src/lib/db/ingredients.ts`
  - L2 判断层报警器:**SUPP.AI**(补剂×药物 5.9w 筛 ~1500) + **DDInter**(药×药 ~500,P1 加分) + **50 条硬编码禁忌**(病史×成分,手工 + 药剂师审核)
  - L3 适配层翻译器:**DSLD Top 500 成分字典**(非产品库,~50KB) + **澳洲 TGA ARTG**(Swisse/Blackmores Top 200) + **日本機能性表示食品**(DHC/FANCL Top 150) + **蓝帽子 Top 30 国产品**(手录,P1 加分)
  - 产物总体积预估 < 5MB,**运行时不联网**,Compliance 层 `source_ref` 可追溯至源
- **OCR(Minimax 多模态)**:场景 A 拍照瓶子 → `src/lib/adapters/ocrAdapter.ts` → 结构化成分输出 → InputNormalizer 查 DSLD 字典做英文标准化 → 进入 SafetyJudgment
- **Deploy**:硅谷云(2 核 / 4G / 30Mbps / Ubuntu)+ 域名 vitame.live(海外,不走 ICP)
  - Next.js SSR(available 2.0GB 内存足够),pm2 `--max-old-space-size=1280`
  - Nginx 反向代理(443/80,Let's Encrypt HTTPS)+ Cloudflare 免费层 CDN 前置
  - pm2 Node 进程守护 + systemd 开机启动
  - 部署前置:`/dev/vda2` 当前 94% 满(53/59G),部署前清 3-5GB
  - 本地 build + rsync 到硅谷云(不在服务器上 npm install)
- **Access**:微信 WebView 打开 https://vitame.live
- **Audit log**:本地 JSONL 文件(P0 够用)

## Scope Check

**In scope**:
- 5 个 capability 的 MVP 实现(对应 5 份 design)
- 20 条种子问题 E2E 全部跑通(对应 PRD §9 FR-1~FR-7)
- 合规红线全达标(CLAUDE.md + PRD §10 + §11)
- 90 秒 Demo 录屏

**Out of scope**(对应 PRD §11 八条"不做" + 额外工程边界):
- 账号体系、多设备同步
- 中成药全量覆盖
- 体检 OCR
- 家庭多成员协作
- 电商导购 / CPS 佣金
- 长期打卡 / 每日陪伴
- 疾病诊断 / 泛症状问诊
- 泛生活方式方案

## File Structure

```
vitame-p0/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── .env.local                          # LLM_PROVIDER, MINIMAX_API_KEY, MINIMAX_VISION_ENDPOINT, ...
├── scripts/
│   ├── bakeNihFactSheets.ts             # NIH ODS 30 篇 → ingredients.ts
│   ├── bakeLpi.ts                       # Linus Pauling 40 篇 → 合并进 ingredients.ts
│   ├── bakeCnDri.ts                     # 中国 DRIs 关键值 → 合并进 ingredients.ts
│   ├── bakePubchem.ts                   # PubChem/ChEBI 化学形式 → 合并进 ingredients.ts
│   ├── bakeDsld.ts                      # DSLD Top 500 成分字典 → dsld-ingredients.ts
│   ├── bakeSuppai.ts                    # SUPP.AI 5.9w 筛 ~1500 → suppai-interactions.ts
│   ├── bakeTga.ts                       # TGA Swisse/Blackmores Top 200 → tga-products.ts
│   ├── bakeKinoseihyouji.ts             # 日本機能性 DHC/FANCL Top 150 → japan-products.ts
│   ├── bakeBluehat.ts                   # 蓝帽子 Top 30 国产品手录(P1)
│   ├── bakeDdinter.ts                   # DDInter 药×药 ~500(P1)
│   ├── bakeAll.ts                       # orchestrator + 体积门槛检查(< 5MB)
│   └── raw/                             # 原始数据(不提交 git)
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # 全局 layout + disclaimer footer
│   │   ├── page.tsx                    # 首页 (QueryInput)
│   │   ├── globals.css
│   │   ├── results/
│   │   │   └── page.tsx                # 结果页 (RiskCard + SaveToArchive)
│   │   ├── archive/
│   │   │   └── page.tsx                # 档案页 (Person 列表 + 新增一项)
│   │   └── api/
│   │       ├── query/route.ts
│   │       ├── query/context/route.ts
│   │       ├── judgment/route.ts
│   │       ├── translation/route.ts
│   │       └── archive/save/route.ts
│   ├── components/
│   │   ├── QueryInput.tsx
│   │   ├── ContextQuestions.tsx
│   │   ├── RiskCard.tsx
│   │   ├── EvidenceBadge.tsx
│   │   ├── SaveToArchive.tsx
│   │   ├── PersonSelector.tsx
│   │   └── DisclaimerFooter.tsx
│   ├── lib/
│   │   ├── query/
│   │   │   ├── inputNormalizer.ts
│   │   │   ├── productMatcher.ts
│   │   │   ├── intakeOrchestrator.ts
│   │   │   ├── contextCollector.ts
│   │   │   └── querySession.ts
│   │   ├── judgment/
│   │   │   ├── ruleRegistry.ts
│   │   │   ├── judgmentEngine.ts
│   │   │   └── riskLevelMerger.ts
│   │   ├── translation/
│   │   │   ├── llmAdapter.ts
│   │   │   ├── promptBuilder.ts
│   │   │   ├── templateFallback.ts
│   │   │   ├── formComparator.ts
│   │   │   └── guardrailFilter.ts
│   │   ├── archive/
│   │   │   ├── archiveStore.ts
│   │   │   ├── personModel.ts
│   │   │   ├── saveFlow.ts
│   │   │   ├── recheckOrchestrator.ts
│   │   │   └── familyScopeResolver.ts
│   │   ├── compliance/
│   │   │   ├── evidenceAnnotator.ts
│   │   │   ├── disclaimerInjector.ts
│   │   │   ├── bannedPhraseFilter.ts
│   │   │   ├── criticalEscalation.ts
│   │   │   └── auditLogger.ts
│   │   ├── adapters/
│   │   │   ├── hardcodedAdapter.ts    # 查 contraindications.ts
│   │   │   ├── suppaiAdapter.ts       # 查烘焙好的 suppai-interactions.ts
│   │   │   ├── ddinterAdapter.ts      # P0 返回空;P1 查 ddinter-drug-drug.ts
│   │   │   ├── ocrAdapter.ts          # Minimax 多模态 OCR + Zod 校验
│   │   │   └── productLookup.ts       # 串联 DSLD/TGA/JP/CN 4 库(P1 可选)
│   │   └── db/
│   │       ├── ingredients.ts         # NIH+LPI+DRIs+PubChem 合并(30→50 成分)
│   │       ├── contraindications.ts   # 50 条硬编码禁忌(手工 + 药剂师审核)
│   │       ├── suppai-interactions.ts # 烘焙产物 ~1500 条
│   │       ├── ddinter-drug-drug.ts   # 烘焙产物 ~500 条(P1)
│   │       ├── dsld-ingredients.ts    # Top 500 成分标准化字典(~50KB)
│   │       ├── tga-products.ts        # 澳洲 Swisse/Blackmores ~200
│   │       ├── japan-products.ts      # 日本 DHC/FANCL ~150
│   │       ├── china-products.ts      # 蓝帽子 Top 30 手录(P1)
│   │       ├── formComparator.ts      # 镁 4 形式 / 鱼油 EPA·DHA / 维D D2·D3
│   │       └── bannedPhrases.ts       # 禁词表
│   └── types/
│       ├── query.ts
│       ├── risk.ts
│       ├── person.ts
│       ├── archive.ts
│       ├── ingredient.ts              # Ingredient/IngredientForm/DRIReference contract
│       ├── interaction.ts             # Interaction contract
│       ├── product.ts                 # Product contract
│       └── sourceRef.ts               # SourceRef contract(NIH_ODS/SUPP_AI/...)
├── tests/
│   ├── unit/
│   │   ├── inputNormalizer.test.ts
│   │   ├── productMatcher.test.ts
│   │   ├── intakeOrchestrator.test.ts
│   │   ├── ruleRegistry.test.ts
│   │   ├── riskLevelMerger.test.ts
│   │   ├── judgmentEngine.test.ts
│   │   ├── promptBuilder.test.ts
│   │   ├── templateFallback.test.ts
│   │   ├── guardrailFilter.test.ts
│   │   ├── llmAdapter.test.ts
│   │   ├── ocrAdapter.test.ts
│   │   ├── db-baked.test.ts            # 8 库各抽 3 条断言
│   │   ├── archiveStore.test.ts
│   │   ├── personModel.test.ts
│   │   ├── saveFlow.test.ts
│   │   ├── recheckOrchestrator.test.ts
│   │   ├── evidenceAnnotator.test.ts
│   │   ├── bannedPhraseFilter.test.ts
│   │   └── criticalEscalation.test.ts
│   └── e2e/
│       ├── seed-questions.spec.ts     # 20 条种子问题端到端
│       └── compliance-audit.spec.ts   # 合规红线审计
└── public/
```

## Bite-Sized Tasks

规则:每条任务 2–5 分钟可完成;`- [ ]` 可勾选;禁用 TBD/TODO 占位;必须给完整文件路径;TDD 红绿重构:功能任务前必有测试任务;依赖用 `(depends on T-X.Y)` 标注。

### Phase 0:工程基建

- [x] ✅ **T-0.1** 创建 `package.json`,依赖锁:`next@14.2.15 react@18.3.1 typescript zod@3.23.8 tailwindcss@3.4.14 vitest@2.1.3 @playwright/test@1.48.0 tsx@4.19.1 cheerio@1.0.0 ...`（552 包，10 条 deprecated 警告仅 dev 依赖）
- [x] ✅ **T-0.2** 创建 `tsconfig.json`,strict=true + noUncheckedIndexedAccess,`paths: { "@/*": ["./src/*"] }`
- [x] ✅ **T-0.3** 创建 `next.config.mjs`(reactStrictMode + SSR)
- [x] ✅ **T-0.4** 创建 `tailwind.config.ts`,content 指向 `src/**/*.{ts,tsx}`,4 risk token 对齐 DESIGN.md §2.1
- [x] ✅ **T-0.5** 创建 `postcss.config.mjs`
- [x] ✅ **T-0.6** 创建 `vitest.config.ts`,test include node env default
- [x] ✅ **T-0.7** 创建 `playwright.config.ts`,chromium only
- [x] ✅ **T-0.8** 创建 `.env.local.example`,`NEXT_PUBLIC_DEMO_MODE=1` 默认开（CLAUDE.md §11.11）
- [x] ✅ **T-0.9** 创建 `src/app/globals.css`
- [x] ✅ **T-0.10** 创建 `src/app/layout.tsx`(占位，跑通 build)
- [x] ✅ **T-0.11** 创建 `src/lib/types/query.ts`（**路径修正**：plan 原写 `src/types/`）
- [x] ✅ **T-0.12** 创建 `src/lib/types/risk.ts`（路径修正同上）
- [x] ✅ **T-0.13** 创建 `src/lib/types/person.ts`（路径修正同上）
- [x] ✅ **T-0.14** 创建 `src/lib/types/archive.ts`（路径修正同上）
- [ ] ⏳ **T-0.15** 创建 `src/lib/db/ingredients.ts`:30 条标准成分 — **未完成**。bakeNih 被 VPN DNS 劫持屏蔽（§9 路径见 VPN 阻塞说明），需 LPI 脚本补或手工 curate
- [x] ✅ **T-0.16** 创建 `src/lib/db/contraindications.ts`:**50 条**硬编码禁忌（22 KB，3 red + 47 yellow，全部 `pharmacistReviewed:false` → DemoBanner 常亮）
- [ ] **T-0.17** 创建 `src/lib/db/formComparator.ts`
- [ ] **T-0.18** 创建 `src/lib/db/bannedPhrases.ts`
- [x] ~~**T-0.19** cacheLayer.ts~~(**已砍**:同原文)
- [x] ~~**T-0.20** cacheLayer.test.ts~~(**已砍**:同原文)
- [ ] **T-0.21** 创建 `src/components/DisclaimerFooter.tsx`

### Phase 0（续）— Batch 2 新加项（types 一等公民扩展）

- [x] ✅ **T-0.34** `src/lib/types/ingredient.ts`（D2 新增 `IngredientForm.pubchemCid` 字段）
- [x] ✅ **T-0.35** `src/lib/types/interaction.ts` — **D2 方案审后扩展**：`SubstanceKind` 5→8（+drugClass / usageTiming / usageStrategy）；`Contraindication.reviewerCredential` + `ReviewerCredential` 枚举 5 值
- [x] ✅ **T-0.36** `src/lib/types/product.ts`
- [x] ✅ **T-0.37** `src/lib/types/sourceRef.ts` — `SourceOrigin` 取**小写-连字符**（CLAUDE.md §12.2 胜过 plan 的 UPPER_SNAKE）

#### Phase 0 新增 — 数据烘焙(本轮锁定补丁)

- [ ] 🚫 **T-0.22** 写 `scripts/bakeNih.ts`（**脚本名修正**：原 `bakeNihFactSheets.ts`；CLAUDE.md §5 为准）— **本地 VPN 阻塞**，`*.nih.gov` DNS 被劫持到 fake-IP 198.18.0.0/15，推迟 SV 部署后重跑（D9）
- [ ] ⏳ **T-0.23** 写 `scripts/bakeLpi.ts` — LPI 可达（lpi.oregonstate.edu 返 226KB HTML 正常），未启动，可本地推
- [x] ✅ **T-0.24** 写 `scripts/bakeCnDri.ts` → `src/lib/db/cn-dri-values.ts`（6.6 KB / **23 条**，md5 幂等验证 `a7bf4f4282021453a5bb9f7307bc24e5`）
- [x] ⚠️ **T-0.25** 写 `scripts/bakePubchem.ts` → `src/lib/db/pubchem-cids.ts`（10.3 KB / 31 条，**全 null CID** — PubChem DNS 被 VPN 屏蔽；产物结构 OK，待 SV 重跑填真 CID）
- [ ] **T-0.26** 写 `scripts/bakeDsld.ts`
- [x] ⏳ **T-0.27** 写 `scripts/bakeSuppai.ts` → `src/lib/db/suppai-interactions.ts` — **D2 晚运行中**，8070 唯一 pair detail-fetch 进行中（ETA ~30 min）。产物：27 成分（见 `scripts/raw/suppai-ingredient-map.json`）× ~1500 drug 配对
  - 📌 两个 CDN 坑已修（见 CLAUDE.md §19 如已加）：(1) `Accept-Encoding: identity` 拿完整 SSR HTML，(2) 分页必须 1-indexed（`?p=0` 是 SPA 路由壳）
  - 📌 3 条纯元素 CUI 映射已改：calcium C0006675→C0006681（Calcium Carbonate）/ iron C0302583→C0376520（Iron, Dietary）/ zinc C0043481→C2346521（Zinc Cation）
- [ ] **T-0.28** 写 `scripts/bakeTga.ts`
- [ ] **T-0.29** 写 `scripts/bakeKinoseihyouji.ts`
- [ ] **T-0.30** 写 `scripts/bakeBluehat.ts`(**P1 加分**)
- [ ] **T-0.31** 写 `scripts/bakeDdinter.ts`(**P1 加分**)
- [ ] **T-0.32** 写 `scripts/bakeAll.ts`
- [ ] **T-0.33** 写测试 `tests/unit/db-baked.test.ts`

#### Phase 0（续）— Batch 3 新增（未列入原 plan）

- [x] ✅ **T-0.38** `scripts/raw/cn-dri-manual.json`（30 条中国营养学会 DRI 数值手录，供 bakeCnDri 消费）
- [x] ✅ **T-0.39** `scripts/raw/pubchem-forms.json`（31 条 `(ingredientId, formNameEn, formNameZh)` 手工策划清单）
- [x] ✅ **T-0.40** `scripts/raw/suppai-cui-probe.mjs` + `scripts/raw/suppai-ingredient-map.json`（27 成分 → SUPP.AI CUI 映射，4 条手工覆盖）

#### Phase 0 新增 — 类型契约(跨层统一)

> 📌 T-0.34~0.37 已在 Batch 2 小节完成（见上方「Phase 0（续）— Batch 2 新加项」），此处保留编号占位。

### Phase 1:QueryIntake(对应 design 1)

- [ ] **T-1.1** 写测试 `tests/unit/inputNormalizer.test.ts`:测试 "鱼油+维 D+镁" 拆成 3 个 token,"Doctor's Best 镁片" 识别为产品,"华法林" 识别为药物
- [ ] **T-1.2** 实现 `src/lib/query/inputNormalizer.ts`(通过 T-1.1)。**新增职能**:查 `dsld-ingredients.ts` 做英文成分标准化(如 "Magnesium Bisglycinate" / "Chelated Magnesium" / "Mg Glycinate" → `magnesium.glycinate`)。原 T-2.8 dsld adapter 职能并入此(depends on T-0.11, T-0.26)
- [ ] **T-1.3** 写测试 `tests/unit/productMatcher.test.ts`:"Doctor's Best 镁片" → `{name:"镁", form:"氧化镁"}`,"ons d3k2" 低置信度返回候选
- [ ] **T-1.4** 实现 `src/lib/query/productMatcher.ts`(通过 T-1.3)(depends on T-0.15, T-1.2)
- [ ] **T-1.5** 写测试 `tests/unit/intakeOrchestrator.test.ts`:Q10 场景(7 补剂)返回 4 问;Q5 场景(含肝炎/apoe4)追问肝功/凝血;Q7 场景(胃溃疡+镁)返回 2 问
- [ ] **T-1.6** 实现 `src/lib/query/intakeOrchestrator.ts`(通过 T-1.5)(depends on T-1.4)
- [ ] **T-1.7** 写测试 `tests/unit/contextCollector.test.ts`:答案聚合为 `{medications, conditions, allergies, special_groups}`
- [ ] **T-1.8** 实现 `src/lib/query/contextCollector.ts`(通过 T-1.7)
- [ ] **T-1.9** 实现 `src/lib/query/querySession.ts`(内存 Map + TTL 30min)
- [ ] **T-1.10** 实现 `src/app/api/query/route.ts`:`POST` 入参 `{input, personRef?}`,返回 `{sessionId, matches, questions} | {needs_disambiguation, candidates}`(depends on T-1.2, T-1.4, T-1.6, T-1.9)
- [ ] **T-1.11** 实现 `src/app/api/query/context/route.ts`:`POST {sessionId, answers}` → `{sessionId, ready:true}`(depends on T-1.8, T-1.9)
- [ ] **T-1.12** 实现 `src/components/QueryInput.tsx`(含 textarea + 提交 + loading 状态 + **新增拍照按钮** tabs:文字输入 / 拍照输入;拍照 tab 含 `<input type="file" accept="image/*" capture="environment">` + 图片 base64 编码上传)
- [ ] **T-1.13** 实现 `src/components/ContextQuestions.tsx`(渲染 2–4 个问题 + 提交)
- [ ] **T-1.14** 实现 `src/app/page.tsx`:渲染 `<QueryInput />`,含 Hero 标题"买补剂前,先查它适不适合你的体质"

#### Phase 1 新增 — OCR(场景 A 拍照输入,Demo 主场景)

- [ ] **T-1.15** 写测试 `tests/unit/ocrAdapter.test.ts`(mock Minimax fetch):正常返回结构化 JSON / 低置信度兜底 / 超时降级 / 非补剂图片拒识
- [ ] **T-1.16** 实现 `src/lib/adapters/ocrAdapter.ts`:调 Minimax 多模态 + OCR Prompt 模板(见 `数据接入与实现方案.md` §4.3) + Zod schema 校验 `{brand, product_name, country_guess, ingredients[], confidence, unreadable_parts[]}` + 低置信度/失败时返回 `{fallback: "manual_input"}`(depends on T-3.8c)
- [ ] **T-1.17** 更新 `/api/query/route.ts`:入参扩展 `{input?, imageBase64?, personRef?}`;若 imageBase64 → 先走 ocrAdapter 拿 ingredients,再走 inputNormalizer 标准化
- [ ] **T-1.18** 在 `src/app/page.tsx` 增加 OCR 成功后显示识别卡片(brand + product_name + ingredients 列表 + 低置信度时的"手动补正"编辑入口)

### Phase 1.5:L0 Query Intent（v2.8 新增 — 取代 v2 关键词 4 题固定问答）

> 对应 spec：`docs/superpowers/specs/2026-04-18-vitame-query-intake-design.md` v3。CLAUDE.md §10.0 + §11.13 约束。

- [ ] **T-1.5.1** 写测试 `tests/unit/queryIntake/parseIntent.spec.ts`：覆盖 7 intent 各 1 case + Zod `.strict()` 拒绝额外字段（level/safe/dangerous）+ 超时降级走 parseIntentFallback + LLM 输出残缺时 missingSlots 正确填充
- [ ] **T-1.5.2** 实现 `src/lib/capabilities/queryIntake/parseIntent.ts`：调 `LLMClient` (Anthropic Messages 协议) + `IntentResultSchema.strict()` 校验；失败 → `parseIntentFallback`。**禁止**输出 risk level 字段（红线 §11.13）(depends on T-1.5.1)
- [ ] **T-1.5.3** 实现 `src/lib/capabilities/queryIntake/parseIntentFallback.ts`：3 条固定文案（"我没听懂" / "请补充背景" / "我们暂不支持这类问题"）+ 固定 `intent='unclear'` + 空 mentions
- [ ] **T-1.5.4** 写测试 `tests/unit/queryIntake/groundMentions.spec.ts`：别名命中 (Coq10 → coenzyme_q10) + 模糊命中 (CoQ → 候选列表) + 全 miss → 不新建 slug
- [ ] **T-1.5.5** 实现 `src/lib/capabilities/queryIntake/groundMentions.ts`：纯确定性，查 L1 alias 字典 + Levenshtein < 2 模糊；不调 LLM(depends on T-1.5.4)
- [ ] **T-1.5.6** 写测试 `tests/unit/queryIntake/slotResolver.spec.ts`：4 个 clarify topic 决策表（缺成分 / 缺人群 / 缺当前服药 / 多 ingredient 优先级）+ 已满足时返回 `clarifyNeeded:false`
- [ ] **T-1.5.7** 实现 `src/lib/capabilities/queryIntake/slotResolver.ts`：业务规则决定 WHEN/WHAT clarify；choices 由本组件提供（≤4），LLM 只 phrase（depends on T-1.5.6）
- [ ] **T-1.5.8** 实现 `src/lib/capabilities/queryIntake/clarifyOrchestrator.ts`：编排 parseIntent → groundMentions → slotResolver → clarify 循环（≤2 轮，第 3 轮强制 fallback）
- [ ] **T-1.5.9** 实现 `src/app/api/intent/route.ts`：`POST {text, sessionId}` → `IntentResult | ClarifyPrompt | FallbackForm`(depends on T-1.5.8)
- [ ] **T-1.5.10** 写 P0 4-handler 路由：`product_safety_check` → 接 Phase 2；`symptom_goal_query` → 接 Phase 3.5 候选；`ingredient_translation` → 接 Phase 3 翻译；`unclear` → IntentFallbackForm。其他 3 intent → "礼貌告知不支持"

### Phase 2:SafetyJudgment(对应 design 2) — **L2 核心闭环 ✅ 47/47 TDD green**

- [x] 💀 **T-2.1** ~~ruleRegistry.test.ts~~ — **已合并**：hardcodedAdapter 直接查 `CONTRAINDICATION_BY_PAIR` Map，无需单独建 registry 层（见 `src/lib/adapters/hardcodedAdapter.ts` 11 tests）
- [x] 💀 **T-2.2** ~~`src/lib/judgment/ruleRegistry.ts`~~ — **已合并到 hardcodedAdapter**（同上）
- [x] ✅ **T-2.3** 写测试 `tests/unit/riskLevelMerger.test.ts`（**路径实际**：`src/lib/capabilities/safetyJudgment/__tests__/riskLevelMerger.test.ts`，12 tests green）
- [x] ✅ **T-2.4** 实现 `src/lib/capabilities/safetyJudgment/riskLevelMerger.ts`（路径修正：原 `src/lib/judgment/`）
  - 导出 `pickOverallLevel`（red > yellow > gray > green）+ `mergeRisks`（level 优先、同级 sourceType 优先、同源去重、异源进 `conflictingSources`）
- [ ] **T-2.5** 写测试 `tests/unit/suppaiAdapter.test.ts` — **等 bakeSuppai 产出后启动**
- [x] ⏳ **T-2.6** 实现 `src/lib/adapters/suppaiAdapter.ts`:**当前为空桩**（`partialData: true`），等 bakeSuppai 产物落地后填实（in-progress 中）
- [x] ✅ **T-2.7** 实现 `src/lib/adapters/ddinterAdapter.ts`:**P0 永久空桩** + `partialData: false`（P1 再启用，8 tests green）
- [x] 💀 **T-2.8** ~~dsld adapter~~ **已删除**（见原文说明）
- [x] ✅ **T-2.9** 写测试 `tests/unit/judgmentEngine.test.ts`（6 tests green，覆盖 merge / 补 gray / partialData 聚合 / 并发）
- [x] ✅ **T-2.9b** 实现 `src/lib/adapters/hardcodedAdapter.ts`:消费 `CONTRAINDICATION_BY_PAIR`，A/B 双侧枚举匹配，`sourceName='VITAME_HARDCODED'`（11 tests green）
- [x] ✅ **T-2.10** 实现 `src/lib/capabilities/safetyJudgment/judgmentEngine.ts`（路径修正）:3 路并发 adapter → mergeRisks → 未命中 ingredient 补 `gray(no_data)` → `pickOverallLevel` → 聚合 `partialData`
- [ ] **T-2.11** 实现 `src/app/api/judgment/route.ts` — 未开始，等 Phase 1 `sessionId` 契约就位

- [x] ✅ **新增 T-2.0** 定义 `src/lib/types/adapter.ts`:`SafetyAdapter` / `LookupRequest` / `LookupResponse` 契约（plan 原未单列，TDD 过程中发现需要）

### Phase 2.5:L2 grading 语义 root fix（v2.8 新增 — CLAUDE.md §10.2）

> **修 buggy 语义**：现 `judgmentEngine.ts:17-31` 把"未在 KB 命中"和"已知但无规则"都填灰，违反 §10.2。

- [ ] **T-2.5.1** 写测试 `tests/unit/safetyJudgment/knowledgeBaseLookup.spec.ts`：覆盖 4 库（ingredients / cn-dri / lpi / pubchem）任一命中 → true，全 miss → false
- [ ] **T-2.5.2** 实现 `src/lib/capabilities/safetyJudgment/knowledgeBaseLookup.ts`：导出 `isInKnowledgeBase(slug: string): boolean`，OR 查 4 个 L1 数据源(depends on T-2.5.1)
- [ ] **T-2.5.3** 写测试 `tests/unit/safetyJudgment/judgmentEngine.spec.ts`（增量）：场景 5a 冷成分 → gray (`coverage_gap`) / 场景 5b 已收录 + 无 context → green (`no_known_risk`) / 场景 5c 已收录 + condition + 无 rule → green
- [ ] **T-2.5.4** 重构 `judgmentEngine.ts`：拆 `buildNoDataRisk` → `buildNoDataRisk` + `buildNoKnownRiskRisk`；line 44-48 逻辑改为查 `isInKnowledgeBase` 决定填 gray 或 green(depends on T-2.5.2, T-2.5.3)

### Phase 3.5:症状 → 成分推荐（v2.8 P0 例外 — CLAUDE.md §11.14）

> 解锁 `intent === 'symptom_goal_query'` handler。要求带显式 disclaimer + 用户必须二次点击触发 `product_safety_check`。

- [ ] **T-3.5.1** 写 `scripts/raw/symptom-ingredients-manual.json`：~30 条 `(symptomZh, candidateIngredientSlug[], evidenceNote)` 手工策划清单
- [ ] **T-3.5.2** 写 `scripts/bakeSymptomIngredients.ts` → `src/lib/db/symptom-ingredients.ts`（🟡 档，超 5MB 时砍）
- [ ] **T-3.5.3** 写测试 `tests/unit/queryIntake/symptomCandidates.spec.ts`：「想睡好」→ 镁/褪黑素/L-茶氨酸 候选 + 每条带 sourceRefs
- [ ] **T-3.5.4** 实现 `src/lib/capabilities/queryIntake/symptomCandidates.ts`：消费 `symptom-ingredients.ts`，输出 ≤5 条候选(depends on T-3.5.2, T-3.5.3)

### Phase 3.6:L0 意图层 UI 组件（v2.8 — DESIGN.md §4.7-4.9）

- [ ] **T-3.6.1** 实现 `src/components/ClarifyBubble.tsx`：DESIGN §4.7 — choice button + "其他" 入口 + "为什么问？" 注脚
- [ ] **T-3.6.2** 实现 `src/components/IntentFallbackForm.tsx`：DESIGN §4.8 — 3 条引导例句 + 输入框
- [ ] **T-3.6.3** 实现 `src/components/SymptomCandidateList.tsx`：DESIGN §4.9 — 候选卡片 + 二次安全核查入口（必带 §11.14 disclaimer）

### Phase 3:SafetyTranslation + Compliance(对应 design 3, 5)

- [ ] **T-3.1** 实现 `src/lib/translation/formComparator.ts`:封装 `FORM_DATA` 查询接口(depends on T-0.17)
- [ ] **T-3.2** 写测试 `tests/unit/promptBuilder.test.ts`:输入 Risk + formData → prompt 含角色 / schema / 禁止输出列表
- [ ] **T-3.3** 实现 `src/lib/translation/promptBuilder.ts`(通过 T-3.2)(depends on T-3.1)
- [ ] **T-3.4** 写测试 `tests/unit/templateFallback.test.ts`:每个 `reason_code` 返回非空 `{translation, avoidance}`
- [ ] **T-3.5** 实现 `src/lib/translation/templateFallback.ts`(覆盖所有 50 条硬编码规则的 `reason_code`)(depends on T-0.16)
- [ ] **T-3.6** 写测试 `tests/unit/guardrailFilter.test.ts`:"治疗" → "辅助";"根治" → reject;不命中不动
- [ ] **T-3.7** 实现 `src/lib/translation/guardrailFilter.ts`(通过 T-3.6)(depends on T-0.18)
- [ ] **T-3.8a** 写 `src/lib/translation/llmProvider.ts`:定义 `LlmProvider` interface(`chat(messages, options) → Promise<string>`)+ `MultimodalProvider` interface(`vision(imageBase64, prompt, options) → Promise<string>`)+ `LlmOptions`(timeout/response_format/temperature)+ `ChatMessage`(role/content)
- [ ] **T-3.8b** 写 3 个 chat provider:
  - `src/lib/translation/providers/minimaxProvider.ts`:**默认**,OpenAI-compat 端点或 `@minimax/sdk`,实现 `LlmProvider` + `MultimodalProvider`
  - `src/lib/translation/providers/deepseekProvider.ts`:备选,OpenAI-compat 换 baseURL/apiKey,仅 `LlmProvider`
  - `src/lib/translation/providers/openclawGatewayProvider.ts`:走硅谷云本机 `http://127.0.0.1:<port>/v1/chat`,仅 `LlmProvider`
- [ ] **T-3.8c** 在 `minimaxProvider.ts` 里实现 `vision(imageBase64, prompt, options)`:调 Minimax 多模态端点;返回结构化 JSON string;供 ocrAdapter(T-1.16)使用
- [ ] **T-3.8d** 写 `src/lib/translation/llmAdapter.ts`:factory `getLlmProvider()` + `getMultimodalProvider()` switch `process.env.LLM_PROVIDER ∈ {minimax,deepseek,openclaw}`,unknown 抛错;vision 固定返回 Minimax
- [ ] **T-3.9** 写测试 `tests/unit/llmAdapter.test.ts`(mock fetch):
  - 每个 chat provider 单测(正常 / 超时 / JSON 解析失败)
  - Minimax vision 单测(正常 / 低置信度)
  - factory 单测覆盖 3 种 env + unknown 抛错路径 + vision 固定 Minimax
- [ ] **T-3.10** 写测试 `tests/unit/evidenceAnnotator.test.ts`:hardcoded rule → `source_type="hardcoded"`;缺源 → `source_type="limited"`
- [ ] **T-3.11** 实现 `src/lib/compliance/evidenceAnnotator.ts`(通过 T-3.10)
- [ ] **T-3.12** 实现 `src/lib/compliance/disclaimerInjector.ts`:注入固定 disclaimer + pregnancy 强化版
- [ ] **T-3.13** 写测试 `tests/unit/bannedPhraseFilter.test.ts`:替换成功;替换不了则 reject
- [ ] **T-3.14** 实现 `src/lib/compliance/bannedPhraseFilter.ts`(通过 T-3.13)(depends on T-0.18)
- [ ] **T-3.15** 写测试 `tests/unit/criticalEscalation.test.ts`:pregnancy 触发;red level 触发;华法林触发
- [ ] **T-3.16** 实现 `src/lib/compliance/criticalEscalation.ts`(通过 T-3.15)
- [ ] **T-3.17** 实现 `src/lib/compliance/auditLogger.ts`:写 JSONL 到 `./logs/audit.jsonl`,异步 append,失败降级到 console.error
- [ ] **T-3.18** 实现 `src/app/api/translation/route.ts`:`POST {sessionId, risks}` → 跑 translation + compliance → 返回 `{translatedRisks, critical_warning?, disclaimer}`(depends on T-3.3, T-3.5, T-3.7, T-3.8d, T-3.11, T-3.12, T-3.14, T-3.16, T-3.17)
- [ ] **T-3.19** 实现 `src/components/EvidenceBadge.tsx`(含 source_type 徽章 + confidence 标识)
- [ ] **T-3.20** 实现 `src/components/RiskCard.tsx`(色块 + ingredient + 原因翻译 + 规避建议 + `<EvidenceBadge />` + critical_warning 顶部横幅)
- [ ] **T-3.21** 实现 `src/app/results/page.tsx`:串起 QueryInput → ContextQuestions → judgment → translation → 渲染 `<RiskCard />` 列表 + `<SaveToArchive />`

### Phase 4:ArchiveRecheck(对应 design 4)

- [ ] **T-4.1** 写测试 `tests/unit/personModel.test.ts`:建 Person "妈妈" → id 生成 + 合并 conditions 去重
- [ ] **T-4.2** 实现 `src/lib/archive/personModel.ts`(通过 T-4.1)(depends on T-0.13)
- [ ] **T-4.3** 写测试 `tests/unit/archiveStore.test.ts`:save/get/list + persist 到 LocalStorage(mock window)
- [ ] **T-4.4** 实现 `src/lib/archive/archiveStore.ts`:Zustand + persist middleware(depends on T-0.14, T-4.2)
- [ ] **T-4.5** 写测试 `tests/unit/saveFlow.test.ts`:首次保存新建 Person;二次保存合并
- [ ] **T-4.6** 实现 `src/lib/archive/saveFlow.ts`(通过 T-4.5)(depends on T-4.4)
- [ ] **T-4.7** 实现 `src/lib/archive/familyScopeResolver.ts`:"我妈/爸/老人" 关键词 → `parent`(含单元测试)
- [ ] **T-4.8** 写测试 `tests/unit/recheckOrchestrator.test.ts`:Q5 场景新增钙片 → 跳过"有无肝病"问题 + 自动附 context(**Day 7 / P1** 标注:若紧张可 Demo 手动演示档案沉淀)
- [ ] **T-4.9** 实现 `src/lib/archive/recheckOrchestrator.ts`(通过 T-4.8)(depends on T-4.4, T-1.6)(**Day 7 / P1**)
- [ ] **T-4.10** 实现 `src/app/api/archive/save/route.ts`:`POST {personId|newPerson, sessionId, risks}`(depends on T-4.6)
- [ ] **T-4.11** 实现 `src/components/PersonSelector.tsx`(下拉 self / 已有 Person / 建新 Person)
- [ ] **T-4.12** 实现 `src/components/SaveToArchive.tsx`(含 `<PersonSelector />` + 保存按钮 + 成功提示)
- [ ] **T-4.13** 实现 `src/app/archive/page.tsx`:展示全部 Person 卡片 + 每个 Person 下的 "新增一项" 按钮(点击跳首页,带 personRef)

### Phase 5:验收

- [ ] **T-5.1** 写 `tests/e2e/seed-questions.spec.ts`:对 20 条种子问题逐条跑 E2E(浏览器自动化 → 输入 → 答问题 → 拿到结果),断言 `overallLevel` + `reason_code` 关键词 + critical_hit 分布(符合种子清单里的色级分布:红 1 / 黄 11 / 绿 2 / 灰 4 / N/A 3)
- [ ] **T-5.2** 写 `tests/e2e/compliance-audit.spec.ts`:跑 10 条对抗性查询(输入含"治疗我的病""诊断我的症状""推荐药品"),断言 GuardrailFilter 全部拦住,AuditLogger `banned_hit=true` 日志齐备
- [ ] **T-5.3** 录 90s Demo(推荐组合 1,来自种子清单路径 A):Q5 老人肝病+apoe4+鱼油 → 结果页黄色 + 原因"肝炎活动期需评估 + apoe4 DHA 代谢差异" + 规避"优先 EPA:DHA≥2:1 鱼油 1g/天起 3 个月复查" → 保存到妈妈档案 → 新增钙片 → 复查结果

## 12 天时间表(PM × 工程并行,含 5 收敛门 + 3 档 scope)

### 角色分工

| 角色 | PM(Sunny) | 工程(合伙人) |
|---|---|---|
| 核心职责 | L1 知识整理 + 合规审核 + Demo 脚本 + 找药剂师 | L2/L3 工程实现 + LLM Adapter + 部署 |
| 工具 | Claude + 手工录入 + 审校 | Claude Code + 终端 |
| 关键交付 | ingredients.ts + contraindications.ts + Demo 脚本 | 6 个 API + UI + OCR + 部署 |

### 日历(2026-04-18 → 2026-04-30)

| 日期 | 天 | PM | 工程 | 合并里程碑 |
|---|---|---|---|---|
| **4-18 周六** | D1 | 下载 DSLD dump + SUPP.AI CSV,各抽 20 条验证结构;**今天起联系药剂师** | 硅谷云清盘 + 核对资源 + T-0.1~0.9 基建 | ✅ D1 数据验证门过；基建 T-0.1~10 + Batch 2 八份 types 合并完成 |
| **4-19 周日** | D2 | 跑 bakeNih + bakeLpi + 审核 | T-0.10~0.17 基建收尾 + LlmAdapter + MultimodalProvider | ⚠️ **D2 L1 落地门未达**：NIH/PubChem VPN 阻塞 → ingredients.ts 空；但 contraindications.ts 50 + cn-dri × 23 + pubchem(form 结构) + L2 全链 47/47 green + bakeSuppai 运行中（提前消化 D3 工作） |
| **4-20 周一** | D3 | bakeCnDri + bakePubchem + contraindications 50 条初稿 | bakeDsld(字典版) + bakeSuppai + 3 路 adapter | D3 末:L2/L1 db 全落地 — **建议调整**：改为 bakeLpi 本地跑 + 手工补 ingredients.ts 20~30 条骨架 + 启动 LLM Adapter（等用户给 openclaw 路径） |
| **4-21 周二** | D4 | contraindications 审校 + 开始 Demo 脚本 | Query Intake + **OCR 联调**(Minimax 多模态) | D4 末:L3 入口通 |
| **4-22 周三** | D5 | **v2.8 决策回填 8 文档**（CLAUDE/spec/DESIGN/plan/acceptance/SESSION-STATE/changelog） | Phase 1.5 T-1.5.1~5（parseIntent + groundMentions TDD） + Phase 2.5 T-2.5.1~4（L2 grading fix） | **🚪 D5 决策门**：v2.8 文档 + L2 grading green |
| **4-23 周四** | D6 | symptom-ingredients 手工清单 + 20 条种子复跑（适配 v2.8） | Phase 1.5 T-1.5.6~10（slotResolver + clarify + /api/intent） + Phase 3.5 T-3.5.1~4（症状候选） | **🚪 D6 L0 主链路门**：text → intent → ground → clarify → handler |
| **4-24 周五** | D7 | Demo 脚本（v2.8 流程） + UI 验收 | Phase 3.6 UI（ClarifyBubble + IntentFallbackForm + SymptomCandidateList）+ SafetyTranslation + Compliance 5 层 | **🚪 D7 翻译门 + 完整闭环**（保底档 + L0 完成） |
| **4-25 周六** | D8 | 20 条再跑 + Demo 视觉优化 | UI 打磨 + 性能优化(端到端 <10s) | D8 末:亮点档完成,Demo 可拍 |
| **4-26 周日** | D9 | Demo 90s 视频初版 | 硅谷云部署 + vitame.live 上线 | **🚪 D9 部署门**(生产可访问) |
| **4-27 周一** | D10 | Demo 视频打磨 + PPT | 微信 WebView 真机测试 + bug 修 | D10 末:Demo 就绪 |
| **4-28 周二** | D11 | WAIC 报名材料提交 | 回归测试 + 补强(加分档) | D11 末:材料递交 |
| **4-29 周三** | D12 | 浮时(突发问题) | 浮时 | 应急缓冲 |
| **4-30 周四** | — | **初赛截止日** | — | **交付** |

### 5 个收敛门(不过不往下走)

| 门 | 日期 | 标准 | 不过怎么办 |
|---|---|---|---|
| 🚪 D1 数据验证 | D1 晚 | DSLD + SUPP.AI 结构符合预期 | 立即砍国际(TGA/JP),只做美国 |
| 🚪 D2 L1 落地 | D2 晚 | ingredients.ts 含 30+ 成分完整字段 | 砍到保底档 |
| 🚪 D5 决策（v2.8） | D5 晚 | 8 文档锁定 + Phase 2.5 L2 grading 全 green | 退回 v2.7 关键词路径，但保留 L2 fix |
| 🚪 D6 L0 主链路 | D6 晚 | text → intent → ground → clarify → handler 跑通 | 砍 symptom_goal_query handler，只保留 product_safety_check + unclear |
| 🚪 D7 翻译 | D7 晚 | LLM 能稳定产出结构化 JSON | 切 Template Fallback,不用 LLM |
| 🚪 D9 部署 | D9 晚 | vitame.live 能访问 | 切本地 Demo,录制视频代替 |

### 3 档 scope(按信心度分)

| 档 | 必做(D7 前) | 增强(D7-D9) | 应急可砍 |
|---|---|---|---|
| 🔴 **保底** | ingredients.ts(30 成分)+ contraindications.ts(50 条)+ suppai-interactions.ts + **L0 意图层（v2.8 — parseIntent + groundMentions + slotResolver + clarify, 4 handler）** + **L2 grading fix（v2.8 KnowledgeBaseLookup）** + 文字输入 + SafetyJudgment + SafetyTranslation + DemoBanner + Disclaimer + 部署 | | |
| 🟡 **亮点** | + **OCR 拍照**(Minimax 多模态)+ ingredients.ts 扩到 50 成分 + dsld-ingredients.ts 字典 + Archive & Recheck + LPI/TGA/JP + **symptom-ingredients.ts（v2.8 P0 例外，§11.14）** | | |
| 🟢 **加分** | | + 蓝帽子 + DDInter + 复查页动效 | 国际产品库 / DDInter / 蓝帽子 / symptom-ingredients |

**口诀**:**D7 保保底,D9 要亮点,D11 冲加分**。任何一档卡住,往上退一档,不死磕。

## 找药剂师审核清单(4-18 启动,合规底线)

**问题**:合规最后一环需持证人类审核 50 条 contraindications。

**今天(4-18)就要做**:

1. LinkedIn 搜"临床营养师 / 执业药师",发消息:"Demo 审 50 条禁忌,3-5 小时工作量,可付费 ¥500-1000"
2. 小红书私信"临床营养师"话题博主,同话术
3. 朋友圈发"寻找执业药师为黑客松 Demo 背书"
4. **Demo 当天若仍未找到**:UI 强制标注"**本 Demo 为原型展示,禁忌数据未经临床审核,不构成医疗建议**"——底线兜底

**合规配套**:Compliance 5 层中间件(Evidence → Banned → Critical → Disclaimer → Audit)顺序不可乱,任一跳过 = 违规上线(见 T-5.2 compliance-audit E2E 断言)。

## Verification

- Phase 0 验证:`npm install` 成功 + `npm run dev` 启动不报错 + 类型通过
- Phase 1 验证:`POST /api/query {input:"鱼油+维D+镁+益生菌+维B+维C+D3"}` 返回 7 个 matches + 4 个问题
- Phase 2 验证:`POST /api/judgment` 对 Q4 场景返回 `overallLevel: "red"`
- Phase 3 验证:`POST /api/translation` 对 Q7 场景返回包含"甘氨酸镁"的 avoidance + disclaimer 必出
- Phase 4 验证:在浏览器里保存"妈妈"档案 → 新增钙片 → 复查不重复问既有病史
- Phase 5 验证:20 条种子问题 E2E 通过率 100% + compliance-audit 通过

## Risk fallback matrix (triggers → degraded plan)

> 从 `CLAUDE.md` §16 拆过来。是 plan-time 的"如果某个风险触发，就退到这个降级方案"清单，不是 action-time 的硬规则。

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

## Dependencies Summary

```
T-0.x (基建)
  ↓
T-1.x (Query Intake) → T-2.x (Safety Judgment) → T-3.x (Translation + Compliance) → T-5.x (验收)
                                                      ↓
                                             T-4.x (Archive & Recheck,可与 T-3 并行)
```

外部依赖:
- **Minimax API key + Vision endpoint**(默认 LLM provider;chat + 多模态 OCR 必需)
- **DeepSeek API key**(可空,仅作 chat fallback)
- **openclaw-gateway URL**(可空,硅谷云本机复用;仅作 chat fallback)
- **原始数据源**(一次性下载,不进运行时):DSLD JSON dump / SUPP.AI CSV / NIH ODS HTML / LPI HTML / PubChem / TGA ARTG / 日本消费者厅 Excel / 中国 DRIs 关键值
- **运行时无外部 API 依赖**(Compliance `source_ref` 由烘焙产物提供)
- **海外域名 vitame.live**(仅部署阶段需要,不影响开发)
- **硅谷云主机**(2 核 4G 30Mbps,Ubuntu,已跑 openclaw + Hermes)
