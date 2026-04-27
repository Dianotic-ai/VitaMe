# VitaMe

> ⚠️ **重要提示（2026-04-27 起）**：本仓库 main 分支当前**同时存在**两套互相矛盾的产品基准：
> - 📦 代码 = v0.4 northstar loop（多 person + Memory + Reminder + Hermit + extract 等）
> - 📄 `docs/action-first-mvp/` Kevin 的产品锁（明确禁多 person / 禁 extract / 禁 profile 注入）
>
> WAIC 4/30 demo 期内**不强行对齐**。接手前请先读 [`docs/v0.4-vs-action-first-divergence.md`](./docs/v0.4-vs-action-first-divergence.md) 了解矛盾点 + 解决路径，再动代码。

**你的保健品顾问 + 服用伴侣 — 选对、吃对，越吃越懂你。**

VitaMe 是一个对话式保健品决策 Agent：用户用自然语言聊补什么、买哪个、跟现有用药/疾病冲不冲突；从对话里建立提醒、积累反馈，越用越懂用户身体。

主要场景：
1. **安全检查** — 「我妈在吃华法林，能吃辅酶 Q10 吗？」红黄绿灯 + 引证
2. **选品决策** — 「经常熬夜想补一补」5 轮内收敛到成分 / 剂量 / 服用时间 / 候选品牌
3. **服用伴侣** — 在对话里说「鱼油每天 8 点提醒我」→ AI 直接调工具创建提醒规则
4. **越用越懂** — 跨会话健康档案（疾病/用药/在吃保健品/家人）+ 事件时间轴 + Hermit 周期归纳

---

## Live

| 环境 | URL | 分支 | 用途 |
|---|---|---|---|
| 生产 | [vitame.live](https://vitame.live) | `main` (= `v0.3-rag-chatbot`) | WAIC 4/30 demo 用 |
| Preview | [v04-preview](https://vita-me-git-v04-northstar-loop-hejiayaoisthebest-4040s-projects.vercel.app) | `v0.4-northstar-loop` | 北极星完整 loop |

Vercel push 即自动部署。

---

## 当前架构（v0.4）

```
用户输入
  → /api/chat (Edge + streamText + tools)
    → KB Retriever (8 权威源关键词检索)
    → System prompt 注入 (角色 + retrieved facts + user_profile)
    → minimax 国际版流式输出 + tool calls
  → useChat (前端流式渲染)
    ├─ MessageBubble (markdown + 表格 + 引证 pill)
    ├─ QuickReplies (1./2./3. 选项 → 可点击行 + 「其他」「跳过」)
    └─ Tool handler (create_reminder → reminderStore)

数据持久化（全部客户端 LocalStorage，§9.8 隐私底线）：
  ├─ profile     (人 + 疾病/用药/过敏/在吃保健品/家人档案)
  ├─ memory      (verify/reminder/feedback/observation/correction 事件流)
  ├─ reminder    (规则 + 暂停/降频/skip 计数)
  └─ conversation (对话历史，每 person 独立)
```

---

## 页面

| Route | 内容 |
|---|---|
| `/chat` | 主对话入口。Reminder banner + Feedback prompt + PromptInspector（"AI 看到什么"）+ 多 person 切换 |
| `/profile` | 健康档案管理（多 person + 疾病/用药/过敏/在吃保健品 + 提醒规则编辑器）|
| `/reminders` | 提醒中心：今日时间表（已吃/待提醒/过期/跳过）+ 全部规则按保健品分组 |
| `/memory` | 事件时间轴（按日分组）+ Hermit 周期归纳触发按钮 |
| `/archive` 等 | v0.2 老路径，锁定不动（CLAUDE.md §10）|

---

## 北极星 5 段 loop（已实现）

| 段 | 实现 |
|---|---|
| §3 Reminder | 浏览器 in-app banner + 规则编辑器 + 连续 skip 自动降频 + chat 内 tool use 直接创建 |
| §4 Feedback Ritual | 每次只问一个问题（taken/feeling/time-adjust）+ 严重异常关键词硬拦截 |
| §5 Memory | 事件流 schema (5 类 event)，仅本地 |
| §6 Hermit Agent | 客户端按需触发的归纳器（不诊断/不归因/不自动改方案）|
| §7 Self-evolution | observation 用户可见 + accept/dismiss 写 correction 事件 |
| §8 Privacy | LOCAL 徽章 + PromptInspector 透明化 + 一键清档 |

详见 [`docs/v0.4-handoff-2026-04-26.md`](./docs/v0.4-handoff-2026-04-26.md) — partner 验证清单。

---

## 技术栈

- **框架**: Next.js 16 App Router · TypeScript strict · Tailwind 4
- **AI SDK**: `ai` v6 + `@ai-sdk/react` v3 + `@ai-sdk/anthropic`
- **LLM**: minimax 国际版 (Anthropic Messages 协议)
- **流式**: Vercel Edge runtime + `streamText` + tool use
- **客户端状态**: zustand v5 + persist (LocalStorage)
- **Markdown**: react-markdown + remark-gfm（表格 / 列表 / 加粗）
- **Audit**: Upstash Redis REST
- **部署**: Vercel (main → vitame.live, branches → preview)

---

## 项目结构

```
src/app/
  api/chat/route.ts          Edge streaming + tool wiring
  api/extract/route.ts       post-turn 健康信息抽取
  api/hermit/route.ts        Hermit 归纳器（无状态）
  chat/                      主对话页 + 组件
  profile/                   档案管理
  memory/                    事件时间轴
  reminders/                 提醒中心

src/lib/
  chat/
    retriever.ts             KB 检索 (8 源关键词 grep)
    systemPrompt.ts          XML scaffold + 引证规则 + 选项格式铁律
    tools.ts                 create_reminder tool 定义
    conversationStore.ts     对话历史 zustand persist
  memory/                    MemoryEvent schema + eventStore
  reminder/                  ReminderRule + store + computeDueRules
  feedback/                  triggerRule + urgent 关键词检测
  profile/                   多 person profile + memoryExtractor
  llm/edgeProvider.ts        Anthropic provider with /v1 baseURL fix

src/components/
  chat/                      MessageBubble / MessageList / QuickReplies / PromptInspector
  reminder/                  ReminderBanner / ReminderRuleEditor
  memory/                    MemoryTimeline / EventCard / HermitButton
  feedback/                  FeedbackPrompt
  brand/                     Logo / Icons / VitaMeLogo / PersonMark

src/lib/db/                  L1 静态权威源（NIH ODS / LPI / DRIs / SUPP.AI / 硬编码禁忌等）
src/lib/capabilities/        v0.2 老 4 层（intent / judgment / translation），锁定不动
```

---

## 8 条合规红线（CLAUDE.md §9）

1. Disclaimer 强制（每条输出末尾必带 + 后置补齐）
2. Banned vocab（治疗/治愈/处方/药效/根治 → 后置 regex 替换 + audit）
3. Critical 硬编码命中（华法林×维K / SSRI×圣约翰草 / 鱼油×华法林 等）
4. sourceRefs 必有（每条 retrieved fact 带源；引证格式「国家/地区 + 英文缩写」如 `美国 NIH ODS`）
5. 数据最小化（不收姓名/地址/身份证）
6. Audit log 不能停（Upstash Redis）
7. DemoBanner 顶部固定挂
8. 健康档案隐私（仅 LocalStorage，**不上服务器**）

---

## Commands

```bash
npx next dev --webpack --port 3000   # 避 Turbopack 字体 bug
npm run build && npm run start
npm run typecheck
npm run test:unit
```

环境变量：
```
LLM_PROVIDER=minimax-intl
LLM_MODEL=MiniMax-M2.7
LLM_BASE_URL=https://api.minimax.io/anthropic
LLM_API_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_AGENT_MODE=1
```

---

## 文档入口

| 文件 | 用途 |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | v3.0 工程基线（必读）|
| [`docs/SESSION-STATE.md`](./docs/SESSION-STATE.md) | 当前进度 ledger |
| [`docs/product/Agent-北极星.md`](./docs/product/Agent-北极星.md) | 长期方向 |
| [`docs/product/P0-执行总纲.md`](./docs/product/P0-执行总纲.md) | P0 基线 |
| [`docs/v0.4-handoff-2026-04-26.md`](./docs/v0.4-handoff-2026-04-26.md) | v0.4 partner 验证清单 |
| [`docs/engineering/specs/`](./docs/engineering/specs/) | API 契约 / data flow / 合规 |
| [`docs/known-blockers.md`](./docs/known-blockers.md) | 部署 / fetch / SSL 等已知坑 |

---

## 分支策略

- `main` (= `v0.3-rag-chatbot`) — 生产，WAIC 4/30 demo 用，**不动**
- `v0.4-northstar-loop` — 完整北极星 loop，partner review 中
- v0.2 老路径（v2.10 严格 4 层架构）保留在 git tag `v0.2`，可随时 checkout 回滚
