# 文档命名规范

> 适用于 `docs/` 下所有 markdown 文档。**新文件必须按本规范**；现有旧文件不大规模 rename（留 Sprint 末 D8-9 批量处理），合并期保持引用稳定。
>
> **Last updated**: 2026-04-24（D7，Phase 4 合并日）

---

## 1. 基本约束

- **最大长度**：25 字符（不含扩展名），超长换位置不换描述
- **分隔符**：`-`（横线），禁止空格 / 下划线
- **删除冗余前缀**：
  - ❌ `VitaMe-补剂安全翻译Agent-P0-PRD.md`
  - ✅ `PRD.md`（在 `docs/product/` 里，项目名由仓库路径决定）

---

## 2. 按目录分类的命名模式

| 目录 | 语言 | 模式 | 好例子 | 反例 |
|---|---|---|---|---|
| `product/` | 中文为主 | 主题直述 | `PRD.md` / `宏观设计.md` / `用户旅程.md` / `Aha-Moment.md` / `定位.md` | `VitaMe-补剂安全翻译Agent-宏观设计.md` |
| `engineering/specs/` | 英文 kebab-case | 功能名 | `query-intake.md` / `safety-judgment.md` / `api-contract.md` | `2026-04-18-vitame-query-intake-design.md` |
| `engineering/plans/` | 英文 kebab-case | 计划名 | `p0-plan.md` / `data-ingest.md` | `VitaMe-P0-统一执行总纲.md` |
| `decisions/` | 中/英皆可 | `YYYY-MM-DD-主题` | `2026-04-17-anthropic会诊.md` / `2026-04-21-kevin-review-handoff.md` | `VitaMe-技术选型-Anthropic-会诊-2026-04-17.md` |
| `research/` | 中文为主 | 主题直述 | `小红书用户需求调研.md` / `竞品调研报告.md` / `Demo种子问题清单-100条.md` | — |
| `docs/` 根（运行态 + 经验）| 大写锚点 | 全大写 | `SESSION-STATE.md` / `MAIN-CC-LESSONS.md` / `CLAUDE.md-changelog.md` | — |
| `_archive/` | 保留原名 | 归档不改 | `_bmad/...` | — |

---

## 3. 日期前缀规则

| 类型 | 日期 | 说明 |
|---|---|---|
| 会议纪要 / 决策纪要 / handoff | ✅ 需要 | `YYYY-MM-DD-主题.md`，日期在前便于时间排序 |
| 设计 spec（engineering/specs）| ❌ 不需要 | 最新版覆盖，历史靠 git log |
| 运行态 doc（SESSION-STATE 等）| ❌ 不需要 | 永远是"当前态" |
| 研究报告 | 可选 | 有时间敏感性（行业/竞品随时变）时加 `-YYYY-MM-DD` |

---

## 4. 大小写

- **纯英文**：全小写 kebab-case（`api-contract.md`）
- **中文主导**：中文原样 + 必要的 ASCII 可大写（`Demo种子问题清单-100条.md`）
- **中英混用日期**：大写保留原 proper-noun 的大小写（`2026-04-17-Anthropic会诊.md`），但非专有名词都小写

---

## 5. 版本号

- **默认不写** `v1 / v2`（git commit 管理）
- **方案对比性文档**允许 `-v1 / -v2` 后缀，例如：
  - `产品方案-v1.md` / `产品方案-v2-讨论纪要.md`
- **Deprecated 不删**，搬到 `docs/_archive/` 带原名

---

## 6. 引用稳定性

- 路径在代码注释/测试引用 + 跨文档 link 里会被硬编码
- **rename 前**必须 grep 全仓确认影响面：`git grep "docs/old-path"`
- **小规模重命名**（1-3 文件）在 Phase 5 测试时顺带；**大规模**（5+ 文件）单独拉 PR、一次性改完、配自动化路径更新脚本

---

## 7. Rename 时机约束

- **P0 Demo 前（D7-D8 白天）**：不做大规模 rename（风险高于收益）
- **Sprint 末（D8 晚 / D9）**：批量 rename，配刷 CLAUDE.md §7 + grep 验证无死链
- **Sprint 后（D12+）**：正式建立自动化 lint（markdownlint 可配 file-name 规则）
