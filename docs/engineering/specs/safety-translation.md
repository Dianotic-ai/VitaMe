---
title: "VitaMe P0 Design — Safety Translation"
description: "补剂安全翻译 Agent 的 LLM 解释层 + 风险规避建议生成层 + LLM Adapter(Minimax/DeepSeek/openclaw 三 provider + 多模态)设计。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-18"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "safety-translation", "llm-adapter", "multimodal"]
---

# VitaMe P0 Design — Safety Translation

## Architecture

Safety Translation 是产品差异化的核心。它不改变 SafetyJudgment 的 Risk level,只负责两件事:**把 `reason_code` 翻译成普通人能懂的原因**(FR-4),**把风险转成具体可执行的规避建议**(FR-6)。

链路位置:SafetyJudgment 输出 `Risk[]` → Safety Translation 对每条 Risk 调一次 LLM → 输出 `TranslatedRisk[]`(原 Risk + `translation` + `avoidance` 两字段)。

**LLM Adapter 架构(4-18 锁定)**:采用 provider 解耦模式(灵感来自 openclaw-gateway),`LlmProvider` + `MultimodalProvider` 两个接口;三个 chat provider 实现(Minimax 默认 / DeepSeek fallback / openclaw-gateway 本机复用)通过 `process.env.LLM_PROVIDER` 运行时切换,代码不动改 env 即切。vision(多模态 OCR,见 `docs/engineering/specs/query-intake.md`)固定走 Minimax,P0 不提供 vision 切换。

**强约束**:LLM **不得**新增 Risk、不得改 level、不得产出诊断/处方用语。Prompt 采用 JSON schema,响应失败或违规就走 `TemplateFallback` 兜底。这保证合规边界稳固——用户真实看到的每句话要么来自硬编码模板,要么来自受约束的 LLM 输出 + GuardrailFilter 过滤。

设计母型(来自用户 Journey):用户 5 秒看 level、30 秒看原因、2 分钟决定怎么办。翻译必须服务这三个时间节点,不能写成教科书。

## Components

### LLM Adapter 层(新增 · 4-18 锁定)

- **LlmProvider interface** (`src/lib/translation/llmProvider.ts`):
  ```ts
  interface LlmProvider {
    name: string;  // "minimax" | "deepseek" | "openclaw"
    chat(messages: ChatMessage[], options?: LlmOptions): Promise<string>;
  }
  interface MultimodalProvider {
    name: string;  // "minimax"(P0 仅 Minimax)
    vision(imageBase64: string, prompt: string, options?: LlmOptions): Promise<string>;
  }
  type LlmOptions = { timeout?: number; response_format?: "json_object"|"text"; temperature?: number };
  type ChatMessage = { role: "system"|"user"|"assistant"; content: string };
  ```
- **MinimaxProvider** (`src/lib/translation/providers/minimaxProvider.ts`):**默认 provider**。实现 `chat` + `vision` 两个能力。调 Minimax OpenAI-compat 端点(或 `@minimax/sdk`);vision 调多模态端点(`MINIMAX_VISION_ENDPOINT` env)。现有 token plan 直接用,无需出海。
- **DeepseekProvider** (`src/lib/translation/providers/deepseekProvider.ts`):备选 chat provider,OpenAI-compat,换 baseURL + apiKey。不实现 vision(P0 vision 只走 Minimax)。
- **OpenclawGatewayProvider** (`src/lib/translation/providers/openclawGatewayProvider.ts`):走硅谷云本机 openclaw-gateway(已跑 770MB RSS),复用即零额外成本,不用出海。仅 chat。
- **llmAdapter factory** (`src/lib/translation/llmAdapter.ts`):
  - `getLlmProvider(): LlmProvider` 按 `process.env.LLM_PROVIDER ∈ {"minimax","deepseek","openclaw"}` 返回对应实例;unknown 值抛明确错误。
  - `getMultimodalProvider(): MultimodalProvider` 固定返回 MinimaxProvider(P0 无切换)。
  - 设计意图:Minimax quota 不足或网络抖动时可热切 openclaw-gateway(仅 chat 路径),vision 路径必须 Minimax 可用。

### 翻译层

- **PromptBuilder** (`src/lib/translation/promptBuilder.ts`):把 `Risk` 对象和 `FormComparator` 数据拼成 prompt。包含:(1) 角色约束("你是补剂安全翻译助手,不是医生"),(2) JSON schema 定义,(3) 禁止输出列表,(4) 原因翻译模板 + 规避建议模板。产出 `ChatMessage[]` 喂给 llmAdapter。
- **TranslationOrchestrator** (`src/lib/translation/translationOrchestrator.ts`):对 `Risk[]` 并发调 `getLlmProvider().chat`,收集结果做 Zod schema 校验;失败走 TemplateFallback。
- **TemplateFallback** (`src/lib/translation/templateFallback.ts`):按 `reason_code` 映射到预置文案。每个 reason_code(~30 个)有对应 `{ translation, avoidance }` 模板。LLM 失败时直接用。
- **FormComparator** (`src/lib/translation/formComparator.ts`):成分形式对比数据源(镁 4 形式 / 鱼油 EPA·DHA / 维 D D2 vs D3 / 铁 2 价 vs 3 价等)。为 PromptBuilder 注入上下文,也被 TemplateFallback 共用。
- **GuardrailFilter** (`src/lib/translation/guardrailFilter.ts`):扫输出文本,命中禁词(治疗 / 治愈 / 处方 / 诊断 / 药效 / 特效 / 根治)触发替换("辅助" / "参考" / "营养补充")或 reject。命中 reject 时回退到 TemplateFallback。

## Data Flow

1. 入参:`Risk[]`(from SafetyJudgment)+ `querySession`(for 场景上下文)
2. `const llm = getLlmProvider()`(按 env 选 provider,启动时已决定)
3. 对每条 Risk 并发:
   - `PromptBuilder.build(risk, formData)` → `ChatMessage[]`
   - `llm.chat(messages, { response_format: "json_object", timeout: 8000 })` → raw JSON string
   - JSON 解析 + Zod schema 校验
   - `GuardrailFilter.scan(parsed)` → clean JSON
4. 若任一步失败:
   - `TemplateFallback.render(risk)` → 兜底 `{ translation, avoidance }`
5. 合并返回:`TranslatedRisk[]`,每条附 `{ translation, avoidance, source: "llm"|"fallback", provider: llm.name }`

## Error Handling

- **LLM 超时 (>8s)**:当前 provider 重试 1 次;仍超时走 Fallback,记 warn log。**不自动切换 provider**(切换由运维侧改 env 重启,避免运行时抖动)。
- **JSON 解析失败**:重试 1 次;2 次失败走 Fallback。
- **Schema 校验失败**:直接走 Fallback(不重试,避免 LLM 反复输出格式错乱的内容)。
- **GuardrailFilter 命中禁词**:先尝试自动替换;若核心主张已违规(如"可以治疗结石") → reject 走 Fallback。
- **Ingredient 不在 FormComparator 里**:prompt 不附形式对照表,让 LLM 只做通用翻译,降低幻觉风险。
- **LLM 试图新增 Risk 或改 level**:Zod schema 拒绝(schema 不允许这两个字段),自动走 Fallback。
- **N/A 决策辅助(如 Q16 选镁形式)**:不是风险翻译,走专门的 `form_selection` 模板,不是 LLM。
- **`LLM_PROVIDER` env 配置错误/缺失**:启动时抛错,不允许默认降级(避免生产静默漏网)。启动 healthcheck 对选中 provider 打一次 `ping`(system message + "hi"),失败则 halt deploy。
- **openclaw-gateway 本机不可达**(选中 openclaw 但 gateway 未启):启动 healthcheck 失败,运维层面修;不自动 fallback 到 Minimax(避免产生"配的是 openclaw 实际走 Minimax"的运维幻觉)。

## Testing

场景 1 — Q7 真实场景(镁形式翻译 + 规避):

> "胃溃疡体质,听说镁能助眠但容易腹泻,吃什么形式的?"

- WHEN `translate(risk: { level: "yellow", ingredient: {name:"镁", form:"氧化镁"}, reason_code: "poor_absorption_osmotic_diarrhea" })`
- AND `process.env.LLM_PROVIDER = "minimax"`(默认)
- THEN `getLlmProvider()` 返回 MinimaxProvider
- AND `translation` 包含"氧化镁吸收率低 + 渗透性腹泻"的普通话解释
- AND `avoidance` 明确 "优先甘氨酸镁或苏糖酸镁,睡前 200 mg"
- AND 不包含"治疗""处方""药效"
- AND `source = "llm"`, `provider = "minimax"`

场景 2 — Q16 形式决策辅助(非风险,真实高频决策场景):

> "甘氨酸镁、苏糖酸镁、氧化镁、柠檬酸镁,到底选哪个?"

- WHEN Intake 返回 `intent: "form_selection"`,SafetyJudgment 返回 4 条 gray
- THEN Safety Translation 走 `form_selection` 专用模板(非 LLM)
- AND 输出 4 形式对比表 + 按目的推荐(睡眠 → 甘氨酸镁 / 便秘 → 柠檬酸镁 / 认知 → 苏糖酸镁)
- AND 不做风险判断
- AND `source = "template"`, `provider = "n/a"`

场景 3 — Q13 真实评论(上海 2025-09-07,咖啡 + 补剂):

> "早餐必喝咖啡,会影响随餐吃的补剂吸收吗?"

- WHEN `translate(risk: { level: "yellow", context: "coffee_with_minerals", reason_code: "tannin_iron_ca_absorption" })`
- THEN `translation` 区分"脂溶性(维 D / 鱼油)不受明显影响" vs "水溶性 / 矿物质受影响"
- AND `avoidance = "含铁/钙/B 族的补剂与咖啡间隔至少 1 小时"`

场景 4 — LLM 试图输出"治疗"禁词,降级兜底:

- WHEN LLM 返回 `translation: "维 D 可以治疗骨质疏松"`
- THEN GuardrailFilter 命中 "治疗" → 优先替换为 "辅助"
- AND 若替换后语义不通(如整句核心是"治疗"),走 TemplateFallback
- AND `source = "fallback"`,audit log 记录

场景 5 — LLM 超时降级(不切换 provider):

- WHEN `MinimaxProvider.chat` 两次超时(8s × 2)
- THEN TemplateFallback 根据 `reason_code` 输出预设文案
- AND `source = "fallback"`, `provider = "minimax"`(记录的是启动时选中的 provider,不自动切)
- AND 用户体验不中断(首次结果返回仍在 30s 内,符合 PRD §10 性能要求)

场景 6(新增)— provider 切换可用性(env 驱动):

- WHEN 运维改 `LLM_PROVIDER=openclaw`, 重启
- THEN 启动 healthcheck:`openclawGatewayProvider.chat([{role:"user",content:"ping"}])` 必须成功
- AND 任一风险翻译请求走 openclaw-gateway(硅谷云本机 770MB RSS 进程)
- AND `source = "llm"`, `provider = "openclaw"`
- AND Minimax token 用量为 0(本次请求)
- AND vision 路径(OCR)**仍走 Minimax**——`getMultimodalProvider()` 不受 LLM_PROVIDER 影响

场景 7(新增)— LLM_PROVIDER 配错启动失败:

- WHEN `LLM_PROVIDER=claude`(未定义值)
- THEN `getLlmProvider()` 启动时抛 `UnknownProviderError("claude not in [minimax,deepseek,openclaw]")`
- AND Next.js 不进就绪态
- AND 运维看 log 即明白原因(不允许静默 fallback 到 minimax)
