---
title: "VitaMe P0 收口文档落库说明"
description: "说明 P0 收口文档在当前 docs 结构中的 canonical 路径、维护方式与更新约定。"
doc_type: "guide"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["docs", "guide", "p0", "integration", "canonical"]
purpose: "避免继续维护并行文档树；后续更新以 canonical 位置为准。"
---

# VitaMe P0 收口文档落库说明

这批 P0 收口文档已经整合进当前 `docs/` 主结构，不再以独立“补丁包目录”作为主维护位置。

## Canonical 路径

### 产品层

- `docs/product/VitaMe-P0-统一执行总纲.md`
- `docs/product/VitaMe-P0-用户上下文分类法.md`
- `docs/product/VitaMe-P0-风险判定矩阵.md`
- `docs/product/VitaMe-P0-数据白名单.md`
- `docs/product/VitaMe-P0-信任与Claims边界政策.md`
- `docs/VitaMe-P0-文档索引-依赖关系图.md`

### 工程 / 验证层

- `docs/superpowers/specs/2026-04-20-vitame-p0-api-contract.md`
- `docs/superpowers/specs/2026-04-20-vitame-p0-test-matrix.md`
- `docs/superpowers/specs/2026-04-20-vitame-p0-metrics-instrumentation.md`

## 维护约定

1. 后续内容更新直接修改上述 canonical 文件。
2. `docs/README.md`、`README-总包说明.md`、`README-落库说明.md`、`文档索引-依赖关系图.md` 需要同步反映最新结构和最新文件状态。
3. `docs/VitaMe-doc-gap-fill-complete/` 仅保留为导入包参考目录，不作为当前主维护位置。
4. 若未来新增同类 P0 收口文档，优先放入 `docs/product/` 或 `docs/superpowers/specs/`，不要再新建并行包目录。

## 建议使用方式

1. 先看 `docs/VitaMe-P0-文档索引-依赖关系图.md`
2. 再按索引中的冻结顺序审阅正文档
3. 需要快速确认文件位置时，优先看本文件
