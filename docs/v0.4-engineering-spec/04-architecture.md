---
title: "v0.4 系统架构与运行时"
description: "Next 16 + Edge runtime + zustand 5 + AI SDK 6 系统全景图、关键时序、部署链路。"
doc_type: "architecture"
status: "active"
created: "2026-04-27"
canonical: true
---

# 系统架构

## 1. 技术栈版本（事实，2026-04-27）

```
"next": "^16.2.4"          (App Router, Turbopack 关闭用 webpack)
"react": "^18.3.1"
"typescript": "^6.0.3"
"tailwindcss": "^3.4.14"

"ai": "^6.0.168"           (Vercel AI SDK)
"@ai-sdk/react": "^3.0.170"
"@ai-sdk/anthropic": ...   (minimax 国际版用 Anthropic Messages 协议)

"zustand": "^5.0.12"       (注意 v5 selector 必须用 useShallow, 详见 06-data-model)
"zod": "^3.23.8"           (tool inputSchema)
"react-markdown" + "remark-gfm"  (chat bubble 渲染)
"nanoid"                   (ruleId / supplementId / personId / eventId)
"@upstash/redis" REST API  (Edge runtime audit log)
```

---

## 2. Runtime 拓扑

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (mobile-first)                   │
│                                                              │
│  ┌──────────────────────┐                                   │
│  │  Next.js Client      │                                   │
│  │  - React 18 app      │                                   │
│  │  - useChat hook      │  ◄────── stream tokens            │
│  │  - 4 zustand stores  │                                   │
│  │     (LocalStorage)   │                                   │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ fetch                                            │
│           ▼                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │ HTTPS
            ▼
┌─────────────────────────────────────────────────────────────┐
│           Vercel Serverless (vitame.live)                   │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │  /api/chat          │    │  /api/extract       │         │
│  │  Edge runtime       │    │  Node runtime       │         │
│  │  streamText + tools │    │  generateText       │         │
│  │  maxDuration 60     │    │  maxDuration 30     │         │
│  └──────────┬──────────┘    └──────────┬──────────┘         │
│             │                           │                    │
│  ┌──────────▼──────────┐                │                    │
│  │  /api/hermit        │                │                    │
│  │  Node runtime       │                │                    │
│  │  generateText       │                │                    │
│  │  maxDuration 30     │                │                    │
│  └──────────┬──────────┘                │                    │
│             │                           │                    │
└─────────────┼───────────────────────────┼────────────────────┘
              │                           │
              ▼                           ▼
   ┌──────────────────┐        ┌──────────────────┐
   │  minimax 国际版  │        │  Upstash Redis   │
   │  Anthropic 协议  │        │  REST (audit)    │
   │  api.minimax.io  │        │  hash + sourceId │
   │       /anthropic │        │  无明文           │
   └──────────────────┘        └──────────────────┘
```

### 2.1 关键路径 runtime 选择

| 路由 | runtime | 理由 |
|---|---|---|
| `/api/chat` | **edge** | 流式不受 Vercel Hobby 60s 限制 |
| `/api/extract` | nodejs | 普通 JSON 响应，5-8s 延迟用户感知不到 |
| `/api/hermit` | nodejs | 同上，stateless LLM call |
| `/api/agent` `/api/intent` 等 v0.2 | nodejs | 老路径锁定 |

### 2.2 vercel.json（无）/ 配置

部署仅 `next build` + Vercel 默认配置。无 vercel.json，无 cron job，无 cache override。

---

## 3. Chat 流式时序（核心交互）

```
┌─User─┐         ┌──useChat──┐       ┌─/api/chat─┐      ┌──minimax──┐
   │              │                          │                          │
   │── send ────►│                          │                          │
   │              │── POST messages,profile─►│                          │
   │              │                          │── retrieveFacts          │
   │              │                          │── buildSystemPrompt      │
   │              │                          │── input audit (sync)     │
   │              │                          │── streamText(tools) ────►│
   │              │                          │                          │
   │              │◄── SSE: text chunks ─────┤                          │
   │◄── render ──│                          │                          │
   │              │                          │                          │
   │              │◄── SSE: tool-call ───────┤                          │
   │              │                          │                          │
   │              │── onToolCall (client) ──┐│                          │
   │              │   - addRule              ││                          │
   │              │   - addToolResult ──────┘│                          │
   │              │                          │                          │
   │              │── auto-resend (sendAutomaticallyWhen)               │
   │              │── POST messages+result ─►│── stream confirm text ──►│
   │              │◄── SSE: text chunks ─────┤◄────────────────────────┤
   │◄── render ──│                          │                          │
   │              │                          │── onFinish:              │
   │              │                          │   - banned word scan     │
   │              │                          │   - output audit (async) │
   │              │                          │                          │
   │              │── onFinish (client) ────┐│                          │
   │              │   - extractRef.add       ││                          │
   │              │   - POST /api/extract ──┘│                          │
   │              │     (fire-and-forget)    │                          │
   │              │                          │                          │
   │              │── append verify event ──►LocalStorage memory       │
```

### 3.1 关键不变量

- **Tool 处理在客户端**（无 server-side execute）— 因 reminder 数据在 LocalStorage（§9.8 隐私底线）
- **Extract 仅一次每 turn**（`processedExtractRef`）— 防 hydration 重复触发（Codex Finding #2）
- **Audit input 同步**（流前可拒）/ **output async**（流已开始无法撤回）
- **历史裁剪**：UI 全保留，发 LLM 仅最近 10 条 UI message ≈ 5 轮

---

## 4. 客户端状态架构（4 个 zustand store）

```
┌─────────────────────────────────────────────────────┐
│              vitame-profile-v2                      │
│  (UserProfile)                                      │
│  - schemaVersion: 2                                 │
│  - sessionId (永久 nanoid)                          │
│  - people: Person[] (含 currentSupplements)         │
│  - activePersonId                                   │
└─────────────────────────────────────────────────────┘
              ▲                        │
              │ activePersonId 关联      │ supplementId 关联
              │                        ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ vitame-conversation-v2  │  │   vitame-reminder-v1    │
│ messagesByPersonId      │  │   rules: ReminderRule[] │
│   Record<id, UIMsg[]>   │  │   - personId            │
│ 每 person 上限 12 条    │  │   - supplementId        │
│ v1→v2 自动迁移          │  │   - timeOfDay (任意)    │
└─────────────────────────┘  │   - daysOfWeek          │
                             │   - frequencyMultiplier │
                             │   - consecutiveSkips    │
                             └─────────────────────────┘
                                       │
                                       │ ackRule 写
                                       ▼
                             ┌─────────────────────────┐
                             │   vitame-memory-v1      │
                             │   events: MemoryEvent[] │
                             │   - 5 类 eventType      │
                             │   - personId / entityRefs│
                             │   - MAX 500 条          │
                             └─────────────────────────┘
```

详见 `06-data-model.md`。

---

## 5. KB Retriever 数据流（无 LLM）

```
user query "鱼油 + 华法林"
       │
       ▼
extractMentions(query) ──► alias index (load-time built from L1 db)
       │                  ┌─ CN_DRI_VALUES (中国营养学会 DRIs)
       │                  ├─ LPI_VALUES (Linus Pauling Institute)
       │                  ├─ SYMPTOM_INGREDIENTS
       │                  ├─ CONTRAINDICATIONS (硬编码)
       │                  └─ SUPPAI_INTERACTIONS
       │
       ▼
{ ingredients, medications, conditions, specialGroups, symptoms } 集合
       │
       ▼
+ profile.conditions/medications/currentSupplements 隐式 mention（Codex #4）
       │
       ▼
对每个 entity 跑 5 张表，每源 ≤10 条 facts
       │
       ▼
Critical 高危组合 → isCritical=true 标记
       │
       ▼
RetrievedFacts { facts[], criticalHits, ingredientSlugs, medicationSlugs }
       │
       ▼
buildSystemPrompt 注入 <retrieved_facts> + criticalBanner
```

零 LLM 调用，纯字典 lookup，~100ms。

---

## 6. 部署链路

```
git push origin main
       │
       ▼
GitHub: Dianotic-ai/VitaMe
       │
       ▼ (Vercel webhook)
Vercel CI build (npm run build)
       │
       ├─ build success → deploy → vitame.live
       └─ build fail → 邮件通知 + Vercel UI red status
```

### 6.1 域名

- `vitame.live` — main 分支生产域，国际 TLD（无 ICP 备案，但中国大陆访问 OK）
- preview URL 模板：`vita-me-git-{branch-slug}-hejiayaoisthebest-4040s-projects.vercel.app`
- DNS：Dynadot 直配 Vercel A 记录 + CNAME（不走 Cloudflare）

### 6.2 环境变量（.env.local / Vercel project）

```
LLM_PROVIDER=minimax-intl
LLM_MODEL=MiniMax-M2.7
LLM_BASE_URL=https://api.minimax.io/anthropic
LLM_API_KEY=<intl token>

NEXT_PUBLIC_AGENT_MODE=1

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 6.3 关键 trick

- minimax 的 baseURL 不带 `/v1`，AI SDK Anthropic provider 拼 `{base}/messages` → 404
- 解：`createChatProvider` 手工补 `/v1`（CLAUDE.md §14 坑 #7）

---

## 7. 性能特征

| 链路 | 延迟（典型）|
|---|---|
| 首屏 chat 加载（CDN cold cache）| 1-2s |
| `/api/chat` 第一个 token | 1-2s（minimax 国际版冷启）|
| `/api/chat` 完整流（5 段六段式回答）| 4-8s |
| KB Retriever | ~100ms |
| `/api/extract` | 5-10s（fire-and-forget，用户不感知）|
| `/api/hermit` | 8-15s（用户主动触发，loading state）|

---

## 8. 缩放点 / 已知瓶颈

- **LocalStorage 5MB 上限**：单 person 12 条 message + 500 条 event + N 条 rule，累积 ~1MB；多 person 接近上限；P3 加云端
- **minimax 国际版速率限制**：未定，长 chat 流可能触发；P3 加 fallback / retry
- **Audit 写失败**：流后失败仅 stderr，详见 `07-compliance.md`
- **Tool stepCountIs(2)**：tool-call → tool-result → 最终确认 共 2 step；不支持 LLM 连续多 tool 调用

---

**事实源**：`package.json` + `vercel.json` (无) + `src/app/api/*/route.ts` + `next.config.*`
