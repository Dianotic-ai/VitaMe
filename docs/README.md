---
title: "VitaMe Docs"
description: "VitaMe 文档目录总览与阅读入口。"
doc_type: "index"
status: "active"
created: "2026-04-17"
updated: "2026-04-17"
canonical: true
privacy: "internal"
tags: ["docs", "index", "navigation"]
---

# VitaMe Docs

`docs/` 是当前仓库的人类可读主目录，按用途而不是按日期组织。

## 目录

- `context/`：项目原始背景、创始人痛点、问题起点
- `product/`：当前有效的定位、路线图、PRD、User Journey
- `decisions/`：产品方案演进、反馈记录、技术决策
- `research/`：深度研究、竞品调研、外部会诊与补充材料
- `strategy/`：product brief、黑客松策略、早期 office hours 输出

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
9. `decisions/` 和 `research/` 中的补充文档

## 约定

- `gstack-output/`、`_bmad/`、`_bmad-output/`、`sessions/` 保持原样，视为工具或历史产物目录。
- 后续新增产品文档优先放入 `docs/` 对应子目录，不再新建按日期命名的大目录。
