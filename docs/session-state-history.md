# VitaMe P0 — Session State History（归档）

> 从 `docs/SESSION-STATE.md` 决策日志溢出后的归档。按时间倒序。

---

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
