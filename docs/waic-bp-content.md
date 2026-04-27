---
title: "WAIC BP — 10 页 Slide 文案"
description: "Slide-ready 文本 + 图位 placeholder + speaker notes。供 ppt-master 输入或 Sunny review。"
doc_type: "bp-content"
status: "draft"
created: "2026-04-27"
---

# VitaMe — WAIC 2026 BP 文案 (10 页)

> 每页结构：**Title** / 副标 / 正文 bullets / 图位 / Speaker note (可选)
> 视觉风格：暖米底 + 深林绿 + 种子棕（同 vitame.live 主题）

---

## P1 · 封面

**VitaMe**

> 你的保健品顾问 + 服用伴侣 — 选对、吃对，越吃越懂你。

---

- 🔗 vitame.live
- 👥 Kevin (Cofounder, Product) · Jiya (Cofounder, Engineering)
- 🏆 WAIC 2026 创业赛道 · 2026-04-30

[图位：VitaMe Logo + 4 阶段种子图标 (种子→发芽→开花→结果)]

---

## P2 · Founding Story

**为什么我们做 VitaMe**

> 「半年前我搭档花一下午用 Gemini 选好 10 几种保健品。
> 真要吃的时候，他放弃了。」

---

他有结石、肠胃问题，需要分阶段补 — 有些成分饭前吃，有些睡前吃，有些不能同食。**20 轮对话**才搞清楚选什么。

实际服用第一天就乱套了：哪个饭前？几点？跟药冲不冲突？

**选保健品很累，吃保健品更累。**

VitaMe 把"决策"和"执行"合到同一个对话 — 5 轮选好，自动设提醒，每个时段该吃啥一目了然。

[图位：搭档使用 Gemini 20+ 轮对话截图 (placeholder)]

> Speaker note: 这不是我们造的故事，是我们自己经历的。VitaMe 第一个用户就是搭档。

---

## P3 · Problem & Market

**两个真痛点 + 一个 ¥3500 亿市场**

---

### 痛点 1：决策疲劳
- 普通用户要 20+ 轮对话才能选对保健品
- 小红书评论区高频问题：「不知道吃哪个」「这两个能一起吃吗」「饭前还是饭后」
- 自由查 + ChatGPT 通用问答 = 没权威源、没禁忌库、没记忆

### 痛点 2：服用执行断链
- 选好 ≠ 吃对
- 时段 / 顺序 / 冲突 / 长期坚持 全靠用户自己记
- 80% 的购买者在 30 天内"忘记吃"或"乱吃"

### 市场规模（公开数据）
- 中国保健品市场 **¥3500 亿**（艾媒 2024）
- 60+ 银发人口 **3 亿**（国家统计局 2024）
- 主用户 = 30-50 岁帮长辈选保健品的子女 ≈ **5000 万**

[图位：小红书搜索"如何选保健品" + 评论区截图 (placeholder)]

---

## P4 · Solution + 北极星 5 段 Loop

**一条对话，打通决策 → 执行 → 反馈**

---

```
  Verify        Reminder       Feedback        Memory        Hermit
  安全检查  →   服用提醒  →    服用反馈  →    长期记忆  →   周期归纳
  (5 轮选品)   (4 格药盒)     (1 个问题)    (事件流)      (建议复查)
       ↓             ↓              ↓             ↓             ↓
   你想补啥？    早 / 中 /      "今天吃    冲突 / 病史 /   "你已 30 天
   有何禁忌？    晚 / 睡前      了吗？"   家人档案累积    没复查 X，
                                                           是否仍有效"
```

---

5 段 loop 全部上线：
- ✅ Verify — 8 权威源 RAG，硬编码高危禁忌（华法林×鱼油等）
- ✅ Reminder — Pill Box × Seed signature 4 格视觉提醒
- ✅ Feedback — 单问题 ritual，非打扰
- ✅ Memory — 全本机 LocalStorage（隐私底线）
- ✅ Hermit — 用户主动触发的周期 AI 归纳

---

## P5 · Live Demo

**vitame.live · 国内可访问 · 微信内打开**

---

📱 扫码或访问 https://vitame.live

[图位：QR code]

---

[图位 4 张关键截图 2×2]

| ① 高危拦截「鱼油+华法林」🔴 红警 + 引证 pill | ② Pill Box × Seed strip 早/中/晚/睡前 |
| ③ Memory 时间轴 5 类事件混合 | ④ Tool use「鱼油 8 点提醒我」AI 直接调用 |

**已 ship 14 天 v0→v0.4 完整北极星 loop**：
- 8 个核心场景跑通
- 中国大陆 + 微信 WebView 真机验证
- 17 评委可现场试用

---

## P6 · Tech Moat

**两件别人没做的事**

---

### 1. 8 权威源 RAG + 硬编码高危禁忌
```
NIH ODS · Linus Pauling Institute · 中国营养学会 DRIs
SUPP.AI · DSLD · TGA · 日本机能性食品 · 中国蓝帽子
+ VitaMe 内置 Critical 禁忌（药师精筛）
```
- 每条推荐**必带引证 pill** (`美国 NIH ODS Magnesium`)
- 高危组合（华法林×维 K / 鱼油 / 圣约翰草）**硬编码强制注入**，不让 LLM 凭训练知识乱答
- vs ChatGPT/通义：通用 LLM 无禁忌库、无引证、无医疗合规边界

### 2. 视觉 signature — Pill Box × Seed
```
4 格药盒 = 早 / 中 / 晚 / 睡前
药丸 = 种子，吃完后破壳长出 8 瓣琥珀花
```
- 不是 checkbox，是「为家人种下的小园子」
- 每次"吃了"= 完成一次"播种 → 开花" 循环
- vs 其他提醒 app：刷脸的医疗器具感 / 我们做的是温度感

[图位：Pill Box 横向 strip + 已 ack 双色花朵 各 1 张]

---

## P7 · Compliance & Trust（⭐ 张益新评委必看）

**8 红线 — 不可破，每一条都对应代码实现**

---

| # | 红线 | 实现位置 |
|---|---|---|
| 1 | Disclaimer 强制 | `DemoBanner.tsx` + system prompt + MessageList mini |
| 2 | 禁词后置过滤 | `bannedWordsFilter.ts` (ZH 6 词 + EN 3 词 + 屈折 regex) |
| 3 | Critical 高危硬编码 | `db/contraindications.ts` severity='red' |
| 4 | sourceRefs 必带 | retriever 每条 fact + CitationPill |
| 5 | 数据最小化（不收姓名/身份证）| profile schema 排除 |
| 6 | Audit log 不能停 | Upstash Redis（仅 hash + sourceId 不存明文）|
| 7 | DemoBanner 顶部固定挂 | 每个 AI 输出页 |
| 8 | 健康档案隐私（仅 LocalStorage）| 4 个 zustand store 全本机 |

---

**关键边界**：
- ❌ 不诊断疾病
- ❌ 不开处方
- ❌ 不预测疗效
- ✅ 仅做"信息整理 + 安全前置"
- ✅ 任何 AI 输出末尾必带「本判断仅供参考，不构成医疗建议」

[图位：DemoBanner 截图 + 一条带 CitationPill 的 chat 回复]

---

## P8 · Business Model — A + B 双轮（⭐ 杨露茜评委必看）

**Phase 1：C 端订阅 (0-12 月) → Phase 2：B 端 SaaS (6+ 月起)**

---

### Phase 1 — C 端订阅（PMF 验证）
- **¥9.9-19.9/月** 订阅
- 主用户：30-50 岁帮长辈选保健品的子女
- 妈妈/搭档级用户故事直接背书 (P2 callback)
- 启动快、规模大、消费心智成熟

### Phase 2 — B 端 SaaS（变现升级）
- C 端到 1 万付费 → 数据资产化
- 卖给：连锁药店 / 保健品品牌方 / 体检中心 / 健康险
- "VitaMe 推荐促成 X% 转化率" 做 B 端钩子

### 双轮护城河
- C 端拿决策疲劳 + 长尾 use case
- B 端拿现金流安全垫 + B2B2C 渠道
- 互相加强：C 端用户量 → B 端议价 ↑；B 端凭证 → C 端信任 ↑

---

## P9 · Competition

**国内 7 家 + 海外 1 家对比 — 我们是唯一全链路**

---

```
                          JD/平安  丁香医生  薄荷健康  Care/of  VitaMe
                          阿里健康                      (海外)
对话式 5 轮选择              ✗       部分      ✗       ✗(quiz)    ✓
高危组合自动拦截             ✗        ✗        ✗         ✗        ✓ 硬编码
权威源引证 + sourceRefs      ✗       部分      ✗         ✗        ✓ 8 源
服用提醒（药盒视觉）          ✗        ✗        ✗         ✗        ✓
长期 Memory + 反馈           ✗        ✗        ✗         ✗        ✓
决策中立（不卖货）            ✗       部分      ✗         ✗        ✓
中文 + 微信内打开            ✓        ✓        ✓         ✗        ✓
```

---

**关键 insight**：
1. **海外 Care/of**（巅峰估值 $225M, 2020 被 Bayer 收购）— 验证「决策疲劳」是真痛点；卖货模式翻车 → VitaMe 决策中立是护城河
2. **没人做"服用执行"环节** — 海外全做 buy，没人做 take。Pill Box × Seed 是空白市场
3. **没人做"药×保健品冲突"对话化** — Drugs.com 是工具不是对话；通用 LLM 无硬编码
4. **中国 + 微信生态 = 0 海外直接竞争**

---

## P10 · Team + Roadmap + ASK

### Team

| Kevin | Jiya |
|---|---|
| Cofounder, Product | Cofounder, Engineering |
| 主导产品方向 + 设计契约 | 1 个月独立交付 v0.4 完整北极星 loop |
| [履历待补] | [履历待补] |

### Roadmap

| 时间 | 节点 |
|---|---|
| 4/30 | WAIC 2026 demo |
| 5-6 月 | 注册系统（手机号 OTP + 邮箱 magic link）+ 真用户访谈 |
| 6-9 月 | 微信公众号 + 小程序 + C 端付费试点 |
| 9-12 月 | C 端 1 万付费 + B 端 SaaS 试点（连锁药店）|
| Year 2 | 商业化加速 + 天使轮（如需）|

### ASK — VitaMe 寻求 WAIC 平台资源协同

1. **媒体曝光** — 让 30-50 岁帮长辈选保健品的子女群体知道我们
2. **办公空间** — 上海/北京共享空间，加速团队协作
3. **合作方介绍** — 连锁药店 / 保健品品牌方 / 健康险，加速 B 端验证
4. **媒体平台** — 健康/育儿/银发赛道 KOL + 公众号矩阵

> **资金当前不在硬约束** — 团队靠创始人自有资源支撑可持续 6 个月。
> 天使轮欢迎在 PMF 验证后对话（预计 2026-Q3）。

---

**🔗 vitame.live · 📧 GitHub Issues @Dianotic-ai/VitaMe**

**谢谢评委。**

---

## 附：Speaker Notes（可选 — pitch 时可参考）

### P2 Founding Story
- 强调「真实经历 + 我们自己是第一批用户」
- 不要念稿，用陈述句讲故事
- 关键句："选保健品很累，吃保健品更累" — 停顿 1 秒

### P5 Live Demo
- 如果有现场演示时间，扫 QR → 实演「鱼油 8 点提醒我」工具调用
- 没有时间就强调「中国大陆 + 微信内 + 真机已验证」

### P10 ASK
- 强调「不是来要钱的，是来找战略协同的」
- 谁能给我们一个介绍机会，谁就成为 VitaMe 第一个外部 supporter
