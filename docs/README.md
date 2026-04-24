---
title: "VitaMe Docs"
description: "VitaMe 文档目录总览与阅读入口。"
doc_type: "index"
status: "active"
created: "2026-04-17"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["docs", "index", "navigation", "superpowers"]
---

# VitaMe Docs

`docs/` 是当前仓库的人类可读主目录，按用途而不是按日期组织。

## 目录

- `context/`：项目原始背景、创始人痛点、问题起点
- `product/`：当前有效的定位、路线图、PRD、User Journey 与 P0 收口文档
- `decisions/`：产品方案演进、反馈记录、技术决策
- `research/`：深度研究、竞品调研、外部会诊与补充材料
- `strategy/`：product brief、黑客松策略、早期 office hours 输出
- `superpowers/`：P0 工程化规划包（plan + specs + Demo 验收 checklist），驱动 Claude Code 落地

## P0 收口文档入口

- `README-总包说明.md`：当前 P0 收口文档组总览与文件清单
- `README-落库说明.md`：这些文档在当前仓库中的 canonical 路径与维护约定
- `VitaMe-P0-文档索引-依赖关系图.md`：8 份 P0 收口文档的阅读顺序、依赖关系与冻结顺序

## Frontmatter 标准

所有 `docs/*.md` 文档统一使用 YAML frontmatter，核心字段如下：

```yaml
---
title: "文档标题"
description: "一句话说明文档用途"
doc_type: "文档类型"
status: "active | reference | superseded"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
canonical: true
privacy: "internal | sensitive"
tags: ["tag-1", "tag-2"]
---
```

字段约定：

- `title`：文档显示标题
- `description`：供 agent 检索和路由使用的一句话摘要
- `doc_type`：文档类型，如 `prd`、`positioning`、`research`
- `status`：当前是否为现行文档，`active` 表示当前有效，`reference` 表示历史或参考材料，`superseded` 表示已被后续方案明确替代的过期文档
- `created` / `updated`：文档创建时间与最近更新时间
- `canonical`：是否为当前主参考文档
- `privacy`：`internal` 为团队内部资料，`sensitive` 为涉及隐私或敏感背景的资料
- `tags`：补充检索标签

可选扩展字段：

- `source_doc` / `source_docs`：文档依赖的上游输入
- `external_sources`：外部来源或赛事信息
- `purpose`：面向下游 agent 或文档链路的特殊用途说明
- `superseded_by`：当前替代它的有效文档列表

## 文件命名规范

- `docs/product/` 与 `docs/decisions/` 默认使用 `VitaMe-` 前缀
- 文件名只保留主题和必要结构标记，不重复写目录语义
- 允许保留的结构标记包括：`v1`、`v2`、`P0`、`PRD`、`User-Journey`
- 主题词默认中文优先，仅在稳定术语上保留英文，如 `PRD`、`User-Journey`、`Anthropic`
- 只有纪要、会诊、评审等时间性文档保留日期，格式统一为 `YYYY-MM-DD`
- 当前有效文档不在文件名里附加日期，时间与主次统一依赖 frontmatter 表达

## 建议阅读顺序

1. `context/背景信息.md`
2. `product/VitaMe-保健品安全检测-定位终稿.md`
3. `product/VitaMe-补剂安全翻译Agent-定位.md`
4. `product/VitaMe-补剂安全翻译Agent-Aha-Moment-Activation-Spec.md`
5. `product/VitaMe-补剂安全翻译Agent-Retention-Loop-Growth-Flywheel.md`
6. `product/VitaMe-补剂安全翻译Agent-宏观设计.md`
7. `product/VitaMe-补剂安全翻译Agent-P0-PRD.md`
8. `product/VitaMe-补剂安全翻译Agent-User-Journey.md`
9. `VitaMe-P0-文档索引-依赖关系图.md`
10. `product/` 与 `superpowers/specs/` 中的 P0 收口文档
11. `decisions/` 和 `research/` 中的补充文档

## Superpowers / P0 Engineering Plan（4-18 锁定）

`docs/superpowers/` 是交给 Claude Code 执行的工程化规划包，围绕 2026-04-30 WAIC 初赛死线锁定 P0 范围。权威版本以 `plans/2026-04-18-vitame-p0-plan.md` 为准。

### `plans/`

- `2026-04-18-vitame-p0-plan.md`：P0 主实施计划（~96 任务 / 12 天时间表 / 5 收敛门 / 3 档 scope / 找药剂师审核清单）
- `2026-04-18-vitame-数据接入与实现方案.md`：8 数据源离线烘焙与 LLM Adapter 实现方案
- `2026-04-18-vitame-数据源盘点.md`：L1 / L2 / L3 三层数据源盘点与取舍

### `specs/`

- `2026-04-18-vitame-query-intake-design.md`：查询入口设计（文字 + 拍照 OCR 双入口 / DSLD 字典标准化）
- `2026-04-18-vitame-safety-judgment-design.md`：安全判定设计（3 路并发 adapter / 规则引擎全离线）
- `2026-04-18-vitame-safety-translation-design.md`：安全翻译设计（LLM Adapter 3 provider + 多模态 / 禁词 Guardrail）
- `2026-04-18-vitame-compliance-design.md`：合规 5 层中间件设计（Evidence → Banned → Critical → Disclaimer → Audit）
- `2026-04-18-vitame-archive-recheck-design.md`：家人档案与复查设计（LocalStorage + Zustand）
- `2026-04-18-vitame-demo-acceptance-checklist.md`：Demo 验收 Checklist（11 条，6 必保 + 4 体验 + 1 主场景亮点）

### 锁定要点

- **LLM**：Minimax 默认（现有 token plan）/ DeepSeek 备选 / openclaw-gateway 本机复用；vision 固定 Minimax
- **数据**：8 源全离线烘焙 + 50 条硬编码禁忌，运行时不联网（合规红线）
- **部署**：硅谷云 2 核 4G / Nginx / pm2 / Cloudflare CDN / 域名 vitame.live（不走 ICP）
- **主 Demo 场景**：OCR 拍照瓶子 → 结构化成分 → 红黄灰绿结果

## 约定

- `gstack-output/`、`_bmad/`、`_bmad-output/`、`sessions/` 保持原样，视为工具或历史产物目录。
- 后续新增产品文档优先放入 `docs/` 对应子目录，不再新建按日期命名的大目录。
- `docs/superpowers/` 下的 plan / spec 一旦锁定（如 4-18 版本），更新时保留文件名中的锁定日期作为历史锚点。
