---
title: "VitaMe P0 Metrics Instrumentation"
description: "定义 P0 的事件模型、漏斗口径、激活判定和回访指标，确保 Aha/Activation/Retention 可被真实测量。"
doc_type: "spec"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: false
privacy: "internal"
tags: ["metrics", "analytics", "instrumentation", "p0", "spec"]
depends_on:
  - "docs/product/VitaMe-P0-统一执行总纲.md"
  - "docs/product/VitaMe-P0-用户上下文分类法.md"
  - "docs/product/VitaMe-P0-风险判定矩阵.md"
  - "docs/superpowers/specs/2026-04-20-vitame-p0-api-contract.md"
purpose: "把产品目标转成可埋点、可看板、可回归分析的事件定义，防止 Aha / Activation / Trust 只停留在口头指标。"
---

# 2026-04-20 — VitaMe P0 Metrics Instrumentation

> 日期：2026-04-20  
> 状态：Draft  
> 适用阶段：P0 / Demo / 首轮内测  
> 原则：先测“是否完成有效安全决策”，再测停留时长和内容消费。

---

## 1. 这份文档解决什么问题

当前产品文档已经明确：

- VitaMe 不是陪伴型日活产品
- VitaMe 的核心价值是 **完成一次可信的补剂安全判断**
- P0 成功不看伪 DAU，而看 **是否形成 Qualified Safety Decision（QSD）**

但如果没有指标埋点文档，执行层会出现 4 个典型问题：

1. Activation 写得对，但没人知道怎么测
2. 解释“是否被理解”只能靠主观感觉
3. 回访是否来自真正的复查，不可区分
4. Demo 看似顺滑，但产品根本不知道哪一步掉线

所以本文件把产品目标收敛成一套最小事件模型。

---

## 2. 指标设计原则

### 2.1 P0 指标优先级

1. **主链路闭环是否完成**
2. **用户是否理解为什么有风险 / 无法判断**
3. **用户是否愿意保存结果并形成下次复查入口**
4. **用户是否在新 trigger 下再次回来**
5. 之后才看更次要的交互指标

### 2.2 不追的指标

P0 不把以下指标作为核心成功依据：

- 首页 PV
- 停留总时长
- 平均会话轮数
- 内容页阅读深度
- 模糊的 DAU 增长
- 没有业务意义的“聊天消息数”

---

## 3. 北极星与层级指标

### 3.1 北极星指标

## Qualified Safety Decision（QSD）

定义：用户围绕某一项补剂或成分，完成一次有效安全判断，并触发以下任一动作：

- 保存到档案
- 点击“查看证据”或“我知道为什么了”
- 触发“换个方向看看”或“稍后复查”
- 形成可追踪的 `query_id + person_id + overall_level`

### 3.2 指标层级

| 层级 | 指标 | 含义 |
|------|------|------|
| L1 | QSD count | 完成多少次有效安全决策 |
| L1 | QSD rate | 从开始输入到形成 QSD 的比例 |
| L2 | Query completion rate | 从输入到结果页的完成率 |
| L2 | Save rate | 结果被保存的比例 |
| L2 | Recheck return rate | 用户在未来 trigger 下是否回来 |
| L3 | Context friction | 问题过多、卡住、跳出等摩擦 |
| L3 | Trust proxy | 结果被理解、被展开、被复看 |
| L3 | Safety rail coverage | disclaimer / escalation 是否稳定触发 |

---

## 4. 事件命名约定

### 4.1 命名规则

统一采用：

`vitame_<object>_<action>`

示例：

- `vitame_query_started`
- `vitame_context_question_answered`
- `vitame_judgment_rendered`
- `vitame_archive_saved`

### 4.2 公共属性

所有事件都尽量带以下公共字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `session_id` | string | 当前前端会话 ID |
| `query_id` | string | 某次查询唯一 ID |
| `person_id` | string/null | 若已选择或创建 person |
| `source_mode` | enum | `manual` / `ocr` / `scan_demo` |
| `surface` | enum | `landing` / `query_page` / `result_page` / `archive_page` |
| `timestamp_ms` | number | 前端触发时间 |
| `app_version` | string | 前端版本 |
| `env` | enum | `dev` / `staging` / `prod_demo` |
| `is_wechat_webview` | boolean | 是否微信内 H5 |
| `network_state` | enum | `online` / `slow` / `offline` |

---

## 5. 主链路事件表

### 5.1 进入与输入阶段

| Event | 触发时机 | 核心属性 |
|------|----------|---------|
| `vitame_landing_viewed` | 打开 landing | `referrer`, `campaign`, `surface_variant` |
| `vitame_query_started` | 用户进入查询流程 | `entry_point`, `source_mode` |
| `vitame_item_input_submitted` | 提交补剂名/成分/OCR 结果 | `input_type`, `rawInputLength`, `has_brand_name` |
| `vitame_ocr_requested` | 发起 OCR | `image_count`, `client_device` |
| `vitame_ocr_succeeded` | OCR 成功 | `ocr_latency_ms`, `extracted_token_count` |
| `vitame_ocr_failed` | OCR 失败 | `error_code`, `fallback_used` |

### 5.2 有限追问阶段

| Event | 触发时机 | 核心属性 |
|------|----------|---------|
| `vitame_context_question_shown` | 展示一个追问 | `question_key`, `question_priority`, `is_required` |
| `vitame_context_question_answered` | 回答一个追问 | `question_key`, `answer_value`, `answer_type` |
| `vitame_context_question_skipped` | 跳过可选问题 | `question_key`, `skip_reason` |
| `vitame_context_collection_completed` | 追问结束 | `question_count`, `required_answered_count` |
| `vitame_context_collection_abandoned` | 追问中退出 | `question_count_seen`, `last_question_key` |

### 5.3 判断与解释阶段

| Event | 触发时机 | 核心属性 |
|------|----------|---------|
| `vitame_judgment_requested` | 发起判定 | `rule_version`, `context_completeness_score` |
| `vitame_judgment_completed` | 判定完成 | `overall_level`, `reasonCodeCount`, `evidenceStrengthTop` |
| `vitame_judgment_failed` | 判定失败 | `error_code`, `fallback_path` |
| `vitame_result_viewed` | 结果页首次渲染 | `overall_level`, `reasonCodeCount`, `cta_variant` |
| `vitame_reason_expanded` | 用户展开原因解释 | `reasonCode`, `evidenceType` |
| `vitame_evidence_viewed` | 用户查看证据 | `evidenceType`, `evidenceStrength` |
| `vitame_translation_fallback_used` | 走模板或兜底解释 | `fallback_type`, `reasonCodeCount` |

### 5.4 后续动作阶段

| Event | 触发时机 | 核心属性 |
|------|----------|---------|
| `vitame_archive_save_clicked` | 点击保存 | `save_target` |
| `vitame_archive_saved` | 成功保存 | `person_id`, `snapshot_size`, `overall_level` |
| `vitame_archive_save_failed` | 保存失败 | `error_code`, `retryable` |
| `vitame_recheck_started` | 基于既有 person 发起复查 | `person_id`, `source_query_count` |
| `vitame_recheck_completed` | 完成复查 | `overall_level`, `delta_vs_previous` |
| `vitame_alternative_direction_clicked` | 点击替代方向 | `alternative_type`, `from_overall_level` |
| `vitame_understood_clicked` | 点击“我知道为什么了” | `overall_level`, `after_evidence_view` |

---

## 6. 漏斗定义

### 6.1 主漏斗：一次有效安全决策漏斗

1. `vitame_query_started`
2. `vitame_item_input_submitted`
3. `vitame_context_collection_completed`
4. `vitame_judgment_completed`
5. `vitame_result_viewed`
6. `vitame_archive_saved` **或** `vitame_understood_clicked` **或** `vitame_alternative_direction_clicked`

### 6.2 关键转化口径

| 指标 | 计算方式 |
|------|----------|
| Query start rate | `query_started / landing_viewed` |
| Input completion rate | `item_input_submitted / query_started` |
| Context completion rate | `context_collection_completed / item_input_submitted` |
| Judgment success rate | `judgment_completed / context_collection_completed` |
| Result render rate | `result_viewed / judgment_completed` |
| QSD rate | `(archive_saved OR understood_clicked OR alternative_direction_clicked) / query_started` |

---

## 7. Activation 的代理定义

### 7.1 Aha Moment（定性定义）

用户第一次明确感受到：

**“这不是泛泛劝我，而是在结合我的情况判断这款补剂为什么要警惕 / 为什么暂时看不准。”**

### 7.2 Activation（可量化代理）

满足以下至少 1 条，视为 activation：

- 看到结果页并点击 `我知道为什么了`
- 展开至少 1 条 reason explanation
- 查看至少 1 条 evidence
- 保存到档案
- 在结果页点击“换个方向看看”

### 7.3 Activation Rate

`activated_users / result_viewed_users`

---

## 8. Retention / 回访定义

### 8.1 回访不是随便打开

只统计以下为“有效回访”：

- 新查询开始
- 基于已有 person 发起复查
- 打开已有 archive snapshot 后再次判断
- 查看旧记录后新增补剂比较

### 8.2 Recheck Return Rate（30d）

在首次形成 QSD 的 30 天内，用户是否发生：

- `vitame_recheck_started`
- `vitame_query_started` with existing `person_id`

公式：

`users_with_effective_return_within_30d / users_with_first_qsd`

---

## 9. Trust / 理解度代理指标

P0 阶段不直接追“医学正确率”这种无法仅靠埋点判断的指标，而是先追可操作的信任代理：

| 指标 | 定义 |
|------|------|
| Explanation expand rate | `reason_expanded / result_viewed` |
| Evidence view rate | `evidence_viewed / result_viewed` |
| Understand click rate | `understood_clicked / result_viewed` |
| Save after result rate | `archive_saved / result_viewed` |
| Result revisit rate | 24h 内再次打开同一结果 |

### 9.1 负向信号

| 指标 | 含义 |
|------|------|
| Result bounce rate | 到结果页后 10 秒内离开，无任何交互 |
| Context abandon rate | 追问中退出 |
| OCR fail bounce | OCR 失败后直接退出 |
| Save fail abandon | 保存失败后不再尝试 |

---

## 10. 指标看板建议

### 10.1 每日看板

- Query started
- QSD count / QSD rate
- OCR success / fail
- Context completion
- Judgment success / fail
- Save rate
- Critical escalation trigger count

### 10.2 每周看板

- Recheck return rate
- Top drop-off question keys
- Top reasonCodes
- Top fallback paths
- Trust proxy trend
- By source mode (`manual` vs `ocr`) conversion comparison

---

## 11. 分析维度建议

所有关键指标都建议至少支持以下切片：

- `source_mode`: manual / ocr
- `person_type`: self / mom / dad / other
- `overall_level`: red / yellow / gray / green
- `question_count_bucket`: 0, 1-2, 3-4, 5+
- `has_medication`: yes / no
- `special_group`: pregnancy / elderly / none / unknown
- `surface_variant`: landing copy A/B

---

## 12. 数据质量与风控要求

### 12.1 埋点必须满足

- 前后端统一 `query_id`
- 事件去重支持 `event_id`
- 本地失败可重放
- 不得上传原始自由文本病史全文
- PII 字段必须脱敏或不采集

### 12.2 不允许上报的内容

- 全量图片原件
- 完整药单文本
- 用户自由输入的详细症状段落
- 可直接识别个人身份的信息

---

## 13. Demo 阶段最小埋点集合

如果时间不够，至少保留这 12 个事件：

1. `vitame_query_started`
2. `vitame_item_input_submitted`
3. `vitame_ocr_requested`
4. `vitame_ocr_succeeded`
5. `vitame_ocr_failed`
6. `vitame_context_collection_completed`
7. `vitame_judgment_completed`
8. `vitame_result_viewed`
9. `vitame_reason_expanded`
10. `vitame_understood_clicked`
11. `vitame_archive_saved`
12. `vitame_recheck_started`

---

## 14. 验收标准

这份文档通过的标准不是“写得全”，而是：

- 数据工程能据此埋点
- 产品能据此看漏斗
- 创始人能据此判断 Demo 是否真的成立
- 团队能区分“流程卡住”与“价值不成立”

---

## 15. 一句话结论

**P0 要测的不是用户聊了多久，而是：用户有没有真正完成一次可信、可懂、可复查的补剂安全决策。**
