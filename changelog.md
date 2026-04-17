# Changelog

## 2026-04-17

### Project folder restructure

- 新增 `docs/` 作为人工维护文档的主入口，并拆分为 `context/`、`product/`、`decisions/`、`research/`、`strategy/`
- 将原 `0415内容准备/` 及其 `0416输出/` 下的文档迁移到对应 `docs/` 子目录
- 将根目录 `背景信息.md` 迁移到 `docs/context/背景信息.md`
- 将根目录 `gemini-health-consultation.md` 迁移到 `docs/research/gemini-health-consultation.md`
- 保留 `gstack-output/`、`_bmad/`、`_bmad-output/`、`sessions/` 原有结构不动
- 同步更新 `CLAUDE.md`、`AGENTS.md` 与文档内引用，指向新的目录结构

### Notes

- 本次未修改任何文档文件名，只调整了目录路径与文档索引。

### Docs naming & frontmatter normalization

- 统一 `docs/product/` 与 `docs/decisions/` 的命名规则为 `VitaMe-` 前缀 + 中文主题词 + 必要结构标记
- 当前有效产品文档去掉文件名中的日期，日期只保留在纪要、会诊等时间性文档上，并统一为 `YYYY-MM-DD`
- 文件名映射：
  - `VitaMe-补剂安全翻译Agent-定位文档-20260417.md` → `VitaMe-补剂安全翻译Agent-定位.md`
  - `VitaMe-补剂安全翻译Agent-P0-PRD-20260417.md` → `VitaMe-补剂安全翻译Agent-P0-PRD.md`
  - `VitaMe-补剂安全翻译Agent-User-Journey-20260417.md` → `VitaMe-补剂安全翻译Agent-User-Journey.md`
  - `健康守护Agent-产品定位终稿.md` → `VitaMe-保健品安全检测-定位终稿.md`
  - `VitaMe-产品方案-v1-feedback.md` → `VitaMe-产品方案-v1-反馈.md`
  - `VitaMe-产品方案-v2-讨论纪要-20260416.md` → `VitaMe-产品方案-v2-讨论纪要-2026-04-16.md`
  - `VitaMe-技术选型-Anthropic会诊-20260417.md` → `VitaMe-技术选型-Anthropic-会诊-2026-04-17.md`
- 统一 `docs/*.md` 的 frontmatter 核心字段：`title`、`description`、`doc_type`、`status`、`created`、`updated`、`canonical`、`privacy`、`tags`
- 在 `docs/README.md` 与 `AGENTS.md` 中补充文档命名和 frontmatter 约定

### Superseded doc marking

- 为仍以“微信小程序”或旧产品形态为当前方案的早期策略稿新增过期标记
- 将以下文档的 `status` 从 `reference` 调整为 `superseded`，并补充替代文档说明：
  - `docs/strategy/product-brief-health-agent.md`
  - `docs/strategy/product-brief-health-agent-distillate.md`
  - `docs/strategy/office-hours-design-20260413.md`
  - `docs/strategy/research-hackathon-strategy.md`
- 在 `docs/README.md` 与 `AGENTS.md` 中补充 `status: superseded` 和 `superseded_by` frontmatter 约定
- 修正 `CLAUDE.md` 中过期的“小程序为当前产品形态”表述，统一为“手机 H5 / 微信内 WebView”

### Agent routing guidance

- 更新 `AGENTS.md`，补充基于上下文、用户意图和任务场景优先匹配现有 skill 的原则
- 明确在 skill 路由不清晰、能力覆盖不完整或需要补充发现时，优先使用 `find-skills` 做精确补位

### Product spec additions

- 新增 `docs/product/VitaMe-补剂安全翻译Agent-Aha-Moment-Activation-Spec.md`，明确 P0 的 aha moment、激活定义、激活路径和激活指标
- 新增 `docs/product/VitaMe-补剂安全翻译Agent-Retention-Loop-Growth-Flywheel.md`，明确当前版本的回访逻辑、留存闭环和增长飞轮
- 新增 `docs/product/VitaMe-补剂安全翻译Agent-宏观设计.md`，作为页面级动线 spec 之前的上游设计文档
- 更新 `docs/README.md` 的建议阅读顺序，纳入以上 3 份新文档
