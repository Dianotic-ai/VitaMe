---
title: "Action-First MVP PRD"
description: "定义 VitaMe 当前 MVP 的目标、用户故事、功能范围、优先级和验收标准。"
doc_type: "prd"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "prd", "requirements"]
---

# Action-First MVP PRD

## 1. 目标

在本地跑通一个可测的 Action-First MVP，让用户不建档也能完成从“症状/商品”到“怎么选、怎么买前看什么、怎么吃、怎么记录效果”的闭环。

## 1.1 可衡量目标

| 指标 | P0 目标 | 测量方式 |
|---|---|---|
| 首轮行动建议完成率 | 本地手测 5 个症状场景全部得到六段式回答 | 验收记录 M2 + 额外 seed 场景 |
| URL 解析链路可用率 | 至少 1 个静态 fixture 成功解析，1 个 403 页面进入 fallback | Unit tests + M7/M8 |
| Routine 保存闭环 | 症状场景能从建议进入 RoutineConfirmCard 并保存成功 | M3/M4/M5 |
| 高危零 LLM 调用 | 华法林/孕期等高危输入不触发 LLM provider 请求 | Network 检查 M9 |

## 2. 目标用户

### 主用户

普通保健品购买者：

- 有身体感受或改善目标，但不知道对应成分。
- 会在 iHerb、品牌官网、电商详情页看产品。
- 不愿意第一次使用就填写健康档案。
- 需要知道早 / 中 / 晚 / 睡前怎么吃。

### 次用户

帮家人临时询问的用户：

- 会说“我妈在吃华法林”。
- 需要产品识别风险。
- MVP 只把这当作本轮对话上下文和安全判断输入，不提供家人档案功能。

## 3. 用户故事

| ID | 用户故事 | 优先级 |
|---|---|---|
| U1 | 作为新用户，我想直接说“最近熬夜眼睛酸”，不用先建档案。 | P0 |
| U2 | 作为新用户，我想知道应该关注哪些成分、规格、剂量和服用时间。 | P0 |
| U3 | 作为用户，我想粘贴官网商品页 URL，让 Agent 帮我看这个产品规格是否合适。 | P0 |
| U4 | 作为用户，我想把建议整理成早 / 中 / 晚 / 睡前，像药盒一样执行。 | P0 |
| U5 | 作为用户，我只在确认保存后才让产品记录我的提醒和行动事件。 | P0 |
| U6 | 作为高风险用户，我提到华法林、孕期等情况时，希望产品先拦截风险。 | P0 |
| U7 | 作为复访用户，我想看到之前保存的今天怎么吃，并记录 3 天后效果。 | P0 |
| U8 | 作为帮家人询问的用户，我可以在一句话里说明“我妈/我爸”的情况，但产品不要让我建家人档案。 | P0 |

## 4. 功能优先级

P0 必须完成：

- Chat-first 首屏。
- 症状 seed。
- Product Inspect URL 解析。
- 商品规格文本 fallback。
- 六段式 Agent 回答。
- Safety red flag pre-check。
- RoutineConfirmCard。
- RoutineSummaryStrip。
- RoutineDrawer。
- NextActionChip。
- DetailDrawer。
- LocalStorage routine store。
- Action memory event store。

P0 禁止进入主路径：

- PersonSwitcher。
- `/profile` 作为首访入口。
- 每轮 `/api/extract`。
- 自动 profile summary。
- Memory timeline header 入口。
- Hermit 主路径入口。
- 功能 dock。

后续另行评审：

- 多人健康档案。
- Reminder 中心页。
- Feedback ritual 自动弹窗。
- Hermit observation。
- 云端同步。
- 拍照/OCR。
- 价格、渠道、优惠推荐。

## 5. 核心状态机

```text
P0: clean chat-only, no routine materialized
  routine.items = []
  /api/chat body = { sessionId, messages }
  header: logo + new chat + detail
  no PersonSwitcher

用户点击 RoutineConfirmCard 的“保存到我的提醒”
  ↓
P1: local action materialized
  routine.items.length > 0
  actionMemory.events contains user-confirmed routine event
  /api/chat body may include compact safetyMemory only from explicit saved action memory
  header still has no PersonSwitcher
  RoutineSummaryStrip shows real slot counts
```

状态判定只看 `routine.items.length`。`actionMemory` 是显式行动日志，不决定 P0/P1，也不能驱动 UI 进入档案模式。

清空 routine 后，主路径回到 P0：顶部药盒条消失，`/api/chat` 不再携带 `safetyMemory`。历史 actionMemory 默认保留在 DetailDrawer 里，只有“清空全部本地数据”才删除。

## 6. MVP 用户流程

### 症状到行动

```text
首访
  → 点“最近熬夜眼睛酸”
  → Agent 输出六段建议
  → CTA “整理成早 / 中 / 晚 / 睡前”
  → Agent 输出时间方案
  → RoutineConfirmCard 预览
  → 用户编辑并保存
  → 顶部药盒条出现
```

### 商品到判断

```text
用户粘贴官网 URL
  → ChatInput 自动识别 URL
  → /api/product/inspect 抓取并解析
  → 把商品事实作为本轮临时上下文发送
  → Agent 输出“页面写了什么 / 规格够不够 / 怎么吃 / 还缺什么”
  → 可继续整理成早 / 中 / 晚 / 睡前
```

单纯粘贴 URL 不写 actionMemory。只有用户保存由该商品生成的 routine，或主动记录这次判断，才写 actionMemory。

### 高危拦截

```text
用户输入“我在吃华法林，想吃鱼油”
  → detectRedFlags 命中 anticoagulant
  → 不调用 LLM
  → 直接返回硬路由
  → 不展示保存提醒 CTA
```

高危输入默认只作为本轮 transient safety context，不落 actionMemory，不创建个人或家人档案。只有用户后续显式保存“安全声明”时，才允许写 `safety_user_declared` event。

## 7. Agent 回答必须包含

每次建议型回答必须覆盖：

1. 当前状况判断。
2. 适合关注的成分/规格。
3. 剂量和时间。
4. 禁忌和忌口。
5. 不处理或盲目吃的风险。
6. 服用后观察什么。

商品解析回答还必须覆盖：

1. 官网明确写了什么。
2. 规格是否满足需求。
3. 还缺什么信息。
4. 哪些判断不是官网事实。

## 8. 验收标准

- 新用户打开 `/chat`，无档案入口压迫感。
- 不填写任何档案也能完成建议。
- 粘贴 URL 时有实际抓取尝试，不是只提示手动粘贴。
- P0 状态 Network 不出现 `/api/extract`。
- P0 状态 `/api/chat` request body 不包含 `profile`、`userMentioned` 或任何健康档案快照。
- 高危命中不调用 LLM。
- 保存提醒是显式确认，不是 LLM 自动帮用户保存。
- 清空 routine 后主路径回到干净状态。

## 9. 已关闭的产品决策

| 问题 | 决策 |
|---|---|
| 高危输入是否持久化 | 默认不持久化，只做本轮 pre-check；显式保存安全声明才写 actionMemory |
| 清空 routine 是否删除 actionMemory | 不默认删除；主路径回 P0，历史只在 DetailDrawer；“清空全部本地数据”才删除 |
| Product Inspect 是否写 memory | 单纯 URL 解析不写；保存方案或主动记录判断才写 |
| crawl4ai 是否必须 | 不是必须，不能阻塞 P0；fetch/parser 先满足 fixture 和 fallback |
| `safetyMemory` 是否进入 LLM | 仅 P1 且仅来自显式 actionMemory 摘要；P0 永不注入 |
| 旧 `vitame-profile-v2` 如何处理 | 不迁移、不读取、不展示为 MVP 状态源 |
