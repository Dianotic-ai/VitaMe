---
title: "Demo Pitch PPT Outline"
description: "VitaMe WAIC 黑客松 5 分钟汇报 PPT 结构（3 分钟讲 + 90s 视频 + 30s 缓冲），每片内容定位到具体 docs 章节。"
doc_type: "pitch-outline"
status: "draft"
created: "2026-04-24"
updated: "2026-04-24"
canonical: false
privacy: "internal"
tags: ["pitch", "demo", "waic", "ppt"]
source_docs:
  - "docs/product/定位.md"
  - "docs/product/当前判断.md"
  - "docs/product/Agent-北极星.md"
  - "docs/product/用户旅程.md"
  - "docs/product/路线图.md"
  - "docs/product/demo-script-map.md"
  - "docs/product/留存飞轮.md"
  - "docs/product/信任与Claims边界.md"
  - "docs/engineering/specs/system-architecture.md"
  - "docs/engineering/specs/agent-runtime-decision.md"
  - "CLAUDE.md"
---

# VitaMe — 5 分钟汇报 PPT 大纲

> 本文件是 PM 做 PPT 视觉版（Keynote / Figma / Slidev）的脚本和素材源。每片注明：时长、画面建议、speaker notes、原文档出处。
> 5 分钟分配：**PPT 正片 3 分 40 秒 + 90 秒 Demo 视频嵌入 + 30 秒 Q&A 缓冲**。

---

## 全局视觉约束

- 配色：4 个 risk token（`DESIGN.md §2.1`）——vita-red / vita-yellow / vita-gray / vita-green；辅助 brown/cream（SeedSprout 品牌色）
- 字体：品牌名 **VitaMe** 永远驼峰，禁止 CSS uppercase（见 auto-memory `feedback_brand_name_casing.md`）
- 每片左下角挂"Demo 阶段产品，未完成临床药剂师复核" 浮动 footer（对齐 DemoBanner 精神）

---

## Slide 1 — 封面（10s）

**画面**：
- 主标题：**VitaMe**
- 副标：从补剂安全判断开始的健康 Agent
- WAIC 2026 超级个体创业黑客松 · 2026-04-30
- 团队：Sunny（PM）+ 工程合伙人 + Claude Code（24×7 Copilot）

**Speaker notes**（10s）：
> "我们做了一个健康 Agent。它不是又一个聊天机器人，而是**能把你的病史和在用药，翻译成你能听懂的补剂安全判断**——并在那之上，通过提醒和反馈不断变得更懂你。"

**出处**：`docs/product/定位.md §1`

---

## Slide 2 — 真实痛点（30s）

**画面**：三栏对比
| 普通用户 | 有病史用户 | 家人照护者 |
|---|---|---|
| 看不懂 "柠檬酸镁 vs 氧化镁" 哪个吸收好 | 华法林 + 鱼油能一起吃吗？百度给 20 条矛盾答案 | 给妈妈买钙片，怎么和她的降压药配？ |
| → 通用搜索信噪比低 | → 大模型不敢给明确判断 | → 每次都要重问 |

**Speaker notes**（30s）：
> "补剂这件事上，用户缺的不是内容——小红书、知乎、抖音一搜全是。用户真正缺的是**把 ta 的个人上下文（病史、在用药、孕期、老人）映射到具体成分决定**的那一步。这件事，通用搜索做不了，通用大模型不敢做，医生没时间做，**但它每天在数亿人身上发生**。"

**出处**：`docs/product/定位.md §5-6` + `docs/product/当前判断.md §3`

---

## Slide 3 — Agent 解法（40s）

**画面**（左侧架构图 + 右侧红线）：

```
用户自然语言
  ↓
L0 意图识别（LLM NER + 确定性 grounding）
  ↓
L1 知识字典（8 源离线烘焙，运行时不联网）
  ↓
L2 判断引擎（确定性规则，LLM 不判风险）
  ↓
L3 翻译层（LLM 讲人话 + 模板兜底）
  ↓
Agent Shell（Vercel AI SDK ToolLoopAgent）
  ↓
用户：红卡 + 解释 + 下一步行动 + 保存选项
```

右侧 4 条红线（对齐 CLAUDE.md §11）：
1. 风险等级只能来自 L2 确定性规则
2. "未收录" 必须是灰色，不伪装成安全
3. LLM 解释不创规则
4. 每条判断必须有 `sourceRefs` 证据追溯

**Speaker notes**（40s）：
> "我们的架构有个关键选择：**LLM 不判风险**。红黄灰绿的判定来自 L2 层的确定性规则——NIH ODS、Linus Pauling、中国 DRIs、SUPP.AI 四源烘焙的 1500+ 条。LLM 只做两件事：理解用户在问什么（L0），和把结构化结论翻译成人话（L3）。这样评委和用户都能相信：VitaMe 不会因为模型 hallucination 给你一个假安全感。我们在 L0/L2/L3 之外，包了一层 Agent Shell，展示 AI 如何在受约束的工具集里调度工作。"

**出处**：`docs/engineering/specs/system-architecture.md` + `docs/engineering/specs/agent-runtime-decision.md` + `CLAUDE.md §3 + §10-11`

---

## Slide 4 — 产品演示视频嵌入（90s）

**画面**：全屏播放 `demo-v1.mp4`

**7 段分镜**（完整脚本见 `docs/product/demo-script-map.md §2`）：

| 时间 | 镜头 | 看点 |
|---|---|---|
| 0-10s | 打开 vitame.live（手机 WeChat WebView） | 首页一句话承诺 |
| 10-20s | 输入 "我妈在吃华法林，能吃辅酶 Q10 吗？" | 自然语言，不是表单 |
| 20-35s | Agent trace 可见：parseIntentTool → runJudgmentTool | AI 在调工具，不自己编 |
| 35-50s | 红色风险卡 + 明确原因 | L2 命中硬编码规则 |
| 50-65s | 人话解释 + 证据来源 + 免责声明 | L3 翻译 + DemoBanner |
| 65-80s | 下一步行动卡："先不自行服用 / 带结果问医生 / 保存给妈妈档案" | 不诊断不处方 |
| 80-90s | 北极星钩子："保存后可设提醒，反馈让 Agent 越来越懂你" | 留下长期想象 |

**Speaker transition**（嵌入前 5s）：
> "下面是 90 秒真实产品演示。这就是 WAIC 评委拿手机扫我们二维码就能看到的完整体验。"

**出处**：`docs/product/demo-script-map.md`

---

## Slide 5 — 合规与信任护城河（30s）

**画面**：3 层信任栈

```
┌─────────────────────────────────────┐
│  13 条合规红线（CLAUDE.md §11）          │
│  ├ 禁词（治疗/根治/诊断）regex 拦截      │
│  ├ 每条风险挂 sourceRefs              │
│  └ LLM 输出必过 Zod schema            │
├─────────────────────────────────────┤
│  DemoBanner（§11.11）                 │
│  未审核规则命中 → 顶部横幅"尚未临床复核"  │
├─────────────────────────────────────┤
│  Audit log（Upstash Redis）           │
│  每次判断/LLM 调用/拦截 → 可审计 JSONL    │
└─────────────────────────────────────┘
```

**Speaker notes**（30s）：
> "健康产品没有合规护城河就是空壳。我们有三层：13 条硬编码红线保证 LLM 不说"治疗"两个字；每条规则必须有 NIH / SUPP.AI 这样的权威来源引用；所有判断都写审计日志。**Demo 期间未经药剂师复核的规则，会主动挂警告横幅**——诚实比包装重要。"

**出处**：`CLAUDE.md §11` + `docs/product/信任与Claims边界.md` + `docs/engineering/specs/compliance.md`

---

## Slide 6 — 长期 Agent 北极星（30s）

**画面**：闭环动效图

```
Verify（买前查）
   ↓ 保存
Reminder（到点提醒）
   ↓ 服用
Feedback（一问一答）
   ↓ 沉淀
Memory（个人上下文）
   ↓ 归纳
Hermit Agent（周期观察）
   ↓ 提议
用户确认调整 ─┐
             └→ 回到 Verify / Reminder
```

**Speaker notes**（30s）：
> "P0 我们交付的是一把"判断刀"，但 VitaMe 的真正护城河在长期。每次你保存一个判断、每条反馈、每次提醒响应，都会变成 Agent 对你的理解。**Hermit Agent 每 7 天归纳一次**："我观察到你最近 3 次晚间服用 B 族后都反馈胃不舒服，要不要把提醒改到饭后？"——这不是替代医生，是替代"你自己也看不到的模式"。"

**出处**：`docs/product/Agent-北极星.md` + `docs/product/留存飞轮.md`

---

## Slide 7 — 路线图 + 团队 + CTA（20s）

**画面**：时间线 + 访问入口

```
P0 (Now)    │ 补剂安全判断 + Agent shell    │ vitame.live 上线
P1 (1 个月) │ + Reminder + Feedback 闭环     │ 小红书首批种子用户
P2 (3 个月) │ + Memory + Hermit Agent       │ 付费订阅转化
P3 (6 个月) │ + 处方药/睡眠/饮食/体检扩展    │ Pro tier / B 端 SDK
```

**团队**：
- PM：Sunny（产品 + 合规 + 药剂师外联）
- 工程：合伙人 1 名
- Copilot：**Claude Code 24×7 工程协作**（本 repo 90%+ 代码由 AI 在约束下产出，人类审核后合入）

**CTA**：
> "扫左侧二维码打开 vitame.live，或在微信搜 **VitaMe 补剂安全** 关注下一轮试用。"

**Speaker notes**（20s）：
> "我们是个 2 人团队 + Claude Code 作为第三名工程师——这本身就是"超级个体"的定义：一个人用 AI 能做一个团队的事。今天你看到的代码，4 天前还不存在。谢谢。"

**出处**：`docs/product/路线图.md` + `docs/START-HERE.md §6`

---

## 附录 — 常见 Q&A 备用口径（30s 缓冲）

| Q | A 要点 | 原文档 |
|---|---|---|
| 你们怎么保证医学准确性？ | 硬编码规则 + 4 权威源 + 药剂师审核（outreach 中）+ DemoBanner 诚实标注 | `CLAUDE.md §16` |
| LLM 不准怎么办？ | LLM 不判风险，只翻译；输出必过 Zod + 失败走模板 fallback | `CLAUDE.md §11.5-11.6` |
| 商业化路径？ | P1 免费、P2 付费订阅（Memory 云同步 + Pro Reminder）、P3 B 端 SDK | `docs/product/路线图.md` |
| 和 PillPack / 好医生 App 有什么不同？ | 他们做"管理已有处方"，我们做"判断要不要加"；入口不同决定护城河不同 | `docs/research/场景空白分析-竞品矩阵.md` |
| 监管风险？ | 不诊断、不处方、不导购；全程 disclaimer + 引导问医生；参照 NMPA 对健康类 App 的边界 | `docs/product/信任与Claims边界.md` |

---

## 待落实项

- [ ] demo 视频 (T-D11.2) — D11 录制
- [ ] PPT 视觉版 — PM 制作（建议 Keynote 或 Slidev，用 4 risk token 配色）
- [ ] 二维码 — 指向 vitame.live（D10 部署后生成）
- [ ] PM 口述试讲 — D11 晚上至少过 2 遍时长
