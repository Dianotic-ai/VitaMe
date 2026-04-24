# DESIGN.md

> VitaMe's visual design system for coding agents.
> Based on the [Notion DESIGN.md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/notion) (warm minimalism), adapted for VitaMe's supplement-safety domain.
> Last updated: 2026-04-22 (D5).

---

## 0. How agents should read this file

- When the task involves rendering anything the user will see — page, component, layout, color, copy — read this file first.
- When the task is pure logic (baking, adapters, judgment rules) — you do **not** need to read this file.
- This file pairs with `CLAUDE.md`. `CLAUDE.md` governs engineering rules; this file governs visual rules. When they overlap (e.g. §4 `DisclaimerBlock` references `CLAUDE.md` §10.1), **`CLAUDE.md` wins on behavior, this file wins on appearance**.
- Generating or selecting illustrations / hero art / page-decoration bands → §11 (metaphor + layered system) + §12 (AI prompts) + §13 (review rubric). Reference assets live in `docs/assets/brand-*`.

---

## 1. Visual Theme & Atmosphere

### Core mood

Calm, trustworthy, human. The opposite of both **clinical sterility** and **loud e-commerce**.

Users arrive in an anxious frame ("did I buy the wrong thing for my mom?"). The UI has to read as **a careful pharmacist** — warm in tone, honest when uncertain, never upselling.

### Design philosophy

- Pharmacy-grade trust, not hospital intimidation.
- Information density: just enough to decide, not a paper to read.
- Warmth where possible. Precision where required.
- Silence where silence is honest — blank space is not wasted space.

### Density

Low. Generous whitespace. One primary decision per screen when possible.

---

## 2. Color Palette & Roles

### 2.1 The four risk colors — the product's visual spine

These four tokens are the heart of the app. Every safety verdict resolves to one of them. They must **never** be used for anything non-risk-related.

| Role | Token | Hex | When to use |
|---|---|---|---|
| Critical | `risk-red` | `#C8472D` | High-risk verdict (e.g. contraindication hit). Never use for generic system errors. |
| Caution | `risk-amber` | `#D4933A` | Needs attention, dosing change, or timing consideration. |
| Insufficient evidence | `risk-gray` | `#8A8278` | Not enough data. Also used for "unknown due to missing user info". |
| Clear | `risk-green` | `#5B8469` | No known risk detected. **Not** "safe to take" — we never promise that. |

### 2.2 Why these specific shades

- **`risk-red` is terracotta, not emergency-siren red.** We flag risks; we do not diagnose. A warm red reads as "pay attention and consult", not "PANIC". This aligns with §10 of `CLAUDE.md` — we avoid medical-authority framing.
- **`risk-green` is sage, not vibrant green.** Vibrant green reads as "all-clear, add to cart". Sage reads as "no known risk; still your call". Prevents false reassurance.
- **`risk-amber` skews warm brown-orange**, not neon yellow. Neon yellow reads as e-commerce badge; we need it to read as "caution" in a grown-up tone.
- **`risk-gray` is warm gray (slight brown tint)**, not cool steel. Cool gray reads as "disabled / ignore"; we need it to read as "honestly unknown, worth reading".

### 2.3 Neutral palette

| Role | Token | Hex |
|---|---|---|
| Background primary | `bg-warm` | `#FAF9F6` |
| Surface | `surface` | `#FFFFFF` |
| Text primary | `text-primary` | `#2B2A27` |
| Text secondary | `text-secondary` | `#6B6862` |
| Text disabled | `text-disabled` | `#A8A49C` |
| Border subtle | `border-subtle` | `#E8E4DD` |
| Border strong | `border-strong` | `#C9C2B5` |

### 2.4 Accent & UI

| Role | Token | Hex |
|---|---|---|
| Brand accent | `vita-brown` | `#8B5A2B` |
| Link / CTA | `link` | `#4A5D7E` |
| System error (not risk) | `error-red` | `#DC2626` |
| Info / learn more | `info` | `#4A7C9E` |

### 2.5 Disclaimer — a dedicated palette

The disclaimer block is unmistakable by design. It gets its own color set so it can never be confused with normal surface content:

| Role | Token | Hex |
|---|---|---|
| Disclaimer bg | `disclaimer-bg` | `#F5F1E8` |
| Disclaimer border | `disclaimer-border` | `#C9AE7B` |
| Disclaimer text | `disclaimer-text` | `#6B5332` |

---

## 3. Typography Rules

### 3.1 Font stack

- **Heading**: serif — `"Noto Serif SC"`, `"Georgia"`, `"PingFang SC"`, serif
- **Body**: sans-serif — `"PingFang SC"`, `"-apple-system"`, `"BlinkMacSystemFont"`, `"Helvetica Neue"`, sans-serif
- **Mono**: `"SF Mono"`, `"Menlo"`, `"Consolas"`, monospace (only for ingredient Latin names and source IDs)

**Why serif for headings**: signals authority and care. It's softer than a tech-stack sans-serif and makes the UI feel less like a dashboard, more like a trusted document.

**Why sans for body**: legibility during fast mobile reading inside WeChat WebView.

### 3.2 Hierarchy

| Level | Mobile | Desktop | Weight | Line height | Use |
|---|---|---|---|---|---|
| `h1` (Hero) | 28px | 40px | 600 | 1.3 | Landing hero only |
| `h2` | 22px | 28px | 600 | 1.35 | Result page top verdict |
| `h3` | 18px | 22px | 600 | 1.4 | Risk-reason section header |
| `h4` | 16px | 18px | 600 | 1.4 | Sub-section header |
| `body-lg` | 16px | 17px | 400 | 1.6 | Primary body |
| `body` | 14px | 15px | 400 | 1.6 | Standard text |
| `body-sm` | 13px | 14px | 400 | 1.5 | Metadata, timestamps |
| `caption` | 12px | 12px | 400 | 1.4 | Disclaimer, source refs |
| `mono-sm` | 12px | 13px | 400 | 1.4 | Ingredient Latin names |

### 3.3 Rules

- Never ALL-CAPS on body copy — reads as shouting.
- Headings: sentence case or title case; never all-caps.
- Never go below 12px for readable text. WeChat WebView often renders smaller than system.
- Chinese-first everywhere. English technical terms only where precision requires (ingredient Latin names, drug names).

---

## 4. Component Stylings

### 4.1 `RiskBadge` — the most important component

Exactly one `RiskBadge` per ingredient, shown on every result card.

**Structure**: pill shape, 6px vertical / 12px horizontal padding, 999px border radius, 13px text, weight 500.

**States**:
- Critical: `risk-red` bg at 10% opacity, 1px `risk-red` border, `risk-red` text
- Caution: `risk-amber` equivalent
- Insufficient: `risk-gray` equivalent
- Clear: `risk-green` equivalent

**Label**: always `one-word Chinese + one-word English`, never icon-only. Colorblind users and accessibility tools need the text.

| Level | Chinese | English |
|---|---|---|
| Critical | 严重 | Critical |
| Caution | 注意 | Caution |
| Insufficient (no_data) | 未收录 | Not in KB |
| Insufficient (legacy) | 证据不足 | Insufficient |
| Clear | 未见风险 | Clear |

### 4.2 `DisclaimerBlock` — compliance-mandated

Renders on every AI-generated output. **Never** hide behind tap-to-expand. See `CLAUDE.md` §10.1.

**Structure**:
- `disclaimer-bg` background
- 1px `disclaimer-border` top border only (no full box — a full box looks alarming)
- `disclaimer-text` color, 13px, line-height 1.5
- 12px padding top/bottom, 16px sides
- Contains: the fixed disclaimer string + a small "为什么要看到这个" text link that opens a sheet

**Fixed copy (do not modify without product review)**:

> VitaMe 提供补剂安全信息和决策辅助,不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况,请及时咨询医生。

### 4.3 `EvidenceSource`

Appears after each risk reason. Shows source origin and evidence level.

**Structure**: inline chip, 1px `border-subtle` border, `text-secondary` text, 11–12px, `mono-sm` for the source ID.

**Example renders**:
- `📘 NIH ODS · Fact Sheet · 2024-08`
- `📗 SUPP.AI · id:mag-war-0142`
- `📕 Hardcoded · warfarin × vitamin-K`

Tapping opens a sheet with: full citation, retrieval date, and one paragraph on "why this source is trustworthy".

Emoji leading chars are the **one exception** to the no-emoji rule (see §7) — they act as source-type glyphs and are scannable.

### 4.4 Buttons

- **Primary**: `vita-brown` bg, white text, **44px** minimum height (tap-target rule), 12px radius.
- **Secondary**: 1px `border-strong` border, `text-primary` text, transparent bg.
- **Ghost**: text-only, `link` color.
- **Destructive** (e.g. "停止服用"): `risk-red` **outlined, never solid**. We do not issue commands; we flag urgency.

### 4.5 Cards / Surfaces

`surface` bg, 1px `border-subtle` border, 12–16px radius, 16–24px padding.
Shadow: elevation-1 only (`0 1px 2px rgba(43, 42, 39, 0.04)`). Never heavier on a card.

### 4.6 Input (Query entry)

- Mobile height: **48px** (tap target)
- Font size: **16px minimum** (below 16px triggers iOS Safari auto-zoom on focus — never do this)
- Border: 1px `border-subtle`, 10px radius
- Focus: border changes to `vita-brown`. **Suppress** the default blue system halo.
- Placeholder（v2.8 重写）：自然语言引导，例 "问我吧，比如：我妈在吃华法林，能吃辅酶 Q10 吗？"。**不**用"输入成分名"这类工程师导向措辞。

### 4.7 `ClarifyBubble` — 意图识别澄清气泡（v2.8 新增）

L0 `parseIntent` 触发 `clarify_needed` 时渲染。替代了 v2 的 `/intake` 4 道固定问答页。

**结构**：
- 左对齐"VitaMe"头像（不画脸，用 16px 圆形 `vita-brown` 色块 + 一个白色对勾 SVG）
- 气泡 bg `surface`，1px `border-subtle`，12px radius，padding 12px 14px
- 文字 `body`（14px），`text-primary`，line-height 1.6
- 气泡下方一行 button row：≤4 个 choice button + 永远追加一个 "其他（自己说）" 文本输入入口

**Choice button 状态**：
- Default：1px `border-strong`，`text-primary`，48px 高（tap target），padding 0 14px，999px radius
- Hover/focused：bg `bg-warm`，border `vita-brown`
- Selected（点击后）：bg `vita-brown`，white text，**立即转换为右对齐用户气泡**（"我选了 X"）保留在对话流里
- Disabled（提交后整个 group 锁死）：`text-disabled`，border `border-subtle`

**"其他" 输入入口**：
- 默认收起，显示为 ghost button "都不是？告诉我具体情况"
- 点开后展开为单行 input + "发送"按钮，input 高度 48px，font 16px

**clarify 气泡 schema 约束**（DESIGN ↔ spec 对齐）：
- `question.length` ≤40 字（移动端单屏可读）
- `choices.length` 在 [2, 4]，不能 0、不能 5+
- 每个 choice 文案 ≤8 字（按钮可读 + 等宽对齐）
- 同时必须显示一句小字注脚（`caption` / 12px / `text-secondary`）："为什么问？" 点开 sheet 解释这条 clarify 是基于哪条业务规则。**不**是装饰，是合规可解释性要求。

**严禁**：
- 自动跳到下一题（必须用户点了才进）
- 多 clarify 同时出现（只显示当前一题）
- 在气泡里画风险色块（这是 L2 的事，clarify 阶段还没判风险）

### 4.8 `IntentFallbackForm` — 意图识别兜底（v2.8 新增）

`parseIntent` 失败 / clarify 已 2 轮仍 unclear 时显示。

**结构**：
- 一句安抚文案（`body` / `text-primary`）："我没听懂你的问题，能换个说法吗？"
- 三条引导例句（卡片状，1px `border-subtle`，可点击直接填入输入框）：
  - "我妈在吃华法林，能吃辅酶 Q10 吗？"
  - "孕期能吃维生素 D 吗？"
  - "我胃溃疡，吃什么形式的镁？"
- 输入框（同 §4.6 Query Input）+ "发送" primary button

**严禁**：
- 显示报错栈、`intent_llm_timeout` 等技术信息
- 显示 raw LLM 输出（合规红线 §11.6 / §11.13）

### 4.9 `SymptomCandidateList` — 症状候选成分（v2.8 新增，对应 §11.14）

`intent === 'symptom_goal_query'` 且查到候选时显示。

**结构**：
- 顶部一句注脚（`caption` / 12px / `text-secondary`）："以下成分常被关联到这类需求，**不构成医疗建议**。点击任一项做安全核查。"
- 卡片列表（最多 5 条）：
  - 每张卡片：成分中文名 (`h4`) + 一句简介 (`body-sm`) + `EvidenceSource` chip（§4.3）+ 右下角 ghost button "查这个安不安全 →"
  - 点击 → 自动以该 ingredient 起 `product_safety_check` 子查询

**严禁**：
- 给品牌/产品推荐（§11.9 不做电商）
- 给"建议吃 X mg"剂量建议（§11.5 LLM 不创规则）
- 显示按"评分"排序（这不是评测）

---

## 5. Layout Principles

### 5.1 Spacing scale (4-based)

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64` (px). Nothing off-scale.

### 5.2 Page structure

- Container max-width: **720px** on desktop.
- Mobile: full-bleed, **20px** side padding.
- Vertical rhythm: **24px** between sections, **12–16px** within a section.

### 5.3 Whitespace philosophy

- Default to more whitespace than you think is needed.
- Do not pack the result page edge-to-edge. Users are already anxious; dense layout amplifies it.
- If a screen looks "empty", that is usually correct.

### 5.4 Grid

- Single-column on mobile (default for WeChat WebView).
- Two-column only at ≥ 1024px, and only for archive / recheck list pages.

---

## 6. Depth & Elevation

VitaMe is a **mostly flat** UI with warm surfaces. Use elevation sparingly.

| Level | Use | Shadow |
|---|---|---|
| 0 | Base surfaces | none |
| 1 | Cards | `0 1px 2px rgba(43, 42, 39, 0.04)` |
| 2 | Sheet / modal (rare) | `0 4px 16px rgba(43, 42, 39, 0.08)` |
| 3 | Floating action (avoid) | `0 8px 24px rgba(43, 42, 39, 0.12)` |

Do not stack more than 2 elevation levels in view at once.

**Prefer borders over shadows** for separation. Shadows on WeChat WebView render inconsistently across Android devices.

---

## 7. Do's and Don'ts

### Do

- Use warm neutrals and the 4 risk colors as the palette spine.
- Respect whitespace — a sparse result page reads as calm and considered.
- Show the disclaimer every time, visibly, uncollapsed.
- Use sentence case for UI labels.
- Use plain-language reason text **before** technical details.
- Make every tap target ≥ **44×44px**.
- Anchor the verdict at the top of the result; reasoning below.
- Use Chinese first; English technical terms only where necessary.

### Don't

- Don't use pure bright red / yellow / green. Anywhere. Ever.
- Don't use badge icons alone without text — colorblind users need both.
- Don't use ALL-CAPS for body copy.
- Don't add drop shadows > 8px blur — alarming for medical-adjacent context.
- Don't center-align body text longer than one sentence — hurts legibility.
- Don't use e-commerce patterns (price tags, star ratings, "limited time" banners).
- Don't use emoji in risk-reason text — undermines authority. (Exception: source-type glyph in `EvidenceSource`, §4.3.)
- Don't animate the `RiskBadge` — steady reads as trustworthy; pulsing reads as unstable.

---

## 8. Responsive Behavior

### 8.1 Primary target: WeChat WebView (Android & iOS)

Approximately 95% of traffic will come through WeChat WebView at `https://vitame.live`. Design first for a **375×667** viewport.

### 8.2 Breakpoints

| Viewport | Behavior |
|---|---|
| `< 375px` | Degrade gracefully; don't fight the layout |
| `375–480px` | Mobile default; single column, full-bleed |
| `480–768px` | Large Android phones; same layout |
| `768–1024px` | Tablet; max-width 640px centered |
| `≥ 1024px` | Desktop; max-width 720px centered |

### 8.3 Touch targets

- Minimum **44×44px**. Prefer **48px**.
- No tap target within 8px of another.
- Form inputs at least 48px high.

### 8.4 iOS Safari quirks to preempt

- `font-size: 16px` minimum on inputs, or iOS zooms on focus.
- `-webkit-tap-highlight-color: transparent` on clickable elements.
- Use `safe-area-inset-*` for notched iPhones.

### 8.5 WeChat WebView quirks

- `window.scrollTo({ behavior: 'smooth' })` is unreliable on WeChat Android — use instant scroll.
- Fixed-position elements misbehave on scroll-start on some devices — prefer `position: sticky`.
- Share sheet is provided by WeChat natively; do not build one.
- The bottom nav bar on WeChat Android takes ~60px; account for it in fixed-bottom elements.
- First paint may be slow on cold CDN cache; prioritize above-the-fold inline CSS.

---

## 9. Agent Prompt Guide

### 9.1 Quick color reference

```
Risk-red     #C8472D   Risk-amber   #D4933A   Risk-gray    #8A8278   Risk-green   #5B8469
Bg-warm      #FAF9F6   Surface      #FFFFFF   Text-primary #2B2A27   Text-second  #6B6862
Vita-brown   #8B5A2B   Link         #4A5D7E   Border-sub   #E8E4DD   Border-strong #C9C2B5
Disclaimer-bg #F5F1E8  Disclaimer-b #C9AE7B   Disclaimer-t #6B5332
```

### 9.2 Ready-to-use prompts

**Landing hero**
> Build the VitaMe landing hero following DESIGN.md §3 typography. H1 uses the serif heading font; sub-headline uses body-lg sans-serif. Primary CTA button uses `vita-brown`. No gradient. No animation. Chinese-first copy. Include the `DisclaimerBlock` footer per §4.2.

**Result page**
> Build the result page following DESIGN.md §4–§6. Verdict-first layout: `RiskBadge` at top using the 4 risk colors from §2.1; then reason text in `body-lg`; then `EvidenceSource` chips; always-visible `DisclaimerBlock` per §4.2. Elevation-1 cards only. Warm neutrals only. Chinese-first copy.

**RiskBadge**
> Build the `RiskBadge` component per DESIGN.md §4.1. Four variants (critical / caution / insufficient / clear). Pill shape, 13px, weight 500. Always render Chinese + English text label in addition to color — never icon-only.

### 9.3 Pre-ship visual checklist

- [ ] `DisclaimerBlock` is visible, not collapsed
- [ ] `RiskBadge` uses text + color (not icon-only)
- [ ] `RiskBadge` 区分 `no_data`（"未收录"）与 legacy `证据不足`（v2.8 起）
- [ ] Risk-related colors use the 4 risk tokens; never pure red/yellow/green
- [ ] `ClarifyBubble` 单 clarify 显示、≤4 choices + 永远附 "其他" 入口、必带 "为什么问？" 注脚（v2.8）
- [ ] `IntentFallbackForm` 不漏出 raw LLM / 错误栈（合规 §11.6 / §11.13）
- [ ] `SymptomCandidateList` 不出现品牌推荐 / mg 剂量 / "评分排序"（§11.5 / §11.9 / §11.14）
- [ ] Tap targets ≥ 44px
- [ ] Input fonts ≥ 16px
- [ ] No e-commerce patterns (price, stars, scarcity)
- [ ] H1 uses serif; body uses sans
- [ ] No more than 2 elevation levels visible at once
- [ ] Chinese copy is primary; English is secondary

---

## 10. CSS tokens (drop-in for Tailwind config / CSS variables)

```css
:root {
  /* risk */
  --color-risk-red:    #C8472D;
  --color-risk-amber:  #D4933A;
  --color-risk-gray:   #8A8278;
  --color-risk-green:  #5B8469;

  /* neutral */
  --color-bg-warm:         #FAF9F6;
  --color-surface:         #FFFFFF;
  --color-text-primary:    #2B2A27;
  --color-text-secondary:  #6B6862;
  --color-text-disabled:   #A8A49C;
  --color-border-subtle:   #E8E4DD;
  --color-border-strong:   #C9C2B5;

  /* accent & ui */
  --color-vita-brown: #8B5A2B;
  --color-link:       #4A5D7E;
  --color-error-red:  #DC2626;
  --color-info:       #4A7C9E;

  /* disclaimer */
  --color-disclaimer-bg:     #F5F1E8;
  --color-disclaimer-border: #C9AE7B;
  --color-disclaimer-text:   #6B5332;

  /* elevation */
  --shadow-1: 0 1px 2px rgba(43, 42, 39, 0.04);
  --shadow-2: 0 4px 16px rgba(43, 42, 39, 0.08);
  --shadow-3: 0 8px 24px rgba(43, 42, 39, 0.12);
}
```

---

## 11. Brand illustration & metaphor

### 11.1 Core metaphor — 种子发芽（seed sprouting）

A seed cracking open, sending up two leaves and a fine root system. This is **the** brand symbol — not just a hero decoration. It maps to VitaMe's promise: *discernment before growth, every body has its own answer*.

Four growth stages map 1:1 to product moments:

| Stage | Visual | Maps to |
|---|---|---|
| 种子 (seed) | Whole, intact seed | Onboarding / first visit |
| 发芽 (sprout) | Cracked husk + first leaves | Insight / first verdict shown |
| 开花 (bloom) | Stem with flower | Growth / repeat user, archive built |
| 结果 (fruit) | Branch with fruit | Outcome / habits formed |

These four icons should be used as a coherent set whenever a sequence is shown (e.g. landing-page value props, onboarding flow). Do not invent fifth/sixth stages for variety.

### 11.2 Layered illustration system — 主角安静 + 配角有层次

VitaMe uses **two illustration registers in the same page**, kept coherent through shared color palette:

| Register | Where | Style | Reference |
|---|---|---|---|
| **Hero / icon** (主角) | Hero focal art, four-stage icons, empty states | Single fine line, Klee-influenced, generous white around it, ≤3 visual elements. Quiet. | `docs/assets/brand-seed-sprout-hero.jpg` |
| **Page background / decorative band** (配角) | Hero周围淡景、底部装饰带、CTA section、分隔区 | Layered fine-line botanicals (远景柏树/山形/水波/根系), faint watercolor wash, editorial density | `docs/assets/brand-page-layered-A.png` `docs/assets/brand-page-layered-B.png` |

**Rules**:
- 主角永远只有一个视觉中心；配角永远不抢主角。
- 同色系：暖米背景 (`#FAF7F2`) + 鼠尾绿 (`#2D5A3D`) + 种子棕 (`#8B6B4A`) + 极少量溪水蓝点缀 (`#4A90B8`)。装饰带可以多元素，但**色彩必须 ≤4 种**。
- 装饰带（配角）不可使用：写实植物堆叠、强阴影、强渐变、噪点纹理、卡通拟人。
- 任何一页内：主角 1 个 + 配角带 ≤2 处。超过则砍。

### 11.3 Style keywords

**Must satisfy**: organic, minimal, quiet, gentle, thoughtful, airy, human, warm, editorial, hand-drawn

**Must avoid**: cyberpunk, over-decorated, SaaS dashboard, neon gradient, overly commercial, cute/cartoonish, luxury fashion arrogance, wellness cliché

### 11.4 Reference assets

- `docs/assets/brand-seed-sprout-hero.jpg` — canonical hero / icon-set style anchor
- `docs/assets/brand-page-layered-A.png` — page-decoration density reference (preferred)
- `docs/assets/brand-page-layered-B.png` — alternate page-decoration density (more lush; use sparingly)

---

## 12. AI image prompts

For when an asset doesn't exist and needs to be generated. **Always run output through §13 review rubric before shipping.**

### 12.1 Hero / icon prompt (主角 register)

```
Design a single-subject botanical illustration in an Anthropic-inspired
editorial minimal style with organic hand-drawn elements.
Subject: a seed beginning to sprout — cracked husk, two delicate leaves,
fine root system reaching into soft soil. Symbolizes discernment, inner
growth, quiet strength, life emerging from fragility.
Style: fine single line, soft warm background (#FAF7F2), accents of deep
forest green (#2D5A3D) and seed brown (#8B6B4A). Generous whitespace.
Inspired by Paul Klee, Saul Steinberg, contemporary minimalist plant sketches.
Feel: calm, intelligent, airy, human-centered, premium, quietly alive.
```

### 12.2 Page decoration prompt (配角 register)

```
Design a page-background decorative band in editorial minimal style.
Composition: layered fine-line botanicals — distant cypress trees, gentle
hill silhouettes, water ripples, fine root systems — with faint watercolor
wash. Multiple elements but ≤4 colors total: warm cream (#FAF7F2),
forest green (#2D5A3D), seed brown (#8B6B4A), tiny accent of water blue
(#4A90B8). Hand-drawn feeling, editorial density, never busy.
Avoid: photorealism, cartoon, dashboard graphics, strong shadows, gradients.
Feel: like the margin illustration of a thoughtful botanical journal.
```

### 12.3 Negative prompts (always include)

```
cyberpunk, neon gradient, glossy 3D, startup cliché, overly futuristic,
busy layout, childish illustration, cartoon UI, high-saturation tech blue,
dashboard overload, e-commerce promotional style, stock photo wellness,
emoji, drop shadows, lens flare, particle effects.
```

---

## 13. Review rubric — 10 项视觉评审

Run this before any UI/illustration ships. Pass requires 9/10 yes.

1. 第一眼是否像"安静、高级、有生命力"的品牌，而不是"工具网站"？
2. 是否保留了足够留白（页面 ≥60% 浅色 / 空白）？
3. 是否有明显的"种子发芽"隐喻或四阶段语言？
4. 主角插画是否轻盈克制（单线条、无装饰堆砌）？
5. 配角装饰带元素 ≤4 种颜色，且不抢主角？
6. 色彩是否落在 §2 token 表内（无自创撞色）？
7. 标题是否像"洞察"，而不是"广告语"（无"革命"/"颠覆"/"暴涨"）？
8. CTA 是否克制可信（无促销红、无 emoji、无"立即抢购"句式）？
9. 是否同时具备**人文感**与**当代感**（不复古、不科技）？
10. 任何 AI 生成内容是否同屏可见 `<DisclaimerBlock>`（§4.2 + CLAUDE.md §11.1）？

---

## 14. Provenance

- **Base**: [Notion DESIGN.md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/notion) — warm minimalism aesthetic.
- **VitaMe-specific additions**:
  - §2.1–2.2 four-risk-color system (the product's visual spine)
  - §2.5 dedicated disclaimer palette
  - §4.1 `RiskBadge`, §4.2 `DisclaimerBlock`, §4.3 `EvidenceSource` component specs
  - §4.7 `ClarifyBubble`, §4.8 `IntentFallbackForm`, §4.9 `SymptomCandidateList`（v2.8 — L0 意图层 UI）
  - §8.4–8.5 WeChat WebView and iOS Safari quirks
  - §11–13 brand illustration system + AI prompts + review rubric (D7, now governed by `docs/product/品牌视觉规范.md`)

---

**End of DESIGN.md.**
