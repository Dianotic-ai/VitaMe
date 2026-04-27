---
title: "v0.4 数据模型 — 4 个 zustand store + LocalStorage schema + 迁移"
description: "客户端 4 个 store 的完整 schema、LocalStorage key、版本迁移、跨 store 关联、zustand v5 注意事项。"
doc_type: "data-model"
status: "active"
created: "2026-04-27"
canonical: true
---

# 数据模型

## 0. 全局约定

- **全部仅 LocalStorage**（北极星 §9.8 + CLAUDE.md §9.8 红线 8）
- 用 `zustand` v5 + `persist` middleware + `createJSONStorage(() => localStorage)`
- v5 selector inline `.filter` / `.map` 必须包 `useShallow`，否则触发 React #185 Max update depth（Codex review #5 D14 前坑）
- 所有 ID 用 `nanoid()`（21 字符 url-safe）
- 时间戳全部 ISO 8601（`new Date().toISOString()`）

---

## 1. profileStore

### 1.1 LocalStorage key + version

- key: `vitame-profile-v2`
- version: 2
- 旧 v1 (`vitame-profile-v1`) 自动 backfill 进 v2 `people[0]='我自己'`

### 1.2 Schema

```ts
interface UserProfile {
  schemaVersion: 2;
  sessionId: string;              // 永久 nanoid，跨 person 共享，audit 关联用
  people: Person[];
  activePersonId: string;
}

interface Person {
  id: string;                     // nanoid
  name: string;                   // 显示名："我自己" / "妈妈" / 自定义
  relation: 'self'|'mother'|'father'|'spouse'|'child'|'other';
  conditions: ProfileCondition[];
  medications: ProfileMedication[];
  currentSupplements: ProfileSupplement[];   // D2 加，§3 Reminder 数据源
  allergies: ProfileAllergy[];
  specialGroups: SpecialGroup[];
  ageRange?: AgeRange;
  sex?: Sex;
  notes: string[];
  conversationSummaries: ConversationSummary[];   // 最多 10 条
  createdAt: string;
  updatedAt: string;
}

interface ProfileCondition {
  slug?: string;
  mention: string;
  firstAt: string;                // CLAUDE.md §9.8 硬要求
  lastConfirmedAt?: string;
}

interface ProfileMedication {
  slug?: string;
  mention: string;
  isLongTerm?: boolean;
  firstAt: string;
  lastConfirmedAt?: string;
}

interface ProfileSupplement {
  supplementId: string;           // nanoid，跟 ReminderRule.supplementId 关联
  slug?: string;
  mention: string;                // 用户原话 "汤臣倍健 鱼油 1000mg"
  brand?: string;
  dosage?: string;
  schedule?: string;              // "早餐后" / "睡前"
  startedAt: string;
  lastFeedbackAt?: string;        // FeedbackPrompt 24h cooldown 用
}

interface ProfileAllergy { mention: string; firstAt: string }

interface ConversationSummary {
  sessionId: string;
  summary: string;
  topics: string[];
  ts: string;
}
```

### 1.3 关键 actions

- `addPerson(name, relation): personId`
- `removePerson(personId)` — 同时清 reminder + memory + conversation（profile 页 handler 处理 cascade）
- `setActivePersonId(personId)` — chat useChat 用 `id: chat-${personId}` 自动 reset
- `applyDelta(delta, sessionId)` — 由 `/api/extract` 结果 merge 进 active person
- `addSupplement(input): supplementId`
- `markSupplementFedback(supplementId)` — 设 lastFeedbackAt=now
- `clearActivePerson()` / `clearAll()` — 仅清 profile（cascade 由 profile 页 handler 调其他 store 的 clearAll）

### 1.4 v1 → v2 迁移

`onRehydrateStorage` 检测到 `vitame-profile-v1` LocalStorage 存在 + v2 还是空 → 把 v1 wrap 成 v2.people[0]='我自己'。v1 数据不删（用户可手动清）。

D2 (currentSupplements) 后又加了 backfill：v2 中老的 person 没 currentSupplements 字段 → 自动补 `[]`。

---

## 2. memoryEventStore

### 2.1 LocalStorage key

- key: `vitame-memory-v1`
- version: 1
- 上限 `MAX_EVENTS = 500`（FIFO 满了删最早）

### 2.2 Schema

```ts
interface MemoryEvent {
  eventId: string;                // nanoid，全局唯一（Hermit basedOnEventIds 引用）
  occurredAt: string;             // ISO 时间
  eventType: 'verify'|'reminder'|'feedback'|'observation'|'correction';
  personId: string;               // 关联 profile.people[].id
  entityRefs: string[];           // supplement / drug / condition slug 数组
  userText?: string;
  agentText?: string;
  tags: string[];
  privacyMode: 'local'|'pseudonymous'|'cloud_memory';   // P0 全 'local'
  metadata?: Record<string, unknown>;
}

// metadata schema（按 eventType 解读）

interface VerifyEventMetadata {
  retrievedSourceIds?: string[];
  criticalHits?: number;
  sessionId?: string;
  summaryTopics?: string[];
  sourceMessageId?: string;       // 从哪条 assistant message 来的（防重复）
}

interface FeedbackEventMetadata {
  question: 'taken'|'feeling'|'skip'|'time-adjust';
  answer: string;
  freeText?: string;
  urgent?: boolean;
}

interface ReminderEventMetadata {
  ruleId: string;
  ackAction: 'taken'|'skip'|'snooze'|'reschedule';
  timeOfDay?: string;
  // 可选: autoCreatedSupplement (via-chat 时), via-pillbox / via-reminders-page tag
}

interface ObservationEventMetadata {
  observationType: 'pattern'|'recheck'|'reminder-adjust'|'request-field';
  basedOnEventIds: string[];      // Codex #6 必须可追溯到真实 event
  proposal?: string;
  userAction?: 'pending'|'accepted'|'dismissed';
}

interface CorrectionEventMetadata {
  targetObservationId?: string;
  freeText?: string;
}
```

### 2.3 关键 actions

- `appendEvent(input)` — eventId / occurredAt / privacyMode 自动加
- `removeByPerson(personId)` — 删 person 时 cascade
- `removeEvent(eventId)`
- `clearAll()` — 销毁全部档案 cascade
- `query(filter)` / `groupByDay()` — 时间轴渲染用

### 2.4 跨 store 关联

| event metadata 字段 | 关联到 |
|---|---|
| `personId` | profileStore.people[].id |
| `entityRefs[]` | 多源（supplement slug / drug slug / condition slug）|
| `metadata.ruleId` | reminderStore.rules[].ruleId |
| `metadata.basedOnEventIds[]` | 自身 memoryStore 的其他 eventId |
| `metadata.targetObservationId` | 自身 memoryStore observation 类 eventId |

---

## 3. reminderStore

### 3.1 LocalStorage key

- key: `vitame-reminder-v1`
- version: 1

### 3.2 Schema

```ts
interface ReminderRule {
  ruleId: string;                 // nanoid
  personId: string;
  supplementId: string;           // 关联 Person.currentSupplements[].supplementId
  timeOfDay: string;              // "08:00" 等 24h
  daysOfWeek: number[];           // 1=Mon..7=Sun
  paused: boolean;
  frequencyMultiplier: number;    // 1.0 / 0.5 / 0.25 — 连续 skip 自动降频
  lastTriggeredAt?: string;
  lastAckAt?: string;
  consecutiveSkips: number;
  createdAt: string;
}

type AckAction = 'taken' | 'skip' | 'snooze';
```

### 3.3 关键 actions

- `addRule(input): ruleId`
- `updateRule(ruleId, patch)` — 暂停 / 改时间等
- `removeRule(ruleId)` / `removeBySupplement(supplementId)` / `removeByPerson(personId)`
- `clearAll()` — 销毁全部 cascade
- `ackRule(ruleId, action)`:
  - `'taken'` → consecutiveSkips=0，frequencyMultiplier+0.25 (cap 1.0)
  - `'skip'` → consecutiveSkips++; ≥3 → 0.5x; ≥5 → 0.25x
  - `'snooze'` → 仅更新 lastTriggeredAt 让今日不再弹
- `computeDueRules(personId, nowISO?): ReminderRule[]` — 按 dow / paused / frequency / 当日 ack / 当时时间过滤
  - **PillBoxStrip 不用这个**，用 `groupRulesBySlot` 显示全天 routine（不是 due-only）

### 3.4 timeOfDay → Slot bucket（D14 渲染层）

`src/lib/reminder/slot.ts`:

```ts
SlotKey = 'morning' | 'midday' | 'evening' | 'bedtime'

bucketSlot(timeOfDay):
  04-11 → morning
  11-16 → midday
  16-21 → evening
  21-04 → bedtime (跨午夜)
```

不动 ReminderRule 数据模型 — timeOfDay 仍是任意 24h 字符串。

---

## 4. conversationStore

### 4.1 LocalStorage key

- key: `vitame-conversation-v2`
- version: 2
- 旧 v1 (`vitame-conversation-v1`) 检测到 → 挂到 `__legacy_v1__` 临时桶（chat 页可识别归档到当前 active person）

### 4.2 Schema (D13 Codex Finding #1 改造后)

```ts
interface ConversationStateV2 {
  messagesByPersonId: Record<string, UIMessage[]>;   // 按 personId 隔离
  hasHydrated: boolean;
}

const MAX_PERSIST_PER_PERSON = 12;  // 5-6 轮配对
```

### 4.3 关键 actions

- `getMessages(personId): UIMessage[]`
- `setMessages(personId, next)` — 自动 slice 尾 12 条
- `clearMessages(personId)` — 仅清当前 person，新对话按钮用
- `clearAll()` — 销毁全部 cascade
- `removePerson(personId)` — 删 person 时清孤儿

### 4.4 跟 useChat 集成

```tsx
const storedMessages = useConversationStore(s => s.messagesByPersonId[activePerson.id] ?? []);
const { messages, sendMessage, ... } = useChat({
  id: `chat-${activePerson.id}`,    // 切 person 时实例 reset
  messages: storedMessages,
  transport: new DefaultChatTransport({ ... }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
});

useEffect(() => {
  if (status === 'streaming') return;
  setStoredMessages(activePerson.id, messages as UIMessage[]);
}, [messages, status, activePerson.id]);
```

---

## 5. 跨 store 关系图

```
profile.people[].id   ─┬─ memory.event.personId
                       ├─ reminder.rule.personId
                       └─ conversation.messagesByPersonId.{key}

profile.person.currentSupplements[].supplementId
                       └─ reminder.rule.supplementId

reminder.rule.ruleId   └─ memory.event.metadata.ruleId

memory.event.eventId   └─ memory.event.metadata.basedOnEventIds[]
                                       (Hermit observation 引用)
```

---

## 6. 完整 cascade 销毁流程

`profile/page.tsx` `handleClearAll()`:

```ts
profileStore.clearAll()       // people 重建为单"我自己"
reminderStore.clearAll()      // rules = []
eventStore.clearAll()         // events = []
conversationStore.clearAll()  // messagesByPersonId = {}
// 不清: archive (v0.2 老路径产物，单独入口)
```

`handleClearActive()`:
```ts
profileStore.clearActivePerson()    // 清 active 的 conditions/medications/...
reminderStore.removeByPerson(active.id)
eventStore.removeByPerson(active.id)
conversationStore.clearMessages(active.id)
```

`handleRemovePerson(id)`:
```ts
profileStore.removePerson(id)
reminderStore.removeByPerson(id)
eventStore.removeByPerson(id)
conversationStore.clearMessages(id)
```

详见 Codex Finding #3 修复 commit `3b794f1`.

---

## 7. zustand v5 注意事项

inline filter / map selector 必须 `useShallow`：

```ts
// ❌ 错（触发 React #185 Max update depth）
const rules = useReminderStore((s) => s.rules.filter(r => r.personId === id));

// ✅ 对
import { useShallow } from 'zustand/react/shallow';
const rules = useReminderStore(useShallow((s) => s.rules.filter(r => r.personId === id)));
```

代码中已使用此模式的位置：
- `src/components/reminder/ReminderRuleEditor.tsx`
- `src/components/memory/HermitButton.tsx`
- `src/components/brand/PillBox.tsx`

返回 primitive (boolean / number / string) 的 selector 不需要 useShallow。

---

**事实源**：`src/lib/profile/types.ts` + `src/lib/profile/profileStore.ts` + `src/lib/memory/types.ts` + `src/lib/memory/eventStore.ts` + `src/lib/reminder/types.ts` + `src/lib/reminder/store.ts` + `src/lib/chat/conversationStore.ts`
