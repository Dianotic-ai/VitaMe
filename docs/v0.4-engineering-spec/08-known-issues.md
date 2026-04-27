---
title: "v0.4 已知问题与未做项"
description: "已知 divergence (action-first) + Codex 6 条修复回顾 + P3 项 + 性能/扩展瓶颈 + 接手注意事项。"
doc_type: "known-issues"
status: "active"
created: "2026-04-27"
canonical: true
---

# 已知问题 / 未做 / 接手注意

## 1. 文档 vs 代码的 divergence

详见独立文档 `docs/v0.4-vs-action-first-divergence.md`。要点：

- **action-first MVP 文档**（`docs/action-first-mvp/`，main 分支已含）明确**禁**了 v0.4 已实现的多 person、`/api/extract`、profile 注入、Hermit P0 等
- **WAIC 4/30 demo 期不强行对齐**
- **5 月之后由 Kevin 决定**走路径 A（按 action-first 重写代码）/ B（重写文档承认 v0.4 是新方向）/ C（双轨）

接手者：
- 看到 action-first 说"禁 X" 但代码有 X → 不是 bug，是 known divergence
- 改前先跟 Kevin 确认走哪条路

---

## 2. Codex review 修复回顾（D13）

外部 Codex 评审找出的 6 个 bug 全修复：

| # | bug | commit | 修法 |
|---|---|---|---|
| 1 | 多 person 历史串扰 + 无 5 轮上限 | `3b794f1` | conversationStore v1→v2 messagesByPersonId + useChat key + MAX_LLM_MESSAGES=10 |
| 2 | hydration 重复 fire `/api/extract` + 重复 verify event | `3b794f1` | processedExtractRef + hydrationDoneRef |
| 3 | clearAll 不级联清 memory/reminder/conversation | `3b794f1` | profile 页 handler 调 4 个 store cascade |
| 4 | currentSupplements 没注入 chat | `c2994e2` | ProfileSnapshot + personToSnapshot + systemPrompt + PromptInspector + retriever |
| 5 | 禁词不全 + 用户可见替换 + audit 边界 | `955a258` | bannedWordsFilter + sanitize + chat route preflight + 文件头 4 条边界注释 |
| 6 | Hermit observation 不可追溯到真实 eventId | `4d5f8dc` | HermitButton 透传 eventId + sanitize basedOnEventIds 必须 ⊆ 输入 |

详见各 commit message。

---

## 3. 已知未做（按优先级）

### 3.1 P1（影响生产 / 用户体验）

| 项 | 影响 | 解决方向 |
|---|---|---|
| 注册系统 | 数据丢失（清浏览器即没）| 手机号 OTP / 邮箱 magic link / 微信扫码（个人主体限制详见我之前讨论）|
| Push 提醒 | 用户不打开浏览器收不到 | PWA service worker / 微信小程序 |
| Hermit 自动周期触发 | 仅手动按钮，用户记不起来用 | 用户开 cloud memory 后加 cron |

### 3.2 P2（demo 期可接受）

| 项 | 影响 | 解决方向 |
|---|---|---|
| 流式中可能瞥见禁词 | 合规折中（流后无法撤回）| AI SDK experimental_transform rolling sanitizer |
| Audit 写失败 = 流后只 stderr | 严格合规漏点 | input/output 双写都 sync 阻塞 OR 命中禁词改非流式 |
| Disclaimer 漏写不补齐 | 偶发 LLM 漏写 | onFinish 后处理：检测末尾无 disclaimer 时自动 append |
| URGENT 关键词列表只有 7 个 | 严重异常拦截可能漏 | 药师扩词 + 监控 audit 看真实漏报 |
| QuickReplies 误判 | 把非选项的编号列表当选项 | 收紧 parser 约束 / 让 AI 加 marker |

### 3.3 P3（v0.4 之后再考虑）

| 项 | 当前 | 想做 |
|---|---|---|
| 字段级隐私上行开关 | 全 LocalStorage 一刀切 | 用户选哪些字段上云 |
| Memory 导出/导入 JSON | 无 | 备份恢复 |
| Hermit cron + email | 仅手动 | 周期 + 邮件 digest |
| 商品 URL inspect | 无（action-first 想做）| /api/product/inspect |
| 拍照 OCR 识别保健品 | 无 | OpenAI Vision / GPT-4V |
| 多语言 i18n | 仅中文 | 英文 / 日文 |

---

## 4. 性能 / 拓展瓶颈

### 4.1 LocalStorage 上限

- 浏览器一般 5MB
- 当前用量估算：profile + memory(500 条) + conversation(12 条/person × N person) + reminder(N 条) ≈ 1-2 MB
- N 很多 person 或长 chat 可能撞上限
- **报警**：暂无 — 用户 silently 数据写失败
- **fix**：P1 加云端 + LocalStorage 当 cache

### 4.2 minimax 国际版冷启

- 第一个 token 1-2s（可接受）
- 长 chat 流偶发 5-8s（可接受）
- 速率限制未公开，未触发过

### 4.3 Tool stepCountIs(2)

- 当前仅支持 1 次 tool call → tool result → 1 次确认文字（共 2 step）
- 如要支持 LLM 在一轮内连续多 tool（如先查数据再设提醒）需提到 stepCountIs(3+)
- 提之前要测明白 minimax 多 step 行为 + 成本

### 4.4 PillBox 渲染

- 4 个 SVG cell 内联渲染，每个含 SoilTexture pattern + 多个 ellipse
- 1-min `setInterval` 触发 re-render
- 4 个 person × 4 cells × 2 pills × 8 petals ≈ 256 SVG nodes — 性能 OK
- 极端 case：1 person 多 routine（>20 rule）→ multiple +N 溢出 — 仍 OK

---

## 5. 接手注意事项

### 5.1 改 PillBox 视觉前必读

`docs/product/品牌视觉规范.md` §11 + `DESIGN.md` §11.5 + 本目录 `03-design-system.md` §4.4。

D14.2-D14.8 共 7 次迭代踩过的坑：
- 圆形 = 看着像炸弹（D14.1 → 改胶囊）
- 大白勾 = checkbox 感（D14.1 → 改 sprout → 删勾）
- 5 瓣自制花 = 不符合 v0.2 原版 (D14.5 → 用 v0.2 原版)
- 花头悬空在 cell 顶部 (D14.7 → 下挪 + 重排土→茎→花)

下次改前先看 `git log src/components/brand/PillBox.tsx` 和 `git log src/components/brand/SeedSproutStage.tsx`，避免重蹈。

### 5.2 改 chat tool 前必读

- AI SDK v6 的 tool-call 流必须用 useEffect 监听 `tool-create_reminder` 的 `input-available` 状态，**不能**用 onToolCall 闭包（v6 closure 不稳定）
- `processedToolCallsRef` 防 double-handle
- 加新 tool 必须同步加 `chatTools` schema + 客户端 useEffect handler + sendAutomaticallyWhen 配置

### 5.3 改禁词逻辑前必读

合规边界（07-compliance.md §4）— 不要把"流前 sync audit 失败"改成静默继续，会突破合规底线。

### 5.4 改 store schema 前必读

`06-data-model.md` §7 — zustand v5 inline filter 必须 useShallow，否则 React #185。

### 5.5 改 multi-person 前必读

useChat 必须用 `id: chat-${activePerson.id}`，否则切人时 messages 不 reset → 串扰复发（Codex Finding #1 反例）。

---

## 6. 测试覆盖现状

### 6.1 自动测试

```bash
npm run test:unit    # 仅老 v0.2 capability layer 单测
```

v0.4 chat / memory / reminder 路径**几乎无单测**。WAIC 期靠人工 review。

### 6.2 人工验收清单

`docs/v0.4-handoff-2026-04-26.md` partner 验证清单（8 个核心场景 + 边界）

### 6.3 应该补的测试（P3）

| 模块 | 测试类型 | 优先级 |
|---|---|---|
| `slot.bucketSlot()` | 单测（24 个小时边界）| 中 |
| `parseChoices()` 3 策略 | 单测（每策略 + 误判 cases）| 高 |
| `groupRulesBySlot()` | 单测 | 中 |
| `ackRule()` 降频逻辑 | 单测（连续 skip 触发 0.5x → 0.25x）| 中 |
| `Hermit sanitize` basedOnEventIds 过滤 | 单测 | 中 |
| `PillBox` SVG snapshot test | visual regression | 低 |
| chat e2e（playwright）| 5 个核心场景 | 高 |

---

## 7. 跟 v0.2 老路径的关系

`src/lib/capabilities/` 下的 4 层（intent / judgment / translation / safetyTranslation）是 v0.2 严格架构产物，CLAUDE.md §10 锁定不动。

chat 路径完全不调用这些。但 `/archive` `/recheck` `/intake` 等老页面仍在。

5 月后清理：
- 看 v0.4 是否完全替代老路径功能（archive 是否还要？recheck 现在没接 chat 路径了）
- 决定老路径 deprecate 时机

---

## 8. 致谢 / 历史承担

- v0.2 架构 + 4 阶段品牌物件 (SeedSproutStage) 来自 2026-04-23 用户确认稿
- v0.3 RAG chatbot pivot 来自 2026-04-25 决策
- v0.4 北极星 loop 来自 2026-04-25 partner 反馈"产品偏离北极星"
- D14 PillBox × Seed signature 来自 Kevin 2026-04-27 设计契约
- Codex review 6 条 bug 全部由外部 Codex agent 找出，2026-04-27 修复

---

**事实源**：本目录所有其他文档 + `docs/v0.4-vs-action-first-divergence.md` + git history (last 50 commits)
