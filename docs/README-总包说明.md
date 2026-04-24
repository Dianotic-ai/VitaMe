---
title: "VitaMe P0 收口文档总包说明"
description: "汇总当前 P0 收口文档组的最新 canonical 文件清单与使用顺序。"
doc_type: "index"
status: "active"
created: "2026-04-20"
updated: "2026-04-20"
canonical: true
privacy: "internal"
tags: ["docs", "index", "p0", "bundle", "navigation"]
purpose: "作为 P0 收口文档组的快速总览入口。"
---

# VitaMe P0 收口文档总包说明

这批文档已经整合进当前 `docs/` 主结构。以下列表反映的是**最新 canonical 版本**，不是临时打包目录内的副本路径。

## 包含内容

### 产品层

- `docs/product/VitaMe-P0-统一执行总纲.md`
- `docs/product/VitaMe-P0-用户上下文分类法.md`
- `docs/product/VitaMe-P0-风险判定矩阵.md`
- `docs/product/VitaMe-P0-数据白名单.md`
- `docs/product/VitaMe-P0-信任与Claims边界政策.md`
- `docs/VitaMe-P0-文档索引-依赖关系图.md`

### superpowers / specs

- `docs/superpowers/specs/2026-04-20-vitame-p0-api-contract.md`
- `docs/superpowers/specs/2026-04-20-vitame-p0-test-matrix.md`
- `docs/superpowers/specs/2026-04-20-vitame-p0-metrics-instrumentation.md`

## 建议阅读顺序

1. 先看 `docs/VitaMe-P0-文档索引-依赖关系图.md`
2. 冻结 `VitaMe-P0-统一执行总纲`
3. 冻结 `VitaMe-P0-用户上下文分类法` 与 `VitaMe-P0-风险判定矩阵`
4. 冻结 `2026-04-20-vitame-p0-api-contract` 与 `VitaMe-P0-数据白名单`
5. 冻结 `2026-04-20-vitame-p0-test-matrix` 与 `2026-04-20-vitame-p0-metrics-instrumentation`
6. 最后冻结 `VitaMe-P0-信任与Claims边界政策`

## 使用约定

- 当前版本以 `docs/product/` 和 `docs/superpowers/specs/` 下的文件为准。
- 若与 `docs/VitaMe-doc-gap-fill-complete/` 内的残留导入包结构出现差异，以当前 canonical 路径为准。
- 需要确认落库规则时，配合 `README-落库说明.md` 一起看。
