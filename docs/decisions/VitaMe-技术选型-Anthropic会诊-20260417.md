# VitaMe 技术选型 — Anthropic 决策委员会会诊（2026-04-17）

> 日期：2026-04-17
> 起因：讨论是否复用 Hermes Agent 或其他开源框架作为 VitaMe 后端
> 关键新事实：**Hermes Agent 已在团队腾讯云硅谷服务器部署运行 1 周**（学习成本 / 部署成本 / 熟悉度 = 已沉没）
> 结论：**路径 D — Hermes as Runtime Shell**（5/5 Anthropic 视角独立推出）

---

## 一、决策过程：两轮专家会诊

### 第一轮：6 家开源方法论视角（结果受 prompt 偏差污染）

6 个 sub-agent 代入角色：

| 角色 | 代表理念 |
|---|---|
| BMAD (Brian) | scale-adaptive，规划深度按复杂度缩放 |
| GStack (Garry Tan) | opinionated minimalism，ship weekly |
| Superpowers (Jesse Vincent) | composable skills，YAGNI |
| SpecKit (GitHub) | spec 先行，intent precedes implementation |
| OpenSpec (Fission-AI) | spec 锁红线，代码保持 fluid |
| everything-claude-code (affaan-m) | 榨干 Claude Code + 复用 MIT 模块 |

**初步结果**：6/6 投"C 半路复用"（Next.js 骨架 + 从 Hermes 拷 3 个模块）

**偏差自查**：prompt 把 B 的 cons 写得最重（"学新框架"、"合规风险"），C 被包装成"折衷正确答案"——6/6 全投 C **不是共识，是 anchoring bias**。推理链不透明，只给结论不给过程。

### 第二轮：5 家 Anthropic Engineering 视角（修正偏差后的独立判断）

Prompt 改动：
- **不预设 A/B/C 三选项**，让 agent 自由给路径
- 明确告知 **"Hermes 已部署 1 周"** 的新事实
- 要求 **暴露完整推理链**（Step 1 → N），不只是结论

5 个 sub-agent 基于 Anthropic engineering blog：

| Blog | 核心观点提炼 |
|---|---|
| [building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents) | Workflow ≠ Agent；反对过早上框架；从最简单开始按需加复杂度 |
| [infrastructure-noise](https://www.anthropic.com/engineering/infrastructure-noise) | Noise 在多步 agent 里是乘法不是加法；生产级基础设施就是用来"吸收 noise"的 |
| [demystifying-evals-for-ai-agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | 早做小做迭代做；20-50 条真实失败样本起步；eval 是架构的锚 |
| [writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents) | Tool 是契约不是 wrapper；fewer higher-leverage tools；不变量 push 进 tool 代码 |
| [multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system) | Multi-agent 慢而贵（15× token，2-3× 延迟），仅"独立可并行 + 推理质量 > 成本"值得 |

**5/5 独立结论（无诱导，不同 blog 同一方向）**：**Hermes as Runtime Shell**

### 每家的推理链（透明展示，不藏结论）

**building-effective-agents**
1. VitaMe 三大功能是确定性流程 → 2. Anthropic 分类下属 workflow 不是 agent → 3. Hermes 卖点是 autonomous agent → 功能错配 → 4. "self-improving skill" 与"规则不可被 Prompt 覆盖"哲学冲突 → 5. 但已部署沉没成本不能浪费 → **Hermes 做 runtime 宿主 + workflow 模式约束**

**infrastructure-noise**
1. Demo 90 秒最致命 noise = LLM 超时 + 微信 webhook 丢包 + 记忆竞争 → 2. Hermes 过去 7 天已吸收这些 noise → 3. 自建"可控"是幻觉，noise 会在 Demo 当天第一次出现 → 4. 合规是业务层不是 runtime 层 → **Hermes 做 runtime + VitaMe 只写 3 个业务插件**

**demystifying-evals**
1. Demo 阶段 eval = 锁合规红线 + 保 90 秒不翻车 → 2. Hermes 内部 trace 是通用 agent trace，无"禁忌命中/剂量/免责声明"领域断言 → 3. 禁忌是确定性规则，该前置成独立服务 → 4. Eval 打在 tool 边界不打在 agent loop 内部 → **Hermes 做壳 + 规则引擎独立 + 三层薄 eval**

**writing-tools-for-agents**
1. Tool 是契约不是 wrapper，决定 agent 可靠性 → 2. Hermes 40+ 工具 + 自生成 skill = 契约不稳定 → 3. 不变量必须 push 到 tool 代码里（Prompt 可越狱）→ 4. 沉没成本保留 runtime，tool surface 自建 → **Hermes as runtime + VitaMe-owned MCP 独占 tool surface**

**multi-agent-research-system**
1. Multi-agent 的"慢而贵"只在独立可并行 + 推理质量优先时值得 → 2. VitaMe 4 个子任务是强耦合推理链（查交互→归因→推荐→追踪），不是独立研究分支 → 3. 合规是确定性代码不是 subagent 任务 → 4. Demo 延迟敏感（15× token / 2-3× 延迟不可接受）→ **Hermes 做单 agent + prompt chain + 硬编码规则引擎**，subagent 能力暂不启用留 V2

---

## 二、路径 D 架构：Hermes as Runtime Shell

```
┌──────────────────────────────────────────────────────────┐
│  外层：Workflow / Prompt Chain（你 100% 掌控的固定流程） │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Runtime：Hermes（已部署 1 周，只用壳不用灵魂）    │ │
│  │  ✅ 保留：LLM 调用 + MCP 传输 + 记忆 + IM 适配     │ │
│  │  ❌ 禁用：subagent delegation + self-improving    │ │
│  │           skill + 40+ 内置工具                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ VitaMe 独占 Tool Surface（5 个 MCP tool）    │ │ │
│  │  │ - check_contraindication（硬编码禁忌规则）  │ │ │
│  │  │ - lookup_supplement（SUPP.AI 查询）          │ │ │
│  │  │ - log_symptom                                │ │ │
│  │  │ - recall_symptoms                            │ │ │
│  │  │ - recommend_therapy                          │ │ │
│  │  │ 每个 tool return 必填 disclaimer 字段       │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│  Eval 边界：30 条禁忌 golden set + 10 条 Demo 回放      │
│             + 免责声明正则断言                          │
└──────────────────────────────────────────────────────────┘
```

### 与之前路径 A/B/C 对比

| 维度 | A 裸起 | B 全用 Hermes | C 拷模块 | **D runtime shell** |
|---|---|---|---|---|
| 充分利用已部署 Hermes | ❌ 浪费 | ✅ 但冒险 | ❌ 只拷代码不用 runtime | ✅ 用 runtime |
| Infrastructure noise 吸收 | ❌ 2 周内踩一遍 | ✅ | ❌ 拷贝后仍要踩 | ✅ |
| 合规硬红线可控 | ✅ 完全 | ❌ autonomy 撞红线 | ✅ | ✅ 关 autonomy |
| Demo 可预测性 | ✅ 最可控 | ❌ 40 工具/skill 变量大 | ✅ | ✅ 白名单 tool |
| V2 扩展成本 | ❌ 要重写 | ✅ 零成本 | ⚠️ 拷贝件要合并 | ✅ 打开 autonomy 即升级 |
| 2 周可达性 | ✅ | ❌ 学 + 加 Web UI | ⚠️ 拷贝集成税 | ✅ 只加业务插件 |

---

## 三、前端形态：手机 H5（而非桌面响应式网页）

| 维度 | 判断 |
|---|---|
| 用户路径 | 微信搜索域名 → "访问网页" → 微信 WebView **100% 手机竖屏** |
| V1 用户 | Sdu/Kevin 自己用 → 手机 |
| Demo 现场 | 手机实机投屏最真实，评委秒懂"这是微信里的健康 Agent" |
| 工时 | mobile-only 比响应式省 30-50% 工作量 |

### 技术要点

1. **Next.js 14 + Tailwind mobile-first**：`max-w-md mx-auto min-h-dvh`
2. **Viewport meta**：`maximum-scale=1, user-scalable=no` 防 iOS 双击缩放干扰对话框
3. **100dvh 而非 100vh**：iOS Safari WebView 的 100vh bug 会被微信底栏吃掉
4. **必跑测试**：iOS 微信 WebView + Android 微信 WebKit（两端渲染有细微差异，输入框键盘遮挡要处理）
5. **字体 / 点击区域**：最小字号 14px、按钮 ≥44×44px（iOS HIG 标准）

### 三阶段路线

- **MVP（2 周）**：手机 H5（Next.js + 腾讯云硅谷 + 海外域名，零审核）
- **V2（Demo 后 1-2 月）**：微信小程序（时间够过审核，拿微信分享 / 登录生态）
- **V3（V2 稳定后）**：App（接穿戴设备、push、家庭多成员）

---

## 四、评委"照抄"担心的应对

**Hermes MIT + 94.5k stars = 主流技术栈背书，不是抄袭。**

2026 年所有 AI 创业公司都站在开源 agent 框架上（LangChain / CrewAI / AutoGen / Hermes）——评委早已认可这一范式。真正的差异化不在 runtime，而在业务层：

1. Sdu 医学博士审核的 **15 条硬编码禁忌规则**（稀缺 moat）
2. **融合对话 UX 设计**（身心感受驱动的开场问法 + 症状 / 产品 / 体检三入口自然切换）
3. **中国健康合规硬编码架构**（autonomy 禁用 + tool 白名单 + 规则引擎独立）
4. **SUPP.AI 5.9 万交互落地到中文消费者场景**

### Demo 话术（关键）

> "我们复用 Hermes 作为 agent runtime（业内主流开源框架，94.5k stars），但**关闭了它的自主 agent 能力**（subagent / self-improving skill / 40+ 内置工具），只用它的 MCP 传输和记忆层。核心 IP 是我们自建的合规架构：医学博士审核的 15 条硬编码禁忌规则 + tool 白名单 + 规则引擎独立。**runtime 借开源，合规和专业我们造**。"

这样讲**反而加分**——评委会觉得"这队知道什么该借什么该造，很成熟"。

---

## 五、Day 0 验证清单（明天和 Kevin 对齐必问）

**前提**：路径 D 成立的唯一关键依赖 = Hermes 的 autonomous features **能被真正禁用**

必须在 Day 0 回答的 4 个问题：

1. **你的腾讯云 Hermes 实例目前有哪些 tool 在挂载？能否白名单化？**
2. **self-improving skill 机制是 opt-in 还是 opt-out？怎么关？**
3. **跨会话记忆目前已经在工作吗？能否给 VitaMe 的症状追踪直接用？**
4. **现在的对话接口是 IM/CLI 还是 HTTP？Web 前端怎么接（SSE？WebSocket？）？**

如果 autonomy 禁用不彻底 → **fallback 到路径 C（拷 3 个模块到裸起 Next.js）或 A（完全裸起）**。

---

## 六、14 天 Day 计划

| 阶段 | 内容 | 硬截止 |
|---|---|---|
| **Day 0（明天）** | 在已部署 Hermes 实例验证：tool 白名单 + autonomy 禁用；起 Next.js 空项目骨架 + 腾讯云硅谷 hello world + 买域名 | 确认路径 D 可行 |
| **Day 1-2** | 端到端打通 SUPP.AI MCP + 15 条硬编码禁忌中间件 + disclaimer 注入 schema | 禁忌检测 tool 能 return 正确结构 |
| **Day 3 Gate** | 若 autonomy 不能真正禁用 → fallback 到 C 或 A；若 OK → 继续 D | 必须做出路径最终决定 |
| **Day 4-7** | Next.js 手机 H5 + 融合对话 prompt chain + 症状追踪 UX | 端到端走通 Demo 主流程 |
| **Day 8-11** | 30 条禁忌 golden set + 10 条 Demo 脚本回放测 + 免责声明正则断言 | 三层 eval 打通 |
| **Day 12-13** | Kevin 真实症状测 + Sdu 医学复核 + 微信 WebView 实机测 | 体验 + 合规 + 跨端三道 gate |
| **Day 14** | Demo 预演 + fallback 脚本预录 + 评委 Q&A 彩排 | 最终版 |

---

## 七、沉淀的关键文件（Day 1 就建）

1. **`ARCHITECTURE.md`**：每段代码标来源 / 改动点 / 确定性边界声明
2. **`SPEC.md`**：15 条禁忌 + 4 个用户流程 + 不可变红线
3. **`EVAL.md`**：30 条 golden set + 10 条 Demo 回放 + 免责声明正则规则
4. **`DEMO-SCRIPT.md`**：90 秒讲稿 + "照抄"质疑 Q&A 话术

---

## 八、开放问题（明天和 Kevin 对齐时敲定）

1. 15 条硬编码禁忌的具体清单（Sdu 是否已基于 DDInter / SUPP.AI 高频数据整理）
2. DeepSeek prompt 框架（开场问法、追问逻辑、输出模板、合规兜底话术）
3. 剂量推荐的 UI 呈现（强免责条长什么样、如何不被用户跳过）
4. 症状追踪的 UX（推送频率每日 / 每周、曲线样式、不打扰原则）
5. Demo 数据准备（至少 5 个预置真实症状案例 + 20 个常见保健品的禁忌数据）
6. 域名选购（.com / .cn 选哪个，.com 无备案压力优先）
7. 分工（谁做 prompt、谁做前端、谁做 API、谁做 Demo 脚本）

---

## 九、透明度声明

本次会诊启动 11 个 sub-agent（6 开源视角 + 5 Anthropic 视角）。第二轮中 3 个 agent 的 WebFetch 被权限系统拒绝，使用的是模型先验知识而非实时抓取。所有推理链已完整展示，如需严格 blog 原文引用可开放 WebFetch 权限重跑 3 个视角。

**第一轮结论（C 半路复用）已被修正**：prompt anchoring bias 导致 6/6 一致投票不是真共识。**最终方案以第二轮路径 D 为准**。

---

*本文件是 2026-04-17 Sdu 和 Claude 的头脑风暴会诊纪要。明天（2026-04-18）和 Kevin 对齐时以此为底稿。*
