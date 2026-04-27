---
title: "v0.4 合规与安全 — 8 红线落地 + audit 边界 + 禁词链"
description: "CLAUDE.md §9 八条红线在 v0.4 实际代码里的实现位置，加上 audit / 禁词 sanitize / critical 高危硬编码的具体链路与已知折中。"
doc_type: "compliance"
status: "active"
created: "2026-04-27"
canonical: true
related:
  - ../../CLAUDE.md
---

# 合规与安全

## 0. 8 红线（CLAUDE.md §9）落地映射

| # | 红线 | 实现位置 | 状态 |
|---|---|---|---|
| 1 | Disclaimer 强制 | systemPrompt.ts §安全红线 + DemoBanner.tsx + DisclaimerBlock.tsx + MessageList.tsx mini disclaimer | ✅ 活的 |
| 2 | Banned vocab | bannedWordsFilter.ts + chat/route.ts onFinish scan + MessageBubble.tsx 渲染前 sanitize | ✅ 活的 |
| 3 | Critical 高危组合硬编码 | db/contraindications.ts severity='red' + retriever.ts criticalHits + systemPrompt.ts criticalBanner | ✅ 活的 |
| 4 | sourceRefs 必有 | retriever.ts 每条 fact 带 sourceRef + systemPrompt.ts 引证规则 + MessageBubble.tsx CitationPill | ✅ 活的 |
| 5 | 数据最小化（不收姓名/地址/身份证）| systemPrompt.ts 不引导提问 + memoryExtractor.ts 不抽这些字段 | ✅ 活的 |
| 6 | Audit log 不能停 | chat/route.ts input + output audit + audit.ts Upstash REST | ⚠️ 流后失败仅 stderr |
| 7 | DemoBanner | DemoBanner.tsx 顶部固定挂 chat / profile / memory / reminders | ✅ 活的 |
| 8 | 健康档案隐私（仅 LocalStorage）| 4 个 store 全 createJSONStorage(localStorage) + 不上传服务端 | ✅ 活的 |

---

## 1. Disclaimer（红线 1）

### 1.1 三层 disclaimer 视觉

```
┌──────────────────────────────────────────────┐
│ ⓘ Demo 原型 · 禁忌规则尚未经执业药师... │  ← 顶部 DemoBanner（每页都挂）
├──────────────────────────────────────────────┤
│                                              │
│ [chat 内容]                                  │
│ ...                                          │
│ 本判断仅供参考，不构成医疗建议。              │  ← 每条 AI 回复末尾 (system prompt 强制 + 后置补齐)
│                                              │
├──────────────────────────────────────────────┤
│   AI 仅提供信息参考，不提供诊断或处方         │  ← MessageList 底部 mini disclaimer
└──────────────────────────────────────────────┘
```

### 1.2 强 prompt 约束

`systemPrompt.ts` § 安全红线最末：
> 末尾必带一行免责声明："本判断仅供参考，不构成医疗建议。"

### 1.3 后置补齐

`chat/route.ts onFinish` 不主动补 disclaimer（v0.4 没做）— 依赖 prompt 强制 + few-shot 示例覆盖。如发现 LLM 偶尔漏掉，需加 onFinish 后处理（P3）。

### 1.4 DemoBanner 文案（不可改）

```
本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 保健品-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。
```

---

## 2. 禁词链（红线 2）

### 2.1 词表

`src/lib/capabilities/compliance/bannedWordsFilter.ts`:

```ts
BANNED_WORDS_ZH = ['治疗', '治愈', '处方', '药效', '根治', '诊断']
BANNED_WORDS_EN = ['diagnosis', 'prescribe', 'cure']

// 英文用 regex 匹配屈折形式：
EN_PATTERNS:
  cure: /\bcur(?:e|es|ed|ing)\b/gi
  prescribe: /\bprescrib(?:e|es|ed|ing)\b|\bprescription\b/gi
  diagnosis: /\bdiagnos(?:is|es|e|ed|ing)\b/gi
```

### 2.2 三层防线

1. **prompt 防线**：`systemPrompt.ts` §安全红线显式列禁词 + 替换建议（治疗→改善 / 治愈→缓解 / ...）
2. **服务端 audit**：`chat/route.ts onFinish` 跑 `scanBannedWords(text)` → 命中写 `chat_banned_word_hit` audit
3. **客户端 sanitize（用户视觉最后兜底）**：`MessageBubble.tsx` 渲染前用 `sanitizeBannedWords(text)` 替换：
   ```
   治疗 → 改善
   治愈 → 缓解
   处方 → 服用方案
   药效 → 作用
   根治 → 长期改善
   诊断 → 评估
   diagnosis → assessment
   prescribe → suggest
   cure → improve
   ```

### 2.3 已知合规折中

- **流式过程中用户可能短暂瞥见原词**（before sanitize commit）— streaming 架构物理事实
- 严格升级方案：用 AI SDK `experimental_transform` 做 rolling sanitizer（在 token 层替换）OR 命中禁词改非流式生成 + 拒答模板。WAIC 期不做，待 P3。

---

## 3. Critical 高危组合（红线 3）

### 3.1 硬编码表

`src/lib/db/contraindications.ts` 列了人工药师精筛的高危组合（severity='red'）。代表性条目：

- 华法林 × 维生素 K
- 华法林 × 鱼油（出血风险升高）
- 华法林 × 银杏
- SSRI × 圣约翰草（5-HT 综合征）
- 孕期 × 维生素 A 高剂量
- 孕期 × 鼠李 / 蓖麻油等泻药

### 3.2 命中机制

```
user query → KB Retriever extractMentions
           → 跑 CONTRAINDICATIONS 查 substanceA × substanceB 笛卡尔积
           → severity='red' 标记 isCritical=true
           → criticalHits++
```

### 3.3 强制注入

`systemPrompt.ts.buildSystemPrompt()`:

```ts
const criticalBanner = opts.retrieved.criticalHits > 0
  ? `\n\n⚠️ 【系统提示】本轮检索命中 ${criticalHits} 条 isCritical=true 的高危组合。
     你必须输出 🔴 红色警告 + 拒绝讨论"折中方案" + 引导用户咨询医生。\n`
  : '';
```

加 prompt few-shot 示例 4 + 7（华法林+鱼油场景）演示标准回复结构。

### 3.4 Tool 协议保护

`chatTools.create_reminder` description 显式：
> 如果用户给的保健品跟 retrieved_facts 里有 isCritical=true 的高危组合相关（如华法林 + 鱼油），先警告再说提醒的事，不要直接调工具

---

## 4. Audit 边界（红线 6）

### 4.1 4 条边界规则

写在 `src/app/api/chat/route.ts` 头注释。**接手者必读**：

1. **流前 input audit (chat_input event)** — sync，唯一能"拦截"恶意输入的窗口。失败可拒请求（v0.4 选"记录后继续"）
2. **用户输入禁词命中 (chat_input_banned_word_hit)** — sync，写 audit 但不拒（用户可能无意提"诊断"等词描述自己情况）
3. **流后 output audit (chat_turn / chat_banned_word_hit)** — async，**流已开始无法撤回 token**。失败仅 stderr，不抛错
4. **真严格合规升级方案**：① input/output 双写都 sync 阻塞 ② 命中禁词时改非流式 + 拒答模板。WAIC 期不做，明确为 P3 工作

### 4.2 不记录什么

- 用户原话明文（仅 `shortHash` SHA-256 前 16 hex）
- profile 字段（disease / medication / supplement 都不入 audit）
- IP / UA / 地理（Vercel 默认 access log 由平台管理，不进 audit）

### 4.3 记录什么

- `event` 类型
- `sessionId`（profile.sessionId 永久 nanoid）
- `inputHash` / `outputHash`
- `retrievedSourceIds`（如 `['nih-ods:vitamin-d', 'suppai:fishoil-warfarin']`）
- `criticalHits` 数
- `metadata` 仅枚举 / 计数（无明文）

### 4.4 Upstash 配置

- 走 REST API（Edge runtime 无 Node fs）
- env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- 失败：5xx / network → 抛错 → chat/route.ts try-catch → console.error

---

## 5. 数据最小化（红线 5）

### 5.1 prompt 不主动问

`systemPrompt.ts` 只让 AI 问年龄段/性别/症状/现有用药 — **不**问姓名/地址/电话/身份证/具体出生日期/医保号等。

### 5.2 memoryExtractor.ts 不抽这些字段

ProfileDelta schema 没有 `name` / `address` / `phone` 等字段。即使用户主动说"我叫张三"，extractor prompt 也不会抽。

### 5.3 已知漏点

- 用户可能在 chat 自由输入个人信息（"我家住朝阳区..."）→ 流回 LLM 但不会被持久化（仅临时 history → message store 也没明文 audit）
- conversationStore 存的 UIMessage 含原话明文 → **仅 LocalStorage**，不出本机

---

## 6. 健康档案隐私（红线 8）

### 6.1 全 LocalStorage

4 个 zustand store 都 `createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never)))`. 服务端永远拿不到这些数据。

### 6.2 chat 注入 ProfileSnapshot

`/api/chat` body 含 `profile` 是**临时传输**，不在服务端持久化（无 DB write）。Edge function 处理完即丢。

### 6.3 一键销毁

`/profile` 页底部「销毁全部本地档案」按钮 → cascade 清 4 个 store（详见 `06-data-model.md` §6）。

弹窗显式说明清哪些 + 保留什么（archive 历史报告留存，单独入口清）。

### 6.4 LOCAL 徽章

`/profile` `/memory` `/reminders` header 都挂 `<span className="text-seed bg-seed-soft">LOCAL</span>` 让用户随时看到当前隐私模式。

PromptInspector ("AI 看到什么") 让用户看到实际注入 LLM 的 XML — 透明度 §8 落地。

---

## 7. CitationPill / sourceRefs（红线 4）

### 7.1 SOURCE_LABEL 表（user-visible 名）

`src/lib/chat/retriever.ts`:

```ts
SOURCE_LABEL = {
  'nih-ods': '美国 NIH ODS',
  'lpi': '美国 LPI',
  'cn-dri': '中国营养学会 DRIs',
  'pubchem': '美国 NIH PubChem',
  'chebi': '欧洲 EBI ChEBI',
  'suppai': '美国 AI2 SUPP.AI',
  'hardcoded-contraindication': 'VitaMe 内置禁忌',
  'dsld': '美国 NIH DSLD',
  'tga': '澳大利亚 TGA',
  'jp-kinosei': '日本机能性表示食品',
  'cn-bluehat': '中国蓝帽子保健食品',
}
```

### 7.2 引证格式约束

systemPrompt.ts §输出要求：
> 引证格式：行内紧贴句末，如 `推荐 200-400 mg/天[来源: 美国 NIH ODS Magnesium]`。**机构名必须照搬 <retrieved_facts> 里的 source 属性原文**...

### 7.3 客户端渲染

`MessageBubble.tsx` `renderTextWithCitations` 正则匹配 `\[来源:\s*([^\]]+)\]` → 替换成 `<CitationPill>` 组件。

---

## 8. PIPL / GDPR 还没做的

WAIC 4/30 demo 期 OK（用户告知 + 数据本地 + 一键销毁）。商业化前必须补：

- 隐私政策页 + 用户协议
- 实名注册流程
- 数据本地化部署（DB 选 Vercel 阿里云华东）
- 用户数据导出（PIPL 数据可携带权）
- 销户 30 天延迟硬删
- 第三方共享披露（minimax 数据流）
- 未成年人保护（VitaMe 服务保健品成年人为主）

---

## 9. 第三方依赖隐私

| 服务 | 数据流向 | 内容 |
|---|---|---|
| **minimax 国际版** | chat/extract/hermit 全部 | 用户原话 + profile snapshot + memory event 摘要 |
| **Upstash Redis** | audit | hash + sourceIds + 计数（**无明文**）|
| **Vercel** | Edge function 日志 | URL + status + duration（无 body 内容）|
| **GitHub Pages** (无) | — | — |

minimax 是主要数据外传通道。商业化必须在 ToS 披露。

---

**事实源**：`CLAUDE.md` §9 + `src/lib/capabilities/compliance/bannedWordsFilter.ts` + `src/app/api/chat/route.ts` + `src/lib/chat/audit.ts` + `src/lib/db/contraindications.ts`
