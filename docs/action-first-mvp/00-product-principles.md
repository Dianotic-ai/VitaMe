---
title: "Action-First MVP 产品原则与范围"
description: "定义 VitaMe 当前 MVP 的产品判断、用户价值、范围、非目标和不可破坏原则。"
doc_type: "product-principles"
status: "active"
created: "2026-04-27"
updated: "2026-04-27"
canonical: true
privacy: "internal"
tags: ["action-first", "product", "scope"]
---

# 产品原则与范围

## 1. 背景判断

上一版产品出现了偏移：UI 和后台逻辑都在把 VitaMe 推向“多人健康档案 + 长期记忆 + 菜单式 chatbot”。多人健康档案不应进入当前 MVP；长期上下文也不应该通过抽取档案实现，而应通过轻量 action memory 服务行动。

当前 MVP 必须回到一个更轻、更直接的动作链：

```text
我哪里不舒服 / 我想改善什么 / 我看中一个产品
  → Agent 判断适合关注什么
  → Agent 告诉我买前看哪些规格
  → Agent 读取官网商品信息
  → Agent 整理怎么吃
  → 我确认后保存本地提醒
  → 几天后记录效果
```

## 2. 核心用户问题

真实用户大多不会一上来问“辅酶 Q10 和华法林能不能一起吃”。他们更可能说：

- 最近熬夜眼睛酸。
- 晚上睡不好。
- 白天没精神。
- 最近掉头发。
- 我看中了这个保健品，帮我看看规格。
- 今天这些东西什么时候吃。

用户需要降低的是决策成本：

- 我现在的状况适合关注哪些成分？
- 买产品时规格、剂量、剂型、工艺应该看什么？
- 有没有禁忌、忌口、冲突和高危情况？
- 什么时候吃，吃多少，吃多久观察？
- 不处理或乱吃有什么风险？
- 吃了以后怎么判断是否有改善？

## 3. 产品定位

VitaMe P0 是“保健品导购 + 服用行动 Agent”，不是医疗诊断工具，也不是健康档案系统。

推荐表达：

```text
说说哪里不舒服、想改善什么，或贴一个商品页。
VitaMe 会把方向、规格、禁忌、时间和反馈整理成一条行动链。
```

禁止表达：

```text
请先建立你的健康档案。
请添加家人档案。
请完善疾病、药物、过敏、年龄和性别。
```

## 4. 产品原则

### 4.1 Action first

所有界面和对话必须推动用户完成下一步行动。行动包括：补充关键信息、检查商品规格、整理服用时间、保存提醒、记录效果。

### 4.2 No profile in MVP

MVP 不做健康档案。用户没有保存提醒前，产品应保持匿名、轻量、低隐私压力。保存提醒或记录反馈后，只写 action memory event，不生成疾病、年龄、性别、家人等档案结构。

测试可以覆盖“我妈在吃 X”这类说法，但这只是对话输入，不是产品功能入口，不能物化成多人档案。

### 4.3 Memory as events, not profile extraction

Memory 可以做，但必须是事件式：

```text
routine_saved
product_judgment_saved
feedback_recorded
safety_user_declared
```

禁止把每轮对话抽取为 conditions、ageRange、sex、conversationSummary。这样的抽取隐私压力大、成本高，也会把产品重新推回档案系统。

单纯粘贴 URL 和解析商品页不写 action memory；只有用户保存方案、保存商品判断或提交反馈时才写。高危 pre-check 命中默认只在本轮使用，不持久化用户原话。

### 4.4 Product facts before recommendation

当用户提供商品 URL 或规格文本时，Agent 必须区分：

- 官网或包装明确写了什么。
- 规格是否满足当前需求。
- 缺少什么信息需要用户确认。
- 哪些判断来自权威资料或一般认知。

官网信息不能被包装成医学结论。

### 4.5 URL first, photo later

P0 商品输入用 URL + 文本 fallback。拍照/OCR 对移动端有价值，但会引入图片上传、OCR 准确率、隐私和 UI 复杂度，不进入首版核心。

### 4.6 Safety before convenience

孕期、哺乳期、抗凝药、化疗、严重肝肾异常等高危场景必须硬路由。命中硬路由时，不继续推荐成分，不继续生成提醒。

## 5. P0 范围

P0 必须做：

- 症状/目标输入。
- 官网商品 URL 解析。
- 商品规格文本 fallback。
- 六段式行动回答。
- 高危 deterministic pre-check。
- 早 / 中 / 晚 / 睡前本地提醒。
- 用户显式保存后才写 action memory。
- 3 天后效果反馈入口。
- 详情抽屉：依据、官网解析、本地 action memory、清空入口。

P0 不做：

- 登录注册。
- 健康档案。
- 多人档案。
- 每轮档案抽取。
- 拍照/OCR 商品识别。
- 购物车批量解析。
- 价格、优惠、渠道推荐。
- 全站深爬或绕过反爬。
- PWA push notification。
- Hermit 自动周期归纳。
- 医疗诊断、处方建议、疾病治疗承诺。

## 6. 暂缓资产

以下能力可以保留为未来资产，但不得进入 P0 主路径：

- Memory 时间轴 UI。
- Hermit Agent。
- Feedback 弹窗自动打扰。
- Cloud memory。
- Reminder 中心页的复杂规则管理。
- 多人档案。该能力未来是否做，需要重新论证隐私、信任和用户成本，不从当前 MVP 自然继承。
