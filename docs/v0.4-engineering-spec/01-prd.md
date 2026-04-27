---
title: "v0.4 PRD（按当前实现）"
description: "v0.4 northstar loop 实际跑出来的产品需求 — 定位/用户/场景/scope/合规边界，反向写给下一版本参考。"
doc_type: "prd"
status: "active"
created: "2026-04-27"
canonical: true
related:
  - ../product/Agent-北极星.md
  - ../product/P0-执行总纲.md
  - ../action-first-mvp/01-prd.md
  - ../v0.4-vs-action-first-divergence.md
---

# v0.4 PRD — 按当前实现反向整理

## 1. 一句话定位

**你的保健品顾问 + 服用伴侣 — 选对、吃对，越吃越懂你。**

VitaMe 是一个对话式保健品决策 + 服用陪伴 Agent，用自然语言聊该补什么、买哪个、跟现有用药/疾病冲不冲突；从对话里建立提醒、记录反馈、积累跨设备一致的家人健康档案。

实际代码端：`src/components/chat/EmptyState.tsx` 副标 + `src/app/layout.tsx` meta。

---

## 2. 目标用户

### 2.1 主用户：30-50 岁中产家庭主理人

- 自己买保健品，也帮长辈/孩子买
- 有"花了钱但不知道吃得对不对"的焦虑
- 能流利使用对话式 UI（已习惯 ChatGPT / 微信小程序）
- 通常微信内打开链接，少数桌面浏览器

### 2.2 次用户：长辈

- 50+ 高血压 / 高血脂 / 糖尿病常见
- 微信操作熟，复杂 UI 不熟
- 通过子女转发链接接触
- 关心"会不会跟我吃的药冲突"

### 2.3 不是目标用户

- 临床医生（不是医疗工具）
- 健身/竞技人群（不卖蛋白粉/肌酸功效）
- 已有完整营养师方案的用户（不替代专业服务）

---

## 3. 核心问题

用户买保健品时面对：
- 成分太多看不懂
- 不知道剂量该多少 / 什么时候吃
- 担心跟现有用药/疾病冲突
- 买了之后忘记吃 / 不知道是否有效
- 给家人买时记不住每个人的情况

VitaMe 把这条决策链 + 服用链放在**一个对话里**完成。

---

## 4. 8 个核心场景（验收基线）

| # | 场景 | 用户输入 | 预期行为 | 涉及组件 |
|---|---|---|---|---|
| S1 | 高危拦截 | "我妈在吃华法林，能吃辅酶 Q10 吗？" | 🔴 红色警告 + 引证 + 不让 LLM 凭训练答 | retriever 必命中 hardcoded contraindication |
| S2 | 5 轮选品 | "经常熬夜想补一补" | 5 轮内收敛到成分 / 剂型 / 剂量 / 服用时间 / 候选品牌 | systemPrompt 多轮收敛策略 |
| S3 | 引证 pill | 任意推荐含剂量 | 行内 `[来源: 国家 + 英文缩写]` 渲染成可点击徽章 | CitationPill + retriever sourceLabel |
| S4 | 选项可点 | AI 给 1./2./3. 选项 | 渲染成可点击行（PersonSwitcher 风格）+ 「其他/跳过」补充 | QuickReplies + 三策略 fallback parser |
| S5 | 对话设提醒 | "鱼油每天 8 点提醒我" | AI 调 `create_reminder` tool → 自动加保健品 + 创建规则 | chatTools + chat/page.tsx onToolCall |
| S6 | 服用反馈 | 设了提醒 24h 后访问 /chat | FeedbackPrompt 弹窗（taken / feeling / time-adjust 三选一）| feedbackTrigger + FeedbackPrompt |
| S7 | 多 person 切换 | 加家人档案 → chat 切人 | 历史隔离 / profile 注入只发当前 person | useChat key + conversationStore.messagesByPersonId |
| S8 | Hermit 周期归纳 | /memory 累积 5+ 事件后点「帮我看看」| LLM 归纳 ≤3 条 observation card，可 accept/dismiss | /api/hermit + HermitButton + EventCard |

---

## 5. Scope

### 5.1 In scope（已实现）

- ✅ 流式对话 chat（Vercel Edge + streamText）
- ✅ KB Retriever 关键词检索 8 权威源
- ✅ 多 Person 健康档案（疾病/用药/过敏/在吃保健品）
- ✅ Memory 事件流（verify/reminder/feedback/observation/correction 5 类）
- ✅ Reminder 规则 + chat header Pill Box × Seed signature
- ✅ Feedback ritual 单问题弹窗 + 严重异常关键词硬拦截
- ✅ Hermit Agent 客户端按需周期归纳
- ✅ AI tool use（create_reminder）
- ✅ 跨会话健康档案自动抽取（每轮 chat 后 `/api/extract`）
- ✅ PromptInspector 透明视图（"AI 看到什么"）
- ✅ /reminders 提醒中心（今日时间表 + 全部规则）

### 5.2 Out of scope（v0.4 不做）

- ❌ 用户登录注册（数据全 LocalStorage，丢就丢）
- ❌ 实时价格 / 电商导购
- ❌ 体检报告 OCR / 拍照识别
- ❌ Push notification（PWA service worker）
- ❌ Hermit 自动周期触发（仅手动按钮）
- ❌ 微信扫码登录（个人主体限制，详见 5/1 后路径）
- ❌ Product Inspect（URL 抓取商品页）— action-first 提的，v0.4 没做
- ❌ Routine 4-slot 数据模型重构 — Pill Box 是渲染时 bucket，rule 仍是任意 timeOfDay

### 5.3 后续考虑（P3）

- 注册 + 数据持久化（手机号 OTP / 邮箱 magic link / 微信扫码）
- 真 push 提醒（PWA 或小程序）
- Hermit cron 自动归纳（前提：用户开 cloud memory）
- 字段级隐私上行开关（哪些数据上云）
- Memory 导出/导入 JSON

---

## 6. 合规边界（8 红线，活的，不可破）

详见 `07-compliance.md`。这里只列名：

1. Disclaimer 强制
2. Banned vocab（治疗/治愈/处方/药效/根治/诊断 + cure/prescribe/diagnosis）
3. Critical 高危组合硬编码（华法林×维 K / 鱼油 / SSRI×圣约翰草等）
4. sourceRefs 必有
5. 数据最小化（不收姓名 / 地址 / 身份证）
6. Audit log 不能停（Upstash Redis）
7. DemoBanner 顶部固定挂
8. 健康档案隐私（仅 LocalStorage）

---

## 7. 成功指标（demo 期）

WAIC 4/30 demo 期没有量化 KPI，但**人工 review 验收**：

- partner / Kevin / 评委自助跑通 8 个核心场景全部成功
- mom 用户在中国大陆能访问 vitame.live 且对话流畅
- 对话回复出现禁词 = 0
- 高危场景全部命中硬路由

post-WAIC 增加量化指标：

| 指标 | 目标 |
|---|---|
| 首轮决策完成率（5 轮内拿到成分推荐）| ≥ 60% |
| 高危场景拦截准确率 | 100% |
| 引证覆盖率（剂量/禁忌句子带 [来源: ...]）| ≥ 80% |
| 单 chat 平均轮数 | 3-5 轮 |
| 设过提醒的用户 7 日留存 | ≥ 30% |

---

## 8. 跟 action-first 文档的差异

`docs/action-first-mvp/` 是 Kevin 提出的下一版方向，明确拆掉以下 v0.4 已实现的功能：

- 多 person 档案 → action-first 不做
- 每轮 `/api/extract` → action-first 禁
- profile 注入 chat → action-first 禁
- Hermit 进 P0 → action-first 推迟
- Reminder 中心复杂规则管理 → action-first 暂缓

⚠️ 这是**已知 divergence**，详见 `docs/v0.4-vs-action-first-divergence.md`。

WAIC 4/30 之前 demo 用 v0.4。5 月之后由 Kevin 决定走路径 A（重写代码贴 action-first）/ B（重写文档承认 v0.4 是新方向）/ C（双轨）。

---

**事实源**：`src/lib/chat/systemPrompt.ts` + `CLAUDE.md` v3.0 + 本目录其他文档
