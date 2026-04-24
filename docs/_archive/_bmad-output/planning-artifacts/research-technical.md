---
title: "技术架构调研: 健康守护Agent"
created: "2026-04-13"
type: technical-research
---

# 技术架构调研报告

## 关键决策

1. **Agent框架**：MVP用FastAPI+DeepSeek直接调用最稳妥；Hermes Agent作为架构目标，Demo后迁移
2. **前端**：uni-app（Vue3，为后续App复用铺路）
3. **LLM**：DeepSeek-V3（成本低￥1/M tokens、中文强、国内可达）
4. **安全**：三层防护 — 硬编码禁忌规则 > Prompt约束 > 输出过滤
5. **审核策略**：避开"医疗健康"类目，定位"生活服务-营养查询"

## 推荐技术栈
- 前端：uni-app (Vue3) → 微信小程序
- 后端：Python 3.11 + FastAPI
- AI层：DeepSeek API（MVP）→ Hermes Agent（正式版）
- 数据：SQLite(MVP) → PostgreSQL(正式)
- 部署：腾讯云轻量应用服务器(74元/月)
- OCR：腾讯云/百度OCR API

## 2周MVP路线图
- Week1 D1-2: 后端骨架(FastAPI+DeepSeek+Prompt)
- Week1 D3-4: 成分知识库(Top50 JSON+检索+禁忌规则)
- Week1 D5: 小程序前端(uni-app+HTTP对接)
- Week2 D6-7: 体检报告OCR
- Week2 D8-9: 打卡提醒+UI优化
- Week2 D10: 安全过滤+免责+Demo准备

## 月成本估算：~￥200-400
- DeepSeek API: ￥100-300
- 腾讯云服务器: ￥74
- OCR: 免费额度内

## 最大技术风险
- LLM幻觉 → 硬编码规则兜底
- 小程序审核 → "营养信息查询"类目+免责声明
- Hermes Agent集成复杂度 → 降级方案：裸FastAPI+DeepSeek
- 2人2周工作量不足 → 砍OCR和打卡
