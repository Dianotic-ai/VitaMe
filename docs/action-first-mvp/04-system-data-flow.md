---
title: "Action-First MVP 概要设计与数据流"
description: "定义系统边界、API、状态存储、请求链路和隐私数据流。"
doc_type: "system-design"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "architecture", "data-flow"]
---

# 概要设计与数据流

## 1. 系统边界

```text
Browser
  ├─ /chat React UI
  ├─ LocalStorage
  │   ├─ conversation
  │   ├─ routine
  │   └─ actionMemory
  └─ fetch APIs
      ├─ /api/chat
      └─ /api/product/inspect

Server
  ├─ safety pre-check
  ├─ RAG retriever
  ├─ product inspect crawler/parser
  └─ LLM provider
```

服务端不持久化用户健康档案。Audit 只能记录 hash、source ids、critical hits，不记录明文健康信息。

## 2. Chat 数据流

### P0

```text
User message
  ↓
detectRedFlags(latestUserText)
  ├─ hit → static hard route response
  └─ pass
      ↓
retrieveFacts(latestUserText)
      ↓
buildSystemPrompt({ retrieved })
      ↓
streamText
      ↓
MessageList render
      ↓
NextActionChip / RoutineConfirmCard
```

P0 请求体：

```json
{
  "sessionId": "local-session-id",
  "messages": []
}
```

P0 禁止：

```json
{
  "profile": {},
  "userMentioned": {},
  "healthProfile": {}
}
```

### P1

```text
Routine saved
  ↓
append actionMemory event
  ↓
future /api/chat may include compact safetyMemory summary only when routine exists
```

P1 请求体可选：

```json
{
  "sessionId": "local-session-id",
  "messages": [],
  "safetyMemory": {
    "events": [
      { "type": "safety_user_declared", "summary": "用户提到正在使用华法林" }
    ]
  }
}
```

## 3. Product Inspect 数据流

```text
ChatInput paste URL
  ↓
detectUrl
  ↓
show inspecting chip
  ↓
POST /api/product/inspect { url }
  ↓
fetch/crawl page
  ↓
parse structured fields
  ↓
return ProductInspectResult
  ↓
formatProductInspectMessage
  ↓
send as temporary product context message
  ↓
LLM compares product facts with user need
```

这条流程默认不写 actionMemory。商品事实只缓存到 `vitame-product-inspect-v1`，用于透明展示和 DetailDrawer。只有用户保存 routine 或显式保存商品判断时，才写 actionMemory。

抓取失败：

```text
FETCH_403 / timeout / parse empty
  ↓
UI 显示失败原因
  ↓
提示用户粘贴 Supplement Facts 或包装文字
  ↓
POST /api/product/inspect { text }
```

## 4. Routine 数据流

```text
Assistant gives schedule
  ↓
parseRoutineSlots(assistantText)
  ↓
RoutineConfirmCard preview
  ↓
User edits
  ↓
User clicks save
  ↓
routineStore.addItems
  ↓
actionMemory.append routine_saved event
  ↓
RoutineSummaryStrip appears
```

保存是唯一物化点。不能由 LLM tool-call 自动写入 routine。

RoutineDrawer 的“清空今天药盒”只清空 `vitame-routine-v1`，让主路径回到 P0。它不删除 `vitame-action-memory-v1`。DetailDrawer 的“清空全部本地数据”才同时清空 routine、actionMemory、productInspect cache 和 conversation。

## 5. LocalStorage Keys

| Key | 内容 | P0 初始 |
|---|---|---|
| `vitame-conversation-v1` | 对话历史 | 可为空 |
| `vitame-routine-v1` | 早 / 中 / 晚 / 睡前条目 | `items=[]` |
| `vitame-action-memory-v1` | 显式行动事件，不决定 P0/P1 | `events=[]` |
| `vitame-product-inspect-v1` | 最近一次解析结果缓存，不是 memory | 可为空 |

现有 `vitame-profile-v2` 不能作为 Action-First MVP 状态源。若旧数据存在，P0 UI 仍不能展示 profile 主路径，也不能自动迁移成多人档案。

## 6. System Prompt 注入

P0：

```xml
<retrieved_facts>...</retrieved_facts>
```

P1 可选，仅当 `routine.items.length > 0` 且存在显式保存的 safety action memory：

```xml
<safety_memory>
  <event type="safety_user_declared">用户提到正在使用华法林</event>
</safety_memory>
<retrieved_facts>...</retrieved_facts>
```

禁止：

```xml
<user_profile>
  <conditions>...</conditions>
  <age_range>...</age_range>
  <sex>...</sex>
  <recent_topics>...</recent_topics>
</user_profile>
```

## 7. Error Handling

| 场景 | 行为 |
|---|---|
| LLM provider missing key | UI 显示配置错误，不写假回答 |
| Product fetch 403 | 提示抓取被拒，允许粘贴文字 |
| Product parse empty | 返回 missingFields，不进入推荐 |
| Safety red flag | 静态硬路由 |
| LocalStorage unavailable | 降级为本轮 session 内存状态 |
| crawl4ai timeout/error | 降级到 fetch/parser 或文本 fallback，不阻塞 URL 流程 |

## 8. 隐私约束

- P0 不保存疾病、年龄、性别、conversation summary。
- P0 不问姓名。
- MVP 不建立多人档案。
- 本地提醒不上传。
- 商品 URL 可以发给服务器抓取，但必须由用户主动提供。
- 官网抓取结果作为商品事实，不作为健康档案。
- 高危 pre-check 默认不持久化用户原话。
