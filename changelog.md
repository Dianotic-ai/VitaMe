# Changelog

## 2026-04-24

### Docs source-of-truth rebuild

- 将文档体系升级为 VitaMe Agent v2：P0 补剂安全判断为执行楔子，P1/P2 明确为 Reminder、Feedback、Memory、Hermit Agent 自我进化闭环。
- 重写 canonical 产品文档：`START-HERE.md`、`当前判断.md`、`定位.md`、`PRD.md`、`用户旅程.md`、`路线图.md`、`Aha-Moment.md`、`留存飞轮.md`。
- 新增产品文档：`docs/product/Agent-北极星.md`、`docs/product/指标体系.md`、`docs/product/demo-script-map.md`。
- 新增工程文档：`system-architecture.md`、`data-flow.md`、`implementation-map.md`、`medical-review-workflow.md`、`data-source-status.md`、`compliance-audit-status.md`、`launch-checklist.md`。
- 重写 `api-contract.md`，强制区分 implemented API 和 planned API，避免把 archive / reminder / memory / hermit-cycle 写成已完成。
- 重写 `test-matrix.md`，覆盖 P0 安全判断、P1 提醒反馈、P2 Memory/Hermit、隐私和合规。
- 新增并更新 `agent-runtime-decision.md`，明确黑客松 MVP 选 Vercel AI SDK ToolLoopAgent 作为 P0 Agent shell；Mastra / LangGraph 后移为后续 P1/P2 和 durable graph 评估项。
- 重写 `metrics-instrumentation.md`，把指标分成 P0 required、P1/P2 planned 和 guardrail，避免把 archive / reminder / memory 误写成已实现。
- 将旧 Golden Path draft 和旧 Reminder 北极星 draft 移入 `docs/_archive/superseded/product-agent-v2-2026-04-24/`，当前阅读路径只保留 `demo-script-map.md` 和 `Agent-北极星.md`。
- 新增 `docs/START-HERE.md` 作为最高优先级入口，回答当前定位、P0 范围、进度和阅读路径。
- 新增 `docs/product/当前判断.md`，集中承载最新产品判断、4/23 讨论中仍有效的 insight、P0 当前取舍和不再采纳的旧方向。
- 新增 `docs/DOCS-COVERAGE.md`，建立文档完整性矩阵，标记 `current`、`rewrite-needed`、`missing`、`archived`。
- 将产品核心文档改为短文件名：`PRD.md`、`定位.md`、`用户旅程.md`、`P0-执行总纲.md`、`风险判定矩阵.md`、`数据白名单.md`、`信任与Claims边界.md` 等。
- 将工程文档改为短路径：`engineering/specs/query-intake.md`、`safety-judgment.md`、`safety-translation.md`、`compliance.md`、`api-contract.md`、`test-matrix.md` 等。
- 将根目录 `UI设计/` 纳入 `docs/product/品牌视觉规范.md` 和 `docs/assets/ui-design/`，重复 UI 图片归档到 `docs/_archive/duplicates-2026-04-24/ui-design/`。
- 将根目录 `竞品参考资料/` 纳入 `docs/research/竞品参考素材.md` 和 `docs/research/competitive-reference-assets/`。
- 将根目录非系统迁移纪要移入 `docs/decisions/`，数据烘焙方案移入 `docs/engineering/plans/`。
- 将重复根目录产品文档、旧 README 包说明、旧 strategy 文档和早期定位稿移入 `docs/_archive/`。
- 更新 `README.md`、`AGENTS.md`、`CLAUDE.md`、`docs/README.md`、`docs/SESSION-STATE.md` 和代码/测试注释中的文档路径引用。

## 2026-04-20

### P0 gap-fill docs integration

- 将 P0 收口文档正式整合进 canonical `docs/` 结构，不再只停留在 `docs/VitaMe-doc-gap-fill-complete/` 导入包目录
- 新增 `docs/engineering/specs/`，用于承载工程接口、测试矩阵和埋点规范
- 将以下产品文档落库到 `docs/product/`：
  - `P0-执行总纲.md`
  - `用户上下文.md`
  - `风险判定矩阵.md`
  - `数据白名单.md`
  - `信任与Claims边界.md`
  - `VitaMe-P0-文档索引-依赖关系图.md`
- 将以下执行规格文档落库到 `docs/engineering/specs/`：
  - `api-contract.md`
  - `test-matrix.md`
  - `metrics-instrumentation.md`
- 新增 `docs/README-落库说明.md`，明确 canonical 路径和后续维护规则
- 更新 `docs/README.md`、`docs/README-总包说明.md` 以及导入包内说明文件，使其统一指向最新文档版本
- 删除 `docs/VitaMe-doc-gap-fill-complete/` 下与根 `docs/` 说明重复的 `README-总包说明.md` 与 `README-落库说明.md`
- 将 `VitaMe-P0-文档索引-依赖关系图.md` 移到 `docs/` 根目录，作为跨 `product/` 与 `superpowers/specs/` 的总入口，并删除导入包中的重复副本

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
  - `VitaMe-补剂安全翻译Agent-定位文档-20260417.md` → `定位.md`
  - `VitaMe-补剂安全翻译Agent-P0-PRD-20260417.md` → `PRD.md`
  - `VitaMe-补剂安全翻译Agent-User-Journey-20260417.md` → `用户旅程.md`
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

- 新增 `docs/product/Aha-Moment.md`，明确 P0 的 aha moment、激活定义、激活路径和激活指标
- 新增 `docs/product/留存飞轮.md`，明确当前版本的回访逻辑、留存闭环和增长飞轮
- 新增 `docs/product/宏观设计.md`，作为页面级动线 spec 之前的上游设计文档
- 更新 `docs/README.md` 的建议阅读顺序，纳入以上 3 份新文档
