---
title: "VitaMe P0 Test Matrix"
description: "补剂安全翻译 Agent P0 的黄金样例、回归矩阵、合规检查和 Demo 前验收基线。"
doc_type: "test_matrix"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["engineering", "qa", "test", "matrix", "p0", "superpowers"]
source_docs:
  - "docs/product/VitaMe-P0-统一执行总纲.md"
  - "docs/product/VitaMe-P0-风险判定矩阵.md"
  - "docs/superpowers/specs/2026-04-20-vitame-p0-api-contract.md"
  - "docs/superpowers/specs/2026-04-18-vitame-demo-acceptance-checklist.md"
purpose: "把 P0 的“可信、可懂、可复查”拆成可执行的测试样例与回归线。"
---

# VitaMe — P0 Test Matrix

> 日期：2026-04-20  
> 状态：Draft  
> 目标：把“产品看起来像能用”升级成“关键链路已被验证”。

---

## Architecture

本测试矩阵分 4 层：

1. **L1 规则真值层**：红黄灰绿是否判对
2. **L2 交互链路层**：是否只问必要问题，session 是否稳定
3. **L3 合规表达层**：是否出现禁词、缺免责声明、错误升级
4. **L4 沉淀复查层**：是否能保存、回填、复查

> 原则：Demo 不是测“模型像不像人”，而是测“关键决策会不会误导人”。

---

## Components

### 测试样例分组

- `R-*`：规则与 level 判定
- `Q-*`：Query Intake / Context Routing
- `T-*`：Translation / Compliance
- `A-*`：Archive / Recheck
- `E-*`：Edge / Failure Path

### 结果检查维度

每条样例至少检查：

- `overallLevel`
- `reasonCode`
- 是否应继续追问
- 是否有免责声明
- CTA 是否正确
- 是否允许保存 / 复查

---

## Data Flow

### 推荐测试顺序

1. 先跑 `R-*`，确认判定内核不漂
2. 再跑 `Q-*`，确认问题没问歪
3. 再跑 `T-*`，确认翻译没越界
4. 最后跑 `A-*` / `E-*`，确认系统体验不断链

---

## 测试矩阵（黄金样例）

## A. Rule Truth — 红黄灰绿真值

| ID | 场景 | 输入摘要 | 期望 overallLevel | 期望核心 reasonCode | 关键断言 |
|----|------|----------|-------------------|----------------------|----------|
| R-01 | 强药物交互 | Fish Oil + Warfarin | red | `DRUG_INTERACTION_MAJOR` | 必须红，不得黄或灰 |
| R-02 | 条件性药物交互 | Fish Oil + Amlodipine | yellow | `DRUG_INTERACTION_CAUTION` | 不得夸大成红 |
| R-03 | 病史强禁忌 | 高风险成分 + 孕期 | red | `POPULATION_PREGNANCY_AVOID` | 必须带就医/咨询 CTA |
| R-04 | 病史注意 | 维生素 C / 钙相关 + 结石史 | yellow | `CONDITION_KIDNEY_STONE_CAUTION` | 解释必须提到病史相关 |
| R-05 | 形式差异 | 氧化镁 + 胃肠敏感 | yellow | `FORM_OXIDE_VS_GLYCINATE_TOLERANCE` | 不得只做百科解释 |
| R-06 | 同类叠加 | 已有镁补充 + 新增另一款镁 | yellow | `DOSE_DUPLICATE_INTAKE_CAUTION` | 复查场景应能命中 |
| R-07 | 覆盖缺口 | 小众草本，字典和规则均无覆盖 | gray | `INSUFFICIENT_DATA_PRODUCT` | 不得给绿 |
| R-08 | 关键上下文缺失 | 用户说“在吃药”，但药名未知 | gray | `INSUFFICIENT_CONTEXT_MEDICATION` | 明确提示补充后复查 |
| R-09 | 当前范围内未见风险 | 常规镁补充，无药无病史 | green | `NO_KNOWN_RISK_IN_CURRENT_SCOPE` | 必须带边界句 |
| R-10 | 红黄并存 | 一条红 + 一条黄 | red | 红色 code 任一 | overall 取最高级 |
| R-11 | 黄灰并存 | 一条黄 + 一条灰 | yellow | 黄级 code 任一 | gray 不覆盖 yellow |
| R-12 | 绿灰并存 | 一条绿 + 一条灰 | gray | `INSUFFICIENT_*` | 只要有核心信息不足，不得给绿 |

## B. Query Intake — 追问与路由

| ID | 场景 | 期望行为 | 关键断言 |
|----|------|----------|----------|
| Q-01 | 首次单品手动输入 | 生成 session + 1–2 个关键问题 | 不得直接长表单 |
| Q-02 | OCR 成功 | 识别 ingredient 并进入追问 | 手动输入入口仍可见 |
| Q-03 | OCR 失败 | 回落手动输入 | 不得 500 阻断 |
| Q-04 | 已有 Person 档案 | 自动回填 medications / conditions | 不重复问已知信息 |
| Q-05 | 明确红色高风险 | 最多补 1 个增强问题后出结果 | 不得继续无限追问 |
| Q-06 | 用户拒答部分问题 | 若影响结论则转灰 | 不得伪装完整结果 |
| Q-07 | 剂量相关风险 | 只在必要时追问剂量 | 不命中剂量规则时不问 |
| Q-08 | 时序相关风险 | 只在必要时追问空腹/饭后 | 不得默认每次都问 |

## C. Translation / Compliance — 表达与护栏

| ID | 场景 | 期望行为 | 关键断言 |
|----|------|----------|----------|
| T-01 | 红色结果翻译 | 用普通人能懂的话解释 | 不得改 level |
| T-02 | 黄色结果翻译 | 给出注意方向 | 不得写成“没事放心吃” |
| T-03 | 灰色结果翻译 | 明确当前无法可靠判断 | 禁止暗示安全 |
| T-04 | 绿色结果翻译 | 说明“当前未发现已知高风险” | 必须保留边界句 |
| T-05 | 合规禁词扫描 | 治疗/治愈/处方/药效等禁词被拦截 | 输出中不出现禁词 |
| T-06 | 免责声明注入 | 每次结果页都带 disclaimer | 红黄灰绿均适用 |
| T-07 | LLM 失败 | 自动模板 fallback | 用户仍能看到结果 |
| T-08 | 错误升级 | 命中 CriticalEscalation 场景时 CTA 升级 | 不依赖 LLM 自由发挥 |

## D. Archive / Recheck — 保存与复查

| ID | 场景 | 期望行为 | 关键断言 |
|----|------|----------|----------|
| A-01 | 首次查询保存 | 可保存到 self | 返回 `archiveEntryId` |
| A-02 | 新建 Person 保存 | 可保存到 mom / dad / other | Person 创建成功 |
| A-03 | 保存后复查 | 新增一项时自动带入既有 context | 不重复问已知病史 |
| A-04 | 复查新增风险 | 标出 `newRisks` | 用户能感知变化 |
| A-05 | 复查无变化 | 标出 `unchangedRisks` | 不伪造差异 |
| A-06 | 本地存储接近上限 | 合理提示清理或覆盖 | 不 silent fail |

## E. Failure / Edge Path — 边界与异常

| ID | 场景 | 期望行为 | 关键断言 |
|----|------|----------|----------|
| E-01 | Session 过期 | 返回 `SESSION_EXPIRED` | 前端引导重新开始 |
| E-02 | Ingredient 无法标准化 | 结果落灰或引导手动输入标准成分 | 不得硬猜 |
| E-03 | 药名 canonicalize 失败 | 保留 rawName + 转灰/提示复查 | 不丢原始信息 |
| E-04 | API 部分失败 | judgment 成功、translation 失败时走 fallback | 不得空白页 |
| E-05 | 低网速 / 重试 | 重试后仍能恢复当前 session | 不应创建多个脏 session |
| E-06 | localStorage 被清 | 至少前端有显式提示 | 不让用户误以为已保存 |

---

## Error Handling

### 失败优先级

1. **安全边界错误** > 体验错误  
   例如把灰色判成绿色，严重程度高于 OCR 不顺滑。

2. **结果错误** > 文案错误 > UI 错误  
   例如 overallLevel 漂移，严重程度高于按钮颜色不对。

3. **静默失败** 最危险  
   例如保存按钮点击后无提示、复查未带 context 却看似成功。

### Bug 分级建议

| 等级 | 定义 | 示例 |
|------|------|------|
| P0 | 会误导安全判断或破坏主链路 | 红判成绿、无 disclaimer、保存失效 |
| P1 | 不致命但明显伤信任 | 追问过多、灰色文案含糊 |
| P2 | 体验瑕疵 | 文案顺序、轻微布局问题 |

---

## Testing

## 1. 发布前最小通过线（Go / No-Go）

以下 8 条必须全部通过，否则不建议对外 Demo：

1. `R-01` 强交互必红
2. `R-07` 覆盖缺口必灰
3. `R-09` 绿色结果带边界句
4. `Q-04` 档案复查不重复问已知信息
5. `T-05` 禁词被拦截
6. `T-06` disclaimer 每次都展示
7. `A-03` 保存后可复查
8. `E-04` translation 失败时有 fallback

## 2. 黄金样例数量建议

- 首批手工黄金样例：**20–24 条**
- 每次改规则后的回归样例：**至少全跑 `R-*` + `T-*`**
- Demo 前一晚：跑 **Go / No-Go 8 条** + 主路径 smoke test

## 3. 医学审核建议

若团队有医学顾问，可优先人工审核这 6 类：

- 高风险药物交互
- 孕期 / 哺乳人群
- 结石 / 肾病相关补剂
- 出血风险相关补剂
- 高剂量重复摄入
- 形式差异引起的耐受风险

---

## 一句话结论

**P0 的“可信”不是靠讲故事，而是靠 20 多条关键样例反复跑出来。**
