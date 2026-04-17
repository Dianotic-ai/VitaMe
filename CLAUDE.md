# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概况

**健康守护Agent（VitaMe）** — AI驱动的家庭保健品安全管理微信小程序。

核心定位（尚未确定）：**"你给爸妈买的保健品，真的安全吗？"**
- 核心功能：药物-保健品冲突检测 + 安全替代推荐
- 目标用户：25-40岁成年子女（给50-70岁父母选购管理保健品）
- 差异化：药物 × 保健品 × 病史 三角交叉安全校验（蓝海，无直接竞品）

价值链路：安全检测（建信任）→ 成分解析（展专业度）→ 替代推荐+比价（创经济价值）

## 背景

2026年4月底参加 WAIC"超级个体创业黑客松"（创业赛道），需要可运行Demo。团队有医学检测博士和护士，匹配安全方向。

## 当前阶段

项目处于**产品规划阶段**，尚无代码实现。仓库内容全部是规划文档和调研材料。技术方向初定微信小程序 + DeepSeek-V3 + RAG。

## 仓库结构

- `docs/` — 人工维护的核心文档目录
- `docs/context/` — 产品初始构想与创始人痛点
- `docs/product/` — 当前定位、路线图、PRD、User Journey
- `docs/decisions/` — 产品方案迭代和技术决策记录
- `docs/research/` — 深度研究、竞品与外部资料
- `docs/strategy/` — product brief、黑客松策略、office hours 输出
- `gstack-output/` — gstack 评审输出，保留为历史产物
- `_bmad/` — BMAD 方法论框架配置（v6.3.0），通过 `/bmad-*` slash command 调用
- `_bmad-output/` — BMAD 产出目录
- `sessions/` — 会话与快照记录

## BMAD 使用

项目集成了 BMAD 方法论（v6.3.0）。关键配置：
- 用户：沟通语言和文档输出语言均为中文
- 产出目录：`_bmad-output/planning-artifacts/`（规划阶段产物）
- 可通过 `/bmad-*` skill 调用各角色（analyst, architect, pm, ux-designer 等）

## 关键决策记录

以下决策已在 `docs/product/VitaMe-保健品安全检测-定位终稿.md` 中确认：
- 定位从"体检趋势分析"**转向**"保健品安全检测"
- MVP 阶段不做 OCR、比价爬虫、穿戴设备、复杂打卡
- 安全规则引擎中的禁忌规则需**硬编码**（非纯 LLM 生成）
- 法规红线：不诊断疾病、不出医疗结论、不替代医嘱，每次输出必须包含免责声明

问chatgpt的对话链接，其实llm已经做的很好了，那我们的差异点及区别是什么https://chatgpt.com/share/69e0dd18-d654-8331-8d24-08308d4b4649

## 安全红线（健康类产品）

- 定位"健康信息服务"，非"医疗服务"。小程序类目选"生活服务-营养查询"
- 免责声明每次AI输出强制展示，不仅在条款中
- 严重异常指标（如空腹血糖>7.0）硬编码触发"请立即就医"，不依赖LLM
- 禁忌规则（~50条病史×成分交叉）硬编码，不可被Prompt覆盖
- 措辞避免"治疗""治愈""药效"，使用"辅助""参考""营养补充"
- 体检数据属于敏感个人信息，需单独授权+加密存储+数据最小化

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
