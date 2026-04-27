---
title: "Action-First MVP 验收测试矩阵"
description: "定义自动测试、手动测试、网络检查和阻断发布的问题清单。"
doc_type: "test-matrix"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "acceptance", "tests"]
---

# 验收测试矩阵

## 1. 自动测试

必须通过：

```bash
npm run typecheck
npm run test:unit
```

推荐通过：

```bash
npm run build
```

## 2. Unit Tests

| ID | 模块 | 输入 | 期望 |
|---|---|---|---|
| UT1 | `detectRedFlags` | 我在吃华法林想吃鱼油 | `anticoagulant` |
| UT2 | `detectRedFlags` | 怀孕 12 周想吃 DHA | `pregnancy` |
| UT3 | `detectRedFlags` | 最近熬夜眼睛酸 | `[]` |
| UT4 | Product parser | fixture HTML | 抽出 productName / ingredients / servingSize / warnings / form |
| UT5 | Product parser | 空 HTML | `ok=false` + `PARSE_EMPTY` |
| UT6 | routine parser | assistant 早 / 中 / 晚 / 睡前文本 | 生成对应 slots |
| UT7 | action memory event | 保存提醒前后对比 | 保存前无 event；保存后只写 explicit action event |

## 3. 手动验收

| ID | 场景 | 步骤 | 期望 |
|---|---|---|---|
| M1 | 首访 P0 | 清空 LocalStorage 打开 `/chat` | 无 PersonSwitcher，无 profile CTA，无药盒条 |
| M2 | 症状入口 | 点“最近熬夜眼睛酸” | 得到六段式回答 |
| M3 | CTA | 点“整理成早 / 中 / 晚 / 睡前” | assistant 输出时间方案 |
| M4 | 保存前状态 | 不点击保存，查看 LocalStorage | routine `items=[]`，actionMemory `events=[]` |
| M5 | 保存提醒 | 点击“保存到我的提醒” | 顶部 RoutineSummaryStrip 出现 |
| M6 | P1 请求体 | 保存后再发一轮消息 | `/api/chat` 可带 compact `safetyMemory`，但不是完整 profile |
| M7 | URL 抓取 | 粘贴商品官网 URL | 出现抓取 chip，调用 `/api/product/inspect` |
| M8 | URL fallback | 使用会 403 的页面 | 显示失败原因和粘贴文字 fallback |
| M9 | 高危硬路由 | 输入“我在吃华法林想吃鱼油” | 不调用 LLM，直接硬路由 |
| M10 | 清空 routine | RoutineDrawer 清空 | 顶部条消失 |
| M11 | DetailDrawer | P0 打开详情 | 不展示多人档案表单 |
| M12 | 移动端 | 375px viewport | 文字不溢出，按钮不重叠 |
| M13 | 家人说法 | 输入“我妈在吃华法林，能吃鱼油吗” | 高危拦截，但不创建妈妈档案 |

## 4. Network 检查

P0 必须满足：

- `/api/chat` body 不含 `profile`。
- `/api/chat` body 不含 `userMentioned`。
- P0 `/api/chat` body 不含 `safetyMemory`。
- Network 不出现 `/api/extract`。
- 高危命中时不出现 LLM provider 请求。

Product Inspect 必须满足：

- 粘贴 URL 后出现 `/api/product/inspect`。
- 抓取失败时 response 有 error code。
- 文本 fallback 后仍能解析。

## 5. 发布阻断项

出现任一项，不允许发布：

- 首访出现 PersonSwitcher。
- 首访要求填写档案。
- MVP 出现多人档案创建入口。
- P0 发送完整 profile。
- 每轮对话后调用 `/api/extract`。
- 高危问题继续推荐成分。
- URL 粘贴没有抓取尝试。
- LLM 回答不包含剂量/时间/禁忌/观察。
- 保存提醒不是用户显式确认。
- 本地测试无法运行且没有说明原因。

## 6. 验收记录模板

```md
## Local Acceptance Record

Date:
Branch:
Commit:

### Automated
- typecheck:
- unit:
- build:

### Manual
- M1:
- M2:
- M3:
- M4:
- M5:
- M6:
- M7:
- M8:
- M9:
- M10:
- M11:
- M12:
- M13:

### Known gaps

### Decision
- Pass / Blocked
```
