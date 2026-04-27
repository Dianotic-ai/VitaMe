---
title: "v0.4 设计系统与视觉契约"
description: "色 / 字 / 间距 / 组件契约 + Pill Box × Seed signature 详细规格 + 跟 v0.2 视觉资产的关系。"
doc_type: "design-system"
status: "active"
created: "2026-04-27"
canonical: true
related:
  - ../../DESIGN.md
  - ../product/品牌视觉规范.md
---

# 设计系统 — v0.4 实现版

## 0. 三层视觉规范的关系

| 文档 | 角色 |
|---|---|
| `docs/product/品牌视觉规范.md` | **品牌侧定义**（中文，原则 + 隐喻 + signature 物件契约）|
| `DESIGN.md` | **工程侧渲染契约**（英文 token + 组件结构 + AI 出图 prompt）|
| **本文** | v0.4 实际**实现状态**（哪些已落、哪些有偏差、token 实际值）|

代码改动时：
1. 改前先看 `DESIGN.md` 是否定义
2. 没定义先看 `品牌视觉规范.md` 原则
3. 都没定义 → 写 PR + 同步更新 3 处

---

## 1. 色彩系统（实际落地）

### 1.1 品牌主色（北极星）

| 用途 | Hex | Tailwind 名 | 实际渲染处 |
|---|---|---|---|
| 主色 / 茎叶 / 强调 | `#2D5A3D` | `forest` | PillBox 花心 frame、PersonSwitcher 选中 |
| 种子棕 / 茎 / 中和 | `#8B6B4A` | `seed` | PillBox 棕胶囊、SeedSproutStage 描边 |
| 点缀 / 流动状态 | `#4A90B8` | `stream` | ReminderBanner（已淘汰）、用户气泡 |
| 暖背景 | `#F0EBE0` | `bg-warm-2` | chat 页主背景 |
| 卡背景 | `#FAF7F2` | `bg-warm` / `surface` | 气泡 / cell 背景 |
| 正文 | `#1C1C1C` | `text-primary` | 标题 / 正文 |

### 1.2 风险 4 色（医疗合规视觉脊梁，DESIGN.md §2.1）

| 等级 | Hex | Tailwind | 用法 |
|---|---|---|---|
| Critical 严重 | `#C8472D` | `risk-red` | 🔴 高危拦截、警告条带 |
| Caution 注意 | `#D4933A` | `risk-amber` | DemoBanner 边线、PillBox 花瓣 |
| Insufficient 未收录 | `#8A8278` | `risk-gray` | 数据缺失、空 slot 文字 |
| Clear 未见风险 | `#5B8469` | `risk-green` | 一般正常、SeedSproutStage 叶填充 |

### 1.3 Disclaimer 专属

| Token | Hex | 用法 |
|---|---|---|
| `disclaimer-bg` | `#F5F1E8` | DemoBanner / DisclaimerBlock 背景 |
| `disclaimer-border` | `#C9AE7B` | 顶部 1.5px 边线 |
| `disclaimer-text` | `#6B5332` | Disclaimer 文字 |

### 1.4 v0.4 D14 引入的非品牌色（开花专用）

- `#D4933A` 0.75 opacity — 8 瓣琥珀花瓣
- `#5C4A2E` — 土壤纹理 / 胶囊接缝暗调

> 这些 hex 不在 `tailwind.config.ts` token 表里，是 SeedSproutStage / SoilMound / SoilTexture 内联用。**未来如果要重用必须升格为 token**。

---

## 2. 字体系统

```
heading: "Noto Serif SC", "Georgia", "PingFang SC", serif
body: "PingFang SC", -apple-system, "Helvetica Neue", sans-serif
mono: "SF Mono", "Menlo", "Consolas", monospace
```

层级（DESIGN.md §3.2）：
- `h1` 28/40px serif 600 — landing hero
- `h2` 22/28px serif 600 — section
- `h3` 18/22px serif 600 — sub
- `body-lg` 16/17px sans 400 — primary
- `body` 14/15px sans 400 — standard
- `body-sm` 13/14px sans 400 — meta
- `caption` 12/12px sans 400 — disclaimer
- `mono-sm` 12/13px mono — Latin name

iOS Safari **必须 ≥16px** in input fields（不然 focus 时自动 zoom）

---

## 3. 间距 / 圆角 / 阴影

- 间距 4 进制：4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
- 容器最大宽 720px（桌面）
- 移动端 full-bleed + 20px 侧 padding
- 圆角：card 12px / chip 3px / badge 999px / PillBox cell 10-12px / pill perfect circle (D14.2 改胶囊例外)
- 阴影：仅用 elevation 1 (`0 1px 2px rgba(43,42,39,0.04)`)，PillBox 阴影 ≤6%

---

## 4. 关键组件契约

### 4.1 RiskBadge

**结构**：pill shape，padding 6/12px，圆角 999px，13px font 500
**变体**：critical / caution / insufficient / clear（四色）
**强约束**：始终带文字 label，不能 icon-only（colorblind a11y）

### 4.2 DisclaimerBlock

**结构**：上 border 1.5px disclaimer-border + bg disclaimer-bg + 13px text
**位置**：每个 AI 输出页底部固定，**不能折叠**
**文案**：`VitaMe 提供保健品安全信息和决策辅助，不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况，请及时咨询医生。`

### 4.3 CitationPill

**结构**：行内 chip，1px border-subtle + text-secondary + 11-12px + mono-sm 显 ID
**触发**：MessageBubble 渲染时正则 `\[来源:\s*([^\]]+)\]` → 转成 chip
**事实源**：`SOURCE_LABEL` 表（retriever.ts），所有机构名「国家/地区 + 英文缩写」格式

### 4.4 PillBox（D14 双 signature 之一）

详细规格见 `DESIGN.md §11.5`。v0.4 实现 vs 契约的偏差：

| 契约 | v0.4 实际 | 决策 |
|---|---|---|
| Pills 为 perfect circle | **改胶囊形 + 斜放** | Sunny 决策 D14.2，覆盖契约「Avoid pharmaceutical capsule」|
| Empty cell = `-` | **空 slot 不渲染**（自适应只显示有 rule 的 slot）| Sunny 决策 D14.3 |
| Container 4 cells equal width | 保持 4 格 mental model，渲染按 visibleSlots.length 自适应 | Sunny 决策 D14.3 |
| Outer line 1.5px | **删除外框** | Sunny 决策 D14.6 |
| acked = filled green | **胶囊化为土壤散落 + 8 瓣琥珀花长出**（北极星 §11.1 第 3 阶段「开花」）| Sunny 决策 D14.6+D14.7 |

实际 acked 视觉链条：
1. 棕胶囊 (默认) — `#8B6B4A` 实心 + 上半 #5C4A2E 0.1 接缝暗调
2. 用户点击 → `ackRule('taken')`
3. 胶囊变 5 颗 SoilMound 椭圆土块（baseY = cy + 2.5r）
4. 茎从土上方升起到花心（`#8B5A2B` 1.5px stroke）
5. 1 片侧叶 `#5B8469` opacity 0.85
6. 8 瓣花头：8 个椭圆 `#D4933A` 0.75（rotate 0/45/.../315）
7. 花心：`#8B5A2B` filled circle r=0.34*pillR

### 4.5 SeedSproutStage（4 阶段品牌主角，原版来自 v0.2）

```tsx
<SeedSproutStage stage="seed|sprout|bloom|fruit" size={96} />
```

四阶段 viewBox 都是 80×96 或 64×96。颜色严格 v2 用户 2026-04-23 确认稿：
- 棕轮廓 `#8B5A2B`
- 鼠尾绿叶填充 `#5B8469`
- 琥珀花瓣 `#D4933A` 0.75

**未来用法**：
- /memory 时间轴 verify/observation/correction 等事件按对应阶段渲图标
- 营销 hero 4 阶段并排
- onboarding 4 步指南

**当前未挂载**到主路径，仅 PillBox 内嵌使用 `renderBloomInline`。

### 4.6 QuickReplies

**结构**：每行 surface bg + border-subtle + 圆角 card + chevron-right hover forest
**3 策略 fallback parser** 见 `02-user-journey.md` § 3
**附加 2 行**：「其他（自己说）」（点击展开 input）+「跳过 · 你帮我选」（直接发文字）

### 4.7 ClarifyBubble + IntentFallbackForm + SymptomCandidateList

DESIGN.md §4.7-4.9 定义。v0.4 chat 路径未直接使用（v0.3 RAG chatbot pivot 后这些组件部分淘汰），仍保留在 codebase 供 v0.2 老路径用。

### 4.8 PromptInspector

**触发**：chat header 放大镜 icon
**内容**：
- LOCAL 徽章
- 隐私说明文案
- 各字段汇总（疾病 / 用药 / 在吃保健品 / 过敏 / 特殊人群 / 年龄段 / 性别 / 近期话题）
- 实际注入 LLM 的 `<user_profile>` XML 文本（用户真能看到 AI 看到了什么）

---

## 5. 响应式断点

| Viewport | 行为 |
|---|---|
| < 375px | Degrade 优雅，不强求 |
| 375-480px | 移动默认，单列，full-bleed |
| 480-768px | 大 Android，同上 |
| 768-1024px | 平板，max-width 640px 居中 |
| ≥ 1024px | 桌面，max-width 720px 居中 |

主目标 viewport：**375×667**（WeChat WebView iOS）

---

## 6. WeChat WebView 注意事项

- `window.scrollTo({behavior:'smooth'})` 在 WeChat Android 不稳，用 instant
- `position: fixed` 在某些 WeChat Android 滚动时漂移，prefer `sticky`
- 不要自建分享 sheet（WeChat 自带）
- WeChat Android 底栏 60px，注意 fixed-bottom 元素留 padding
- 首屏冷 CDN cache 慢，above-the-fold 用 inline CSS

---

## 7. 视觉评审 10 项（每次 UI/插画上线前过）

按 DESIGN.md §13。通过标准：≥ 9/10。

1. 第一眼像「安静、高级、有生命力」品牌？
2. 留白 ≥60%？
3. 有「种子发芽」隐喻或四阶段语言？
4. 主角插画轻盈克制？
5. 配角装饰带 ≤4 颜色 + 不抢主角？
6. 色彩落 §2 token 内？
7. 标题像洞察非广告语？
8. CTA 克制可信？
9. 同时具备人文感与当代感？
10. AI 生成内容同屏可见 DisclaimerBlock？

---

**事实源**：`tailwind.config.ts` + `DESIGN.md` + `docs/product/品牌视觉规范.md` + `src/components/brand/*`
