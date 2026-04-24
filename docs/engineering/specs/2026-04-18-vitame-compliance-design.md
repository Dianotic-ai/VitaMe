---
title: "VitaMe P0 Design — Compliance"
description: "补剂安全翻译 Agent 的合规横切层:证据透明、免责声明、禁词过滤、关键升级。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-19"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "compliance"]
---

# VitaMe P0 Design — Compliance

## Architecture

Compliance 不是一个独立 pipeline stage,而是**贯穿 SafetyJudgment 与 SafetyTranslation 所有输出的横切层**。每条 Risk / Translation 在离开后端之前必须依序走:
1. `EvidenceAnnotator`(FR-5 证据透明)
2. `BannedPhraseFilter`(CLAUDE.md §11.2 红线:禁词)
3. `CriticalEscalation`(严重异常 → 强就医提示)
4a. `DemoBannerInjector`(CLAUDE.md §11.11 红线:未过审硬编码规则命中时挂原型免责)
4b. `DisclaimerInjector`(PRD §10 非功能:每次输出强制免责)
5. `AuditLogger`(可审计 — 必须包含 DemoBanner 字段,CLAUDE.md §11.10)

**第 4 层为并列双注入器**:`DemoBannerInjector` 与 `DisclaimerInjector` 互不依赖,可任意顺序执行,但两者都必须执行。

设计依据:
- **CLAUDE.md 红线**(硬约束):不诊断 / 不出医疗结论 / 每次输出必须有免责 / 严重异常硬编码就医 / 禁忌规则硬编码 / 措辞避免"治疗/治愈/药效"
- **PRD §10 合规**:不用"治疗/治愈/处方"类表述;免责声明每次输出展示
- **PRD §11 §13 风险 2**:产品不能被误解为医疗诊断工具

Compliance 层是产品能落地的底座。工程上是 Express-style middleware 模式,任何一层被跳过就等于违规上线,所以实现必须在测试中有 E2E 审计断言(见 Plan T-5.2)。

## Components

- **EvidenceAnnotator** (`src/lib/compliance/evidenceAnnotator.ts`):为每条 Risk 附加 `evidence: { source_type: "hardcoded"|"database"|"literature"|"limited", source_ref: string, confidence: "high"|"medium"|"low" }`。缺源时 `source_type = "limited"`,前端 UI 必须显示"有限证据"标签。
- **DisclaimerInjector** (`src/lib/compliance/disclaimerInjector.ts`):向每个 API 响应对象末尾注入 `disclaimer: string` 字段。文案固定:"VitaMe 提供补剂安全信息和决策辅助,不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况,请及时咨询医生。"
- **DemoBannerInjector** (`src/lib/compliance/demoBannerInjector.ts`) — **D2 新增**。扫描 `translatedRisks[]` 中所有命中规则:若任一规则对应的 `Contraindication` 满足任一条件 — (a) `pharmacistReviewed !== true`, (b) `reviewerCredential === 'self-review'`, (c) `reviewerCredential === undefined` — 则在响应对象顶层注入 `demoBanner: { show: true, text: "本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。" }`。判定依据为 `src/lib/types/interaction.ts` 中 `ReviewerCredential` 枚举(5 值)。Banner 不占用 `CriticalWarning` 语义槽(后者专用于医疗紧急升级,§11.3)。P0 阶段 50 条硬编码规则初始 `pharmacistReviewed: false`,故**所有 P0 Demo 响应默认挂 Banner**,这是预期行为而非 Bug。
- **BannedPhraseFilter** (`src/lib/compliance/bannedPhraseFilter.ts`):禁词列表硬编码:`["治疗","治愈","疗效","药效","处方","诊断","特效","根治"]`。扫描 Risk.reason / translation / avoidance 文本,优先替换("治疗"→"辅助","治愈"→"改善","药效"→"作用"),若替换后语义破坏,reject 该字段并走 TemplateFallback。
- **CriticalEscalation** (`src/lib/compliance/criticalEscalation.ts`):硬编码触发条件:(1) 任一 Risk `level = red`,(2) `special_groups` 包含 `["pregnancy","lactation"]`,(3) `medications` 包含强风险类("华法林"、"免疫抑制剂"、"化疗药"),(4) `conditions` 包含急症提示("胸痛"、"出血"、"昏迷前兆")。命中则注入 `critical_warning: { show: true, text: "建议立即咨询医生或药师" }` + 强化版 disclaimer。
- **AuditLogger** (`src/lib/compliance/auditLogger.ts`):每次输出写 log `{ timestamp, query_hash, overallLevel, banned_hit: boolean, critical_hit: boolean, demo_banner_hit: boolean, unreviewed_rule_ids: string[], source_distribution }`。P0 写到服务端日志文件(jsonl),不打用户 PII。`demo_banner_hit` 与 `unreviewed_rule_ids` 为 D2 新增字段,保证 Banner 注入全流程可审计(§11.10)。

## Data Flow

每次 `/api/judgment` 或 `/api/translation` 响应前:

1. 接收 `{ risks | translatedRisks, querySession }`
2. `EvidenceAnnotator.annotate(risks)` → 每条 risk 附 `evidence`
3. `BannedPhraseFilter.scan(allTextFields)` → 清洗文本;命中 reject 的字段替换成 fallback
4. `CriticalEscalation.check(querySession, risks)` → 若触发,附加 `critical_warning`
5a. `DemoBannerInjector.check(risks)` → 若命中未过审硬编码规则,附加 `demo_banner`(D2 新增,并列于 5b)
5b. `DisclaimerInjector.inject(responseObject)` → 末尾加 `disclaimer`
6. `AuditLogger.log(responseObject)` → 异步写 log(包含 `demo_banner_hit` / `unreviewed_rule_ids`,不阻塞响应)
7. 返回最终响应对象

> 说明:5a 与 5b 位于同一层级,执行顺序不敏感(两者均读取 risks / 写入独立响应字段,无共享状态)。实现上可 `Promise.all` 并发,也可同步依次调用,但**两者必须都执行**。

## Error Handling

- **BannedPhraseFilter 命中但没有替换词**:整条字段降级为 `TemplateFallback` 输出;audit log 写 warn。
- **Evidence 缺失**:`source_type = "limited"`,前端 UI 必须显示"有限证据"徽章;不能静默填 "high confidence"。
- **CriticalEscalation 误报**(比如用户写"我妈有心脏病"但其实已康复):保留提示,给用户一个"关闭提示"按钮,但 AuditLogger 记录 false_positive 供调校。
- **AuditLogger 写失败**:降级到 `console.error`,不阻塞主流程(合规日志丢失是 P1 修的,不能因日志失败阻塞用户)。
- **DisclaimerInjector 被下游改动**:前端渲染端做最后一道防线——若响应缺 disclaimer 字段,前端注入默认版本并上报。

## Testing

场景 1 — Q18 真实高频场景(孕期 + 维 D,强免责触发):

> "孕期维 D 要和非孕期一样剂量吗?"

- WHEN `querySession.special_groups = ["pregnancy"]`
- AND SafetyJudgment 返回 `overallLevel = "yellow"`
- THEN `CriticalEscalation` 命中 pregnancy 触发
- AND 响应含 `critical_warning: { show: true, text: "孕期补剂必须经产科医生确认" }`
- AND `disclaimer` 末尾追加强化版"孕期/哺乳期/儿童用药请以专科医生为准"
- AND `overallLevel` 仍维持在 yellow(不因 escalation 升到 red)

场景 2 — Q4 红色禁忌触发 escalation:

> "妈妈在吃华法林抗凝,她朋友推荐的辅酶 Q10 能吃吗?"

- WHEN `overallLevel = "red"` AND `medications 包含 "华法林"`
- THEN `CriticalEscalation` 命中两条件:(1) red level + (2) 华法林
- AND `critical_warning.text = "这是高风险组合,请立即咨询医生或药师,不要自行服用"`
- AND 结果页 red 色块上方顶部强化横幅

场景 3 — 证据透明(FR-5):

- WHEN 任一 Risk 返回前端
- THEN `risk.evidence.source_type ∈ {"hardcoded","database","literature","limited"}`
- AND 若 `source_type = "database"`,附 `source_ref = "SUPP.AI:xxx"` 或 `"DDInter:yyy"`
- AND 若 `source_type = "hardcoded"`,附 `source_ref = "VitaMe-rule-<id>"`
- AND `source_type = "limited"` 的 Risk 在 UI 必须显示"有限证据"徽章

场景 4 — 禁词过滤(可替换):

- WHEN LLM 输出 `translation = "维 D 可以治疗骨质疏松"`
- THEN `BannedPhraseFilter` 命中 "治疗"
- AND 替换为 `"维 D 对骨健康有辅助作用"`
- AND `AuditLogger.banned_hit = true` 写 log
- AND 用户不感知替换过程

场景 5 — 禁词过滤(需拒绝 + 降级):

- WHEN LLM 输出 `translation = "这个补剂能根治你的症状"`
- THEN `BannedPhraseFilter` 命中 "根治",且整句核心违规
- AND 该字段被 reject,走 `TemplateFallback`
- AND fallback 文案为预设安全文案
- AND `source = "fallback"`,audit log 写 warn

场景 6 — 免责声明必出(PRD §10):

- WHEN 任一 API 响应
- THEN 响应对象必含 `disclaimer: string`(固定文案)
- AND 前端渲染时 disclaimer 必显示在结果卡片末尾
- AND 即使 SafetyJudgment 降级为 partial_data,disclaimer 照样必出

场景 7 — 审计完整性(合规边界可证明):

- WHEN 跑 20 条种子问题 E2E
- THEN AuditLogger 产生 20 条 log
- AND 每条 log 含 `{ query_hash, overallLevel, banned_hit, critical_hit, demo_banner_hit, unreviewed_rule_ids }`
- AND Q4 / Q18 的 `critical_hit = true`
- AND 至少 1 条含 `banned_hit = true`(由 adversarial 测试集触发)
- AND P0 阶段 **所有** 命中硬编码规则的 log `demo_banner_hit = true`(因 50 条规则初始均 `pharmacistReviewed = false`)

场景 8 — Demo Banner 正确挂出(D2 新增,§11.11):

- WHEN `judge()` 返回的 `translatedRisks[]` 命中任一 `Contraindication`,且该规则 `pharmacistReviewed !== true`
- THEN `DemoBannerInjector` 向响应注入 `demoBanner: { show: true, text: "本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。" }`
- AND `demoBanner` 与 `criticalWarning` 同时存在时,UI 两者均显示(不覆盖)
- AND AuditLogger log 含 `demo_banner_hit = true` + `unreviewed_rule_ids = ['vm-rule-xxx', ...]`
- AND 前端若仅依赖前端 hook 判断(绕过后端注入)→ 视为违反 §11.10,测试失败

场景 9 — 已审规则不挂 Demo Banner:

- WHEN 某条 `Contraindication` 已设置 `pharmacistReviewed = true` + `reviewerCredential = 'licensed-pharmacist'` + `reviewerName = '张某某'` + `reviewedAt = '2026-04-28'`
- AND 仅此一条规则命中
- THEN 响应对象**不含** `demoBanner` 字段(或 `demoBanner.show = false`)
- AND AuditLogger log `demo_banner_hit = false`
- AND 若 `reviewerCredential = 'self-review'`,则 Banner 仍挂(PM 自审不算临床合规)
