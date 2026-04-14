# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概况

**健康守护Agent** — AI驱动的亚健康人群健康管理微信小程序。核心叙事："提前3年发现你的健康拐点"。

串联"看懂体检→选对保健品→坚持吃"三个环节，市场上无同类产品。

## 项目阶段

当前处于 BMAD Phase 1 分析阶段（已完成），尚未开始编码。目标：2026年4月底参加世界人工智能大会"超级个体创业黑客松"。

## 产品结构

1个统一Agent入口，3个底部Tab：
- **Tab 1**: AI对话Agent（体检报告纵向趋势分析 + 症状融合推理 + 保健品成分级推荐）
- **Tab 2**: 记录、打卡、吃药提醒
- **Tab 3**: 选购建议 + 外部视频 + 图文内容

## 计划技术栈

- 前端：uni-app (Vue3) → 微信小程序（后续App复用）
- 后端：Python 3.11 + FastAPI
- AI层：DeepSeek-V3 API（MVP）→ Hermes Agent框架（正式版）
- 数据库：SQLite（MVP）→ PostgreSQL（正式）
- 部署：腾讯云轻量应用服务器

## 关键文件结构

```
背景信息.md                          # 产品原始需求和背景
_bmad/bmm/config.yaml               # BMAD方法论配置（中文、用户Sunny）
_bmad-output/planning-artifacts/     # BMAD分析产出
  prd.md                             # PRD（11个FR、6个NFR、3条用户旅程）
  product-brief-health-agent.md      # 产品简报（三重审查后）
  product-brief-health-agent-distillate.md  # 蒸馏详情包
  research-prfaq.md                  # PRFAQ逆向验证（概念评分7/10）
  research-technical.md              # 技术架构调研
  research-commercialization.md      # 商业化分析
```

## BMAD 方法论

项目使用 BMAD (Breakthrough Method for Agile AI-Driven Development) v6.3.0 管理全生命周期。BMAD 技能已通过全局插件安装（`C:\Users\sunny\.claude\plugins\marketplaces\bmad-method`），项目本地技能在 `.claude/skills/` 下。

BMAD 配置要求：通信语言和文档输出语言均为中文，用户名 Sunny。

## 安全红线（健康类产品）

- 定位"健康信息服务"，非"医疗服务"。小程序类目选"生活服务-营养查询"
- 免责声明每次AI输出强制展示，不仅在条款中
- 严重异常指标（如空腹血糖>7.0）硬编码触发"请立即就医"，不依赖LLM
- 禁忌规则（~50条病史×成分交叉）硬编码，不可被Prompt覆盖
- 措辞避免"治疗""治愈""药效"，使用"辅助""参考""营养补充"
- 体检数据属于敏感个人信息，需单独授权+加密存储+数据最小化
