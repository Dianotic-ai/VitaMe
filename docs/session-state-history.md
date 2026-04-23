# VitaMe P0 — Session State History（归档）

> 从 `docs/SESSION-STATE.md` 决策日志溢出后的归档。按时间倒序。

---

## 2026-04-21（D4 / Kevin specs × Wave 1 代码跨分支对齐）

**触发**：Kevin 在 `codex/spec-hardening` D3 提交 8 份 P0 specs（api-contract / risk-matrix / context-taxonomy / metrics-instrumentation / test-matrix / 统一执行总纲 等）；与 Wave 1 落代码（`src/lib/types/risk.ts` 等）命名 + 结构冲突。

**3 条命名约定锁定（用户 D4 拍板）**：
1. TS 字段 camelCase / 枚举值字面量 snake_case（例：`reasonCode: 'drug_interaction'`）
2. `disclaimer` 顶层 1 份（`TranslationResult.disclaimer`，非每条 TranslatedRisk）
3. Risk 保留 `ingredient / condition? / medication?` 结构化溯源（不并入 `sourceRefs: string[]`）

**代码侧**（commits on `vitame-dev-v0.1`，已 push dianotic）：
- `4868883` feat(L2)：Risk 加 `RiskDimension` 6 值 + `RiskCta` 5 值 必填；EvidenceSourceType 扩 'none'；JudgmentResult 加 `partialReason?`；新增 `riskDefaults.ts` 共享映射
- `371e16e` fix(L2)：`partialReason` 锁死白名单码（`hardcoded_partial / suppai_partial / ddinter_partial`），不再透 `LookupResponse.error` 诊断串；`riskLevelMerger.mergeBucket` 加 Wave 2 TODO（同 bucket 次值 dimension/cta 暂吞）
- 测试 84/84 green / typecheck 0 error

**文档侧**：
- PR #1 `docs/align-risk-schema` → `codex/spec-hardening`：6 files / 159+/130-，覆盖 Kevin 8 份 specs schema 全部 camelCase 转换 + Risk 结构溯源加回 + Metrics 边界（schema 派生 camelCase / 业内惯例 snake_case）
- `f412170` 推 `docs/2026-04-21-kevin-review-handoff.md` 给 Kevin

**CLAUDE.md v2.3 → v2.4**（D4 晚回填）：§11 红线 11→12（partialReason 白名单契约）；§9.4 checklist 加 Risk dimension/cta；§19 v2.4 行

---

## 2026-04-20（D3, 晚 / Wave 1 外包 + Git 重建）

- **Git 重建 + GitHub 推送** — 用户删项目历史资料时把 `.git` 一起删了；重新 `git init` + 单 commit + 推 `vitame-dev-v0.1` 到 `dianotic` (Dianotic-ai/VitaMe)。不动 GitHub main，让 main 作为项目 pivot 前的历史留档
- **外包两轮验收** — Wave 1 五个 TASK 全部两轮验收完成（TASK-3 走了三轮，Zod `.min(1)` schema 规划时漏读，让 Gemini 在 R1/R2 多走一轮）；外包 brief 必须前置读 `validate-raw.ts` 校验规则 + 主仓 tsconfig 严格规则，写入 brief 才不会合仓失败
- **共享配置先读再动** — TASK-2 合流程 CC 根据 brief "应加 bake:lpi" 提议改 package.json，实际 `scripts` 段早已有该条；新增 feedback 记忆 `feedback_verify_before_propose.md`：package.json / tsconfig / CLAUDE.md 等改动前必 Read/Grep 现状
- **Wave 1 外包模式验证** — Gemini CLI（raw 数据 / 文本密集型）+ Codex CLI（代码生成）+ 主 CC（orchestrator）三机分工跑通；原计划 MINIMAX_API_KEY 烘焙 NIH/LPI → 改用 Gemini 直接手录 LPI（绕过 VPN）+ Codex 写 bake 脚本，链路更短

## 2026-04-19（D2, 深夜 / 阈值 + SUPP.AI 坑）

- **阈值合理化** — CLAUDE.md v2.2→v2.3：§9.3 坑 4 从 top-50×top-100 白名单改 3 条可验证规则（evidence≥3 + <1.5 MB + `server-only`）。bakeSuppai 从 2854 KB 缩到 735 KB
- **SUPP.AI 纯元素 CUI 回退** — calcium/iron/zinc 纯元素 CUI 在 SUPP.AI 返 404，改用 supplement 形式（Calcium Carbonate / Iron Dietary / Zinc Cation）
- **SUPP.AI CDN 坑** — (1) gzip 返 33KB SPA 壳 → `Accept-Encoding: identity`；(2) `?p=0` 是 SPA 路由壳 → 分页 1-indexed
- **L2 跑绿** — Tier 3 严格 TDD 闭环：adapter 契约 → 3 路 adapter → merger → engine，47/47 tests green
- **LLM Adapter 来源** — 用户指示"从 open claw 代码中提取"，待用户给 openclaw 路径后启动 L3
- **用户授权** — 本地可逆命令（install/build/test/bake/typecheck）CC 直接跑；远端/共享状态操作仍需先问

## 2026-04-19（D2, 方案审后 / 基建期）

- **方案审后（批）**：
  - 不砍规则：30 成分 + 50 禁忌全上（红色底线由 30 条 rebaseline 到 50 条）
  - `SubstanceKind` 从 5 扩到 8：加 `drugClass` / `usageTiming` / `usageStrategy`（对齐方案 §2 slug 语义）
  - `Contraindication` 加 `reviewerCredential`（资质）；Demo Banner 判定 = pharmacistReviewed && credential !== self-review
  - 新建 `DemoBannerInjector` middleware（插 Disclaimer 并列，走 audit 不绕过 §11.10）
  - bake 脚本命名以 CLAUDE.md §5 为准（`bakeNih.ts` 非 `bakeNihFactSheets.ts`），新增 `bakePubchem.ts` 待回填 §5
- **文档回填**：CLAUDE.md 升 v2.1；3 份 spec 同步共识（compliance / safety-judgment / demo-acceptance）
- **建立 SESSION-STATE.md 机制**，避免跨会话压缩丢进度
- **Batch 2 优先于 Batch 1**（types 先行为 ChatGPT 规划解锁约束）
- **UI 延后**到最后做（用户明确："基础功能做好后最后再设计 UI 及交互"）
- **仓库根** = `vitame-p0/` 根（CLAUDE.md + DESIGN.md 在根目录，不在子目录）

## 2026-04-19（D1 早间）

- 采用 Superpowers 精简装 4/11 skill + Tier 3 TDD（见 MIGRATION-2026-04-19.md）

## 2026-04-17

- 产品 pivot 到"补剂安全翻译"（原"健康Agent"方向被否）
