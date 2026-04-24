---
title: "Kevin Review Handoff"
description: "2026-04-21 给 Kevin 的跨分支 Risk schema 和 spec 对齐说明。"
doc_type: "handoff"
status: "reference"
created: "2026-04-21"
updated: "2026-04-21"
canonical: false
privacy: "internal"
tags: ["handoff", "review", "risk-schema"]
---

# Kevin review handoff — 2026-04-21

> 给 Kevin：以下是我和 Sunny 在 D4（2026-04-21）基于你 `codex/spec-hardening` (cdfd7f1) 做的跨分支对齐工作的摘要。**主要需要你确认 3 件事**（见 §2），其余是知会和背景。

---

## 1. 一句话摘要

你在 `cdfd7f1` 加的 8 份 P0 docs（尤其 api-contract / risk-matrix / context-taxonomy）里的 TS schema 与我们 Wave 1 落的代码（`src/lib/types/risk.ts` 等）命名风格 + 结构层面有冲突。Sunny 和 Claude 沟通后定了 3 条约定，把**代码**和**文档**双向对齐了。代码侧直接改完推了；文档侧开了 PR #1 等你 review。

---

## 2. 要你确认的 3 件事

### 2.1 命名标准（最重要）

锁定：**TS 字段名一律 camelCase，枚举值字符串保留 snake_case**。

| 层级 | 例子 | 规则 |
|---|---|---|
| TS 字段名 | `reasonCode / evidenceType / doseBand / rawInput` | **camelCase** |
| 字段里的枚举值 | `'drug_interaction' / 'stop_and_consult' / 'hardcoded_rule'` | **snake_case 字符串字面量**，不动 |

你原来 api-contract §1.6 写的 `reason_code: string` 这类，我们都改成了 `reasonCode: string`；但枚举值 `"drug_interaction" | "condition_contra" | ...` 全部保留原样。

**✅ 需要你确认：这个标准 OK 吗？** 如果要全部走 snake_case 或全部走 camelCase，我们再调。

---

### 2.2 Disclaimer 归属

锁定：**`TranslationResult.disclaimer` 顶层 1 份，不重复贴到每条 TranslatedRisk**。

你原来 api-contract §1.6 的 `TranslatedRisk = Risk & { translation, avoidance, disclaimer }` 里的 `disclaimer` 字段我们删掉了，加了顶层 `TranslationResult` 类型承载它。

理由：CLAUDE.md §11.1 的合规红线只要求"每次 AI 响应必带 DisclaimerBlock"，顶层一份由 `<DisclaimerBlock>` 组件强制渲染就够。每条 Risk 重复贴反而 UI 冗余（3 条 risk 会贴 3 次免责声明）。

**✅ 需要你确认：顶层一份 OK 吗？** 如果合规或 UX 有强理由坚持每条带一份，可以讨论。

---

### 2.3 Risk 溯源字段

锁定：**Risk 保留 `ingredient / condition? / medication?` 结构化溯源**，不合并到 `sourceRefs: string[]`。

你原来 api-contract §1.6 的 Risk 把这层信息塞进 `sourceRefs`，但我们 Wave 1 代码 (`src/lib/types/risk.ts:32`) 一直有这三个独立字段。为了保持"代码说了算"的一致性，docs 侧加上了这三个字段。

**✅ 需要你确认：保留结构化溯源 OK 吗？** 如果你更喜欢 `sourceRefs` 那种紧凑写法，告诉我们原因，再调整代码。

---

## 3. 边界决策（Metrics 事件命名）

`metrics-instrumentation.md` 里有两类字段：

| 类型 | 例子 | 本次处理 |
|---|---|---|
| schema 派生的事件属性 | `reasonCode / evidenceType / evidenceStrength` | 改成 camelCase |
| Mixpanel/Amplitude 惯例属性 | `overall_level / input_type / cta_variant / fallback_type` | **保留 snake_case** |

Analytics 平台 (Mixpanel/Amplitude/Segment) 的事件属性命名业内惯例是 snake_case。我们把 schema 派生的跟着代码走，纯分析惯例的保留原样。

**可选：如果你对 analytics 属性命名有偏好（全 camel 或全 snake），标注一下，我补个 follow-up commit。**

---

## 4. Wave 2+ 已知 TODO（不需要 Wave 1 处理）

Codex 帮我们 review 了代码，找到一处理论风险，已加 TODO 注释：

**mergeBucket 吞掉次值 dimension/cta**（`src/lib/capabilities/safetyJudgment/riskLevelMerger.ts:63`）

- 现状：同 bucket 多条 Risk 合并时，只保留 primary 的 dimension/cta，secondary 的丢
- P0 不咬：同 bucket 的 dimension 由 `SubstanceKind` 决定（同 kind → 同 dimension），现有 3 路 adapter 不冲突
- Wave 2+ 要修：suppai 激活后，若出现 "suppai `drug_interaction` vs hardcoded `dose_caution`" 这类同键跨维度冲突，要加 `conflictingDimensions / conflictingCtas` 字段

seed 测试挂了先查此处。

---

## 5. 产物定位

### 代码侧（分支 `vitame-dev-v0.1`，已 push）

| Commit | 内容 |
|---|---|
| `4868883` feat(L2): Risk schema 对齐 | Risk 加 dimension/cta，EvidenceSourceType 扩 'none'，EvidenceConfidence 扩 'unknown'，JudgmentResult 加 partialReason?，新增 `riskDefaults.ts` 共享映射 |
| `371e16e` fix(L2): partialReason 锁白名单 | Codex review 修复：partialReason 不再泄漏 `adapter.error` 诊断串；mergeBucket 加 Wave 2 TODO 注释 |

核心类型文件：`src/lib/types/risk.ts`（对照阅读 §2.1 / §2.3 的确认）

### 文档侧（PR #1）

**PR #1**: https://github.com/Dianotic-ai/VitaMe/pull/1
- 源分支 `docs/align-risk-schema` → 目标 `codex/spec-hardening`
- 6 files changed, 159+/130-
- 重点读 `api-contract.md` diff（191 行，覆盖 IngredientRef / MedicationEntry / QueryContext / QuerySession / Risk / TranslatedRisk / TranslationResult / Person 全部 schema）

---

## 6. 如何快速验证

```bash
# 1. 看代码侧 Risk schema 现状
git show vitame-dev-v0.1:src/lib/types/risk.ts

# 2. 跑 unit test（84 个全绿是代码约定的正确性证明）
npm run test:unit

# 3. 看 PR #1 的完整 diff
gh pr view 1 --repo Dianotic-ai/VitaMe --web

# 4. 对照：代码类型 vs 文档类型是否字段名完全一致
diff <(git show vitame-dev-v0.1:src/lib/types/risk.ts | grep -oE '^\s+[a-z][a-zA-Z]*[:?]' | sort -u) \
     <(git show docs/align-risk-schema:docs/engineering/specs/api-contract.md | \
        awk '/^```ts/,/^```$/' | grep -oE '^\s+[a-z][a-zA-Z]*[:?]' | sort -u)
```

---

## 7. 下一步

1. 你 review PR #1，对 §2 三条约定 + §3 metrics 命名做确认（或提出分歧）
2. 合并 PR #1 到 `codex/spec-hardening`
3. `codex/spec-hardening` 后续合回 `main` 时，代码侧 `vitame-dev-v0.1` 也会同步合入
4. Wave 2 动工前再聊一次 §4 的 merger 字段扩展

有分歧直接在 PR 里 comment，或者微信找 Sunny。
