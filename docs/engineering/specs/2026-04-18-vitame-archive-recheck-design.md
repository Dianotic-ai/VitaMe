---
title: "VitaMe P0 Design — Archive & Recheck"
description: "补剂安全翻译 Agent 的档案沉淀与快速复查能力设计。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-18"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "archive-recheck"]
---

# VitaMe P0 Design — Archive & Recheck

## Architecture

Archive & Recheck 实现 PRD §9 FR-7——让"一次查询"变成"下一次更轻的决策"。它不是后台管理系统,而是 User Journey J4 的工程对应:**保存是延续,不是收尾**(宏观设计 §6 交互母型 4)。

两大能力:**Save**(首次查询后保存结果到某 Person)和 **Recheck**(下次新增一项时自动附既有 context 跑一次全档案交叉检查)。

P0 不做账号、不做多设备同步。所有档案数据存 LocalStorage + Zustand。一个 Archive 下可建多个 Person(`self` / `mom` / `dad` / 自定义 label),每个 Person 独立持有 `{ conditions, medications, allergies, saved_queries: Query[] }`。风险 2(产品被做成单次检查工具)的应对直接落在这层:首次查询结果页强制 CTA "保存到档案"(宏观设计 §3 沉淀层)。

## Components

- **ArchiveStore** (`src/lib/archive/archiveStore.ts`):Zustand store + LocalStorage persist middleware。全局 API:`getArchive()`、`save(entry)`、`getPerson(id)`、`listPersons()`、`exportJson()`。
- **PersonModel** (`src/lib/archive/personModel.ts`):`Person = { id, role: "self"|"parent"|"other", label: string, conditions, medications, allergies, special_groups, genes?, saved_queries: [] }`。支持建、改、删、合并(同一 Person 多次查询自动聚合到一个记录,不重复存)。
- **SaveFlow** (`src/lib/archive/saveFlow.ts`):一次保存的流程:收集结果页的 Risk + 原始 Query + 用户选择的 personId → 写入 ArchiveStore。若 personId 不存在,触发建 Person 流程。
- **RecheckOrchestrator** (`src/lib/archive/recheckOrchestrator.ts`):给定 personId + 新 ingredient,从 Archive 拉 Person 的既有 `{ conditions, medications }` + 已保存 queries 的 ingredients,拼入 SafetyJudgment 的入参,触发一次"新增项 × 既有全集"交叉检查。返回 `{ newRisks, changedRisks }`。
- **FamilyScopeResolver** (`src/lib/archive/familyScopeResolver.ts`):保存 CTA 触发时,判断当前查询应归于哪个 Person。默认 `self`,但 Query Intake 若检测到"我妈/爸/家人"等关键词自动预选 `parent`。

## Data Flow

**Save 路径**:

1. 结果页 CTA `保存到档案` 触发
2. 前端调 `SaveToArchive` 组件 → 展示 Person 选择器(self / 已有 Person / 建新 Person)
3. `POST /api/archive/save` `{ personId | newPerson, sessionId, risks }`
4. `SaveFlow.save()`:
   - 若 newPerson → `PersonModel.create()`
   - 把 `QuerySession.context` 合并到 `Person.conditions/medications/allergies`(去重)
   - `ArchiveStore.save({ personId, query, risks, timestamp })`
5. 返回 `{ archiveEntryId, personSummary }`

**Recheck 路径**:

1. 用户进 `/archive` → 选某 Person → 点"新增一项"
2. 前端复用 QueryInput 组件,但 `personRef` 预填
3. `POST /api/query` 带 `personRef`
4. Query Intake 从 ArchiveStore 拉该 Person 的既有 context,**自动跳过已知信息的问题**(比如已知"肝炎" → 不再问"有无肝病")
5. 只问新 ingredient 相关的追加问题(如"剂量""服用时间")
6. SafetyJudgment 跑一次"新 ingredient × (既有 ingredients ∪ 既有 context)"
7. `RecheckOrchestrator.diff()`:对比本次 risks 和该 Person 上次保存的 risks
8. 返回 `{ newRisks: Risk[], unchangedRisks: Risk[], overallLevel }`

## Error Handling

- **LocalStorage 配额溢出 (~5MB)**:触发 `QuotaExceededError` → 前端提示"档案已达上限",禁止新增,给"导出 JSON"入口;下次可导入。
- **PersonId 已删除但 saved_queries 还引用**:RecheckOrchestrator 检测到失效 Person → 提示"档案不存在,是否新建?"。
- **同一 Person 重复保存同一 ingredient**:去重合并,保留最新结果 + 保留历史时间戳,不创建冗余 entry。
- **跨设备丢失**:P0 接受,档案页顶栏常驻"未登录,建议导出备份"。导出 JSON 支持自查或迁移。
- **隐私**:LocalStorage 数据不上传服务器。Person 下的 conditions 属敏感信息,首次创建时提示用户"信息仅存本设备"。
- **Recheck 时 Person 信息过期**:若超过 90 天未更新,提示用户"建议重新确认用药 / 病史是否变化"。

## Testing

场景 1 — Q5 真实评论(湖南 01-04),家人档案建立 + 复查:

> "家里老人有肝炎+脂肪肝,apoe4 基因,可以吃鱼油吗?什么样的鱼油?"

- WHEN 用户完成首次查询 → 点击"保存到档案"
- AND 选择"给妈妈"(FamilyScopeResolver 自动预选 `parent`)
- THEN `ArchiveStore` 新建 `Person { id: "mom", role: "parent", label: "妈妈", conditions: ["肝炎","脂肪肝"], genes: ["apoe4"] }`
- AND 保存 entry `{ query: "鱼油", risks: [...] }`
- WHEN 一周后用户在"妈妈"下新增"钙片"
- THEN Query Intake 不再问"有无肝病""有无基因检测"
- AND `SafetyJudgment` 跑 `钙片 × { 鱼油, 肝炎, 脂肪肝, apoe4 }`
- AND RecheckOrchestrator 返回 `newRisks`:无新风险 + 提醒"肝功建议 3 个月复查"
- AND `overallLevel` 仍维持在 yellow(妈妈整体档案风险级)

场景 2 — Journey J4(用户二次回访的"更轻"体验):

- WHEN 用户自己档案里已有 `{ 鱼油, 维D, 镁 } + medications: [氨氯地平]`
- WHEN 新增 "辅酶 Q10"
- THEN Query Intake 只问 1 个追加问题(剂量),不再问用药 / 慢病
- AND SafetyJudgment 复查 `辅酶Q10 × { 氨氯地平 + 既有 3 项 }`
- AND 输出含"Q10 与氨氯地平(降压)叠加需监测血压"

场景 3 — LocalStorage 满触发导出:

- WHEN 用户已保存 200+ 个 entry,LocalStorage 写入失败
- THEN 前端提示 + 展示"导出 JSON"按钮
- AND 导出文件包含全部 Person + saved_queries
- AND 用户清空档案后可重新导入(P1 路线)

场景 4 — 家人场景自动识别:

- WHEN 用户在首次查询输入 "我妈吃的辅酶 Q10"
- THEN FamilyScopeResolver 检测到"我妈"关键词
- AND 保存 CTA 默认选中"给妈妈",不是"自己"
- AND 用户可手动改选
