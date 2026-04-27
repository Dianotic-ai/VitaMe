---
title: "Action-First MVP 功能设计"
description: "定义 Chat、Product Inspect、Routine、Safety、Action Memory 和详情抽屉的功能契约。"
doc_type: "functional-spec"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "functional-design"]
---

# 功能设计

## 1. Chat 主流程

输入：

- 症状或目标文本。
- 商品 URL。
- 商品规格文本。
- 继续追问。
- 保存后反馈。

输出：

- 六段式行动建议。
- 商品规格判断。
- 早 / 中 / 晚 / 睡前方案。
- 高危硬路由。
- 下一步 CTA。

行为：

- P0 请求体只包含 `sessionId` 和 `messages`。
- P1 后可增加由 action memory 汇总出的 `safetyMemory`，但只能来自用户显式保存或反馈，不做档案抽取。
- 不允许把完整 profile 注入 system prompt。

## 2. Safety Red Flags

必须在 `/api/chat` 调 LLM 前执行。

| Flag | Regex 示例 |
|---|---|
| anticoagulant | 华法林、warfarin、抗凝、血液稀释、阿哌沙班、利伐沙班、达比加群 |
| pregnancy | 怀孕、孕期、备孕、妊娠、pregnant |
| breastfeeding | 哺乳、喂奶、breastfeed |
| chemo | 化疗、放疗、chemo |
| severe renal/hepatic | 肝衰、肝硬化、肾衰、尿毒症、透析 |

命中后：

- 返回静态硬路由消息。
- 不调用 LLM。
- 不展示保存提醒 CTA。
- 写 audit 事件。
- 不创建任何 profile 或家人档案。

## 3. Product Inspect

能力范围：

- 用户主动粘贴官网商品页 URL。
- 用户主动粘贴商品规格文本。
- 抓取单页，不做全站深爬。
- 不绕登录、不绕反爬、不保证 JS 动态页面完整解析。
- 不做价格、渠道、优惠、购买链接推荐。
- P0 不做拍照/OCR。

API：

```text
POST /api/product/inspect
Content-Type: application/json

{
  "url"?: "https://...",
  "text"?: "Supplement Facts..."
}
```

返回：

```ts
interface ProductInspectResult {
  ok: boolean;
  sourceType: "url" | "text";
  sourceUrl?: string;
  fetchedAt: string;
  productName?: string;
  brand?: string;
  ingredients: Array<{ name: string; amount?: string; unit?: string }>;
  servingSize?: string;
  servingsPerContainer?: string;
  suggestedUse?: string;
  warnings: string[];
  form?: string;
  processClaims?: string[];
  packageQuantity?: string;
  missingFields: string[];
  rawEvidence: Array<{ label: string; text: string }>;
  error?: {
    code: "FETCH_403" | "FETCH_TIMEOUT" | "PARSE_EMPTY" | "UNSUPPORTED_PAGE" | "UNKNOWN";
    message: string;
  };
}
```

抓取策略：

1. fetch + realistic headers。
2. crawl4ai helper，如果本地环境已安装 Python runtime 和依赖。
3. HTML meta / JSON-LD / visible text parser。
4. 用户粘贴文本 fallback。

抓取失败不能假装成功。必须把失败原因和 fallback 告诉用户。

## 4. Routine

```ts
type RoutineSlot = "morning" | "noon" | "evening" | "bedtime";

interface RoutineItem {
  id: string;
  slot: RoutineSlot;
  title: string;
  note?: string;
  source: "assistant" | "user";
  createdAt: string;
  checkedAt?: string;
}
```

LocalStorage key:

```text
vitame-routine-v1
```

行为：

- 只有 RoutineConfirmCard 保存时写入。
- 不允许 LLM tool-call 静默创建。
- 用户可标记已吃。
- 用户可删除单项。
- 用户可清空全部。

## 5. Action Memory

P0 不创建 profile。P1 保存 routine 或提交反馈后，写事件式 action memory。Memory 用来记录用户确认过的行动，不用来抽取健康档案。

```ts
interface ActionMemoryEvent {
  id: string;
  type: "routine_saved" | "product_inspected" | "feedback_recorded" | "safety_user_declared";
  occurredAt: string;
  source: "explicit_user_action" | "system_safety_check";
  summary: string;
  entities?: string[];
  safetyFlags?: string[];
}
```

禁止字段：

- conditions。
- ageRange。
- sex。
- conversationSummary。
- recentTopics。
- notes。
- person/family profile。
- 自动疾病推断。

如果用户说“我妈在吃华法林”，可以在当前对话和 safety event 中记录 anticoagulant 风险，但不能创建“妈妈”档案。

## 6. NextActionChip

| Assistant 输出 | CTA |
|---|---|
| 成分方向建议 | 整理成早 / 中 / 晚 / 睡前 |
| 商品解析判断 | 整理成早 / 中 / 晚 / 睡前 |
| 已保存 routine | 3 天后记录效果 |
| 高危硬路由 | 不显示 CTA |
| 问用户澄清 | 不显示 CTA，使用 QuickReplies |

## 7. DetailDrawer

内容：

- 本轮 RAG facts。
- Product Inspect result。
- Local routine。
- Action memory events。
- 清空入口。

禁止：

- 多人档案表单。
- 强制填写疾病、药物、过敏。
- 把 profile 作为主路径。
