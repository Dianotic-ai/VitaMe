---
title: "VitaMe P0 Design — Query Intake"
description: "补剂安全翻译 Agent 查询入口与关键风险采集:文字 + 拍照(Minimax 多模态 OCR)双入口,DSLD 字典标准化。"
doc_type: "design"
status: "active"
created: "2026-04-18"
updated: "2026-04-18"
canonical: true
privacy: "internal"
tags: ["engineering", "p0", "superpowers", "query-intake", "ocr", "multimodal"]
---

# VitaMe P0 Design — Query Intake

## Architecture

Query Intake 是 VitaMe 整条链路的入口层,位于 H5 前端和 SafetyJudgment 之间。它承担三件事:

1. **接收两类输入**:文字(手动打字)或图片(拍照瓶子);**图片走 Minimax 多模态 OCR** 转结构化成分。
2. **把输入归一化成标准 Ingredient**:英文成分名(`Magnesium Glycinate`)→ 中文标准名(`甘氨酸镁`),依赖 DSLD Top 500 成分字典做映射。
3. **只问最少必要的 2–4 个问题**,把上下文补齐后交给 SafetyJudgment。

它不做安全判断,也不做解释。输出是一个 `QuerySession` 对象:`{ sessionId, ingredients: Ingredient[], context: { medications, conditions, allergies, special_groups }, person: PersonRef }`。这个对象是 `SafetyJudgment` 的唯一输入契约。

设计约束(来自 PRD 非功能 + User Journey 母型 2 + 4-18 锁定决策):
- 交互必须"像聪明的安全问诊卡,不是无限聊天",所以 Intake 在工程上是一个**有限状态机**——最多 4 个问题,答完即出结果,不走开放对话。
- **OCR 是 P0 主 Demo 场景 A**(拍照瓶子 → 成分结构化),实现走 Minimax 多模态端点,识别失败必须有"手动输入"兜底。
- **DSLD 用作字典**(Top 500 成分英文→中文映射,~50KB),不用作产品库。产品字段由 OCR 输出承载。

## Components

- **QueryInput** (`src/components/QueryInput.tsx`):前端双入口组件——文字输入 Tab + 图片上传 Tab;图片走 base64 转码后 `POST /api/query`。
- **OcrAdapter** (`src/lib/adapters/ocrAdapter.ts`):调 Minimax 多模态 `chat/completions`(vision endpoint),OCR Prompt 模板固定输出 JSON:`{ brand, product_name, ingredients: [{ name_en, amount, unit, form? }], serving_size }`。Zod schema 校验;识别置信度 `confidence < 0.7` 时走"手动输入"兜底(不拦阻用户)。仅此一处用多模态 LLM(由 `llmAdapter.getMultimodalProvider()` 返回 Minimax)。
- **InputNormalizer** (`src/lib/query/inputNormalizer.ts`):清洗输入,识别多条目(支持 `、` `,` `+` `加` 等分隔);**查 `src/lib/db/dsld-ingredients.ts` 做英文→中文标准化**(`Magnesium Glycinate` → `{name: "镁", form: "甘氨酸镁"}`);判断每条目类型(产品名 / 成分名 / 药物名)。输出 `NormalizedToken[]`。对 OCR 输出(已结构化)做二次标准化 + 合并同成分。
- **ProductMatcher** (`src/lib/query/productMatcher.ts`):模糊匹配到标准 `Ingredient`(`src/lib/db/ingredients.ts`)。OCR 已结构化的 ingredients 直接走这里;手动输入带商品名的也走这里。低置信度时返回候选列表,要求前端 disambiguation。
- **IntakeOrchestrator** (`src/lib/query/intakeOrchestrator.ts`):按 `Ingredient` 查预设问题模板,挑出 2–4 个会影响判断的问题。例:输入含"镁" → 必问"胃肠敏感?";含"鱼油" → 必问"正在服用的药物";含"维 D" → 按人群问"是否孕期"。
- **ContextCollector** (`src/lib/query/contextCollector.ts`):把用户答案拼成 `{ medications: string[], conditions: string[], allergies: string[], special_groups: string[] }` 四类标准化字段。
- **QuerySession** (`src/lib/query/querySession.ts`):管理会话状态(内存 Map + 可选 LocalStorage 兜底),TTL 30 分钟,返回 `sessionId` 给 SafetyJudgment 消费。

## Data Flow

**路径 A — 拍照入口(主 Demo 场景)**:

1. 前端 `QueryInput.tsx` 拍照/选图 → base64 → `POST /api/query` `{ imageBase64: string, personRef?: string }`
2. `OcrAdapter.extract(imageBase64)` → Minimax vision → `{ brand, product_name, ingredients, confidence }`
3. Zod schema 校验:失败或 `confidence < 0.7` → 响应 `{ status: "ocr_fallback", hint: "请手动输入成分" }`,前端切文字 Tab 预填
4. 校验通过 → `InputNormalizer.normalize(ingredients)` → `NormalizedToken[]`(英文成分名映射为中文 + form)
5. `ProductMatcher.match(tokens)` 并发匹配 → `{ matches: Ingredient[], lowConfidence: Token[] }`
6. 低置信度 → `needs_disambiguation`;OK → 进入 IntakeOrchestrator
7. `IntakeOrchestrator.pickQuestions(matches)` 返回 2–4 个 `Question[]`
8. 响应 `{ sessionId, matches, questions, source: "ocr" }`

**路径 B — 文字入口(保底场景)**:

1. 前端 `POST /api/query` `{ input: string, personRef?: string }`
2. `InputNormalizer.parse(input)` → `NormalizedToken[]`(多条目拆分 + DSLD 字典映射)
3. `ProductMatcher.match(tokens)` 并发匹配
4. (之后同路径 A 的 6–8 步)

**上下文补齐(两路径共享)**:

9. 前端渲染问题 → 用户答完 → `POST /api/query/context` `{ sessionId, answers }`
10. `ContextCollector.merge(answers)` → 写回 `QuerySession.context`
11. 响应 `{ sessionId, ready: true }`,SafetyJudgment 可直接用 sessionId 拉取

## Error Handling

- **OCR 识别失败 / 低置信度**(`confidence < 0.7`):**不报错阻断**,响应 `{ status: "ocr_fallback", partialResult?: {...}, hint: "请手动输入成分" }`,前端自动切文字 Tab,若有部分识别结果(比如认出了 brand 但 ingredients 空)则预填到输入框。
- **OCR 输出 Zod 校验失败**:同 ocr_fallback 路径(LLM 偶尔返回非法 JSON)。审计日志记录,便于 Prompt 调优。
- **Minimax 多模态 API 超时 / 504**:ocrAdapter 内部 30s timeout,超时即 fallback;不重试(避免雪崩)。
- **DSLD 字典未命中**(英文成分不在 Top 500 词典里):保留原文 + `normalized: false` 标志,ProductMatcher 继续走模糊匹配;不静默失败。
- **ProductMatcher 命中 0 个**:返回 `needs_disambiguation + hint: "可以用成分名或英文名再试一次"`,不直接失败。
- **多条目同时输入**(文字路径):`InputNormalizer` 拆分,`ProductMatcher` 并发匹配;任一条目低置信度都触发 disambiguation;不把所有条目"塞"给 SafetyJudgment 要求它去猜。
- **用户跳过必填问题**:"正在服用的药物"为必填,若跳过则 block;"过敏/特殊群体"允许跳过,默认为空数组,但结果页会标识"上下文不全"。
- **输入长度 > 200 字符**(文字路径):截断并 echo 被处理后的内容给用户确认,避免 LLM prompt 被塞脏。
- **SessionId 过期**:返回 `410 Gone` + 引导前端重新发起查询;不静默吞失败。
- **图片过大 > 5MB**:前端压缩再上传;若仍过大 413,返回 `{ error: "image_too_large", hint: "请拍近一点或切到文字输入" }`。
- **隐私**:`QuerySession` 不含身份识别信息,仅 sessionId 可追溯,不写死 DB;上传的图片 base64 **不落盘**,OCR 完即丢。

## Testing

场景 0(新增 · 主 Demo 场景 A — OCR 拍照):

> 用户对准 Now Foods Magnesium Glycinate 200mg 瓶子拍照

- WHEN 上传瓶子照片 → `POST /api/query` `{ imageBase64: "...", personRef: "self" }`
- THEN `OcrAdapter` 调 Minimax vision 返回 `{ brand: "Now Foods", product_name: "Magnesium Glycinate", ingredients: [{ name_en: "Magnesium Glycinate", amount: 200, unit: "mg" }], confidence: 0.92 }`
- AND Zod schema 校验通过
- AND `InputNormalizer` 查 DSLD 字典 → `{ name: "镁", form: "甘氨酸镁", amount: 200, unit: "mg" }`
- AND `ProductMatcher` 命中标准 Ingredient "镁"
- AND `IntakeOrchestrator` 返回 2 个问题:"胃肠是否敏感"、"补镁目的"
- AND 响应 `source: "ocr"` 供前端在结果页标注"识别自图片"

场景 0B(新增 · OCR 兜底):

> 用户上传一张模糊的中文瓶子照片

- WHEN OCR 返回 `confidence: 0.45`
- THEN 响应 `{ status: "ocr_fallback", partialResult: { brand: "汤臣倍健" }, hint: "请手动输入成分" }`
- AND 前端自动切文字 Tab 并预填 "汤臣倍健"
- AND 用户可以补充成分名后提交

场景 1 — 来自小红书真实评论 Q10(贵州 2025-08-21,博主获 15 赞的原始提问):

> "鱼油、维 D、D3、镁、益生菌、维 B、维 C 都吃,每天什么时间吃?需要间隔多久?"

- WHEN `InputNormalizer.parse` 接收此文本
- THEN 返回 7 个 `NormalizedToken`(鱼油 / 维D / D3 / 镁 / 益生菌 / 维B / 维C)
- AND `ProductMatcher` 匹配到 7 个标准 Ingredient(`D3` 合并为"维D")
- AND `IntakeOrchestrator` **只返回 4 个问题**:当前用药 / 慢性病史 / 过敏 / 特殊群体
- AND **不追问**"睡眠质量如何"、"食欲怎样"、"每天喝几杯咖啡"等不影响判断的问题

场景 2 — 来自小红书真实评论 Q5(湖南 01-04,家人 + 精准医学场景):

> "家里老人有肝炎+脂肪肝,apoe4 基因,可以吃鱼油吗?什么样的鱼油?"

- WHEN 用户输入同时带"肝炎/脂肪肝/apoe4"病史标签 + "鱼油"产品
- THEN `InputNormalizer` 识别"鱼油"为产品 token,其余为 context 预填
- AND `ContextCollector` 预置 `conditions=["肝炎","脂肪肝"]`、`genes=["apoe4"]`
- AND `IntakeOrchestrator` 追问"肝功当前值(正常/异常/不清楚)"和"凝血功能"(这是博主实际手动追问的,VitaMe 自动化)
- AND 自动建议用户在档案中把 `Person.role = "parent"`

场景 3 — Q7(胃溃疡体质选镁形式):

> "胃溃疡体质,听说镁能助眠但容易腹泻,吃什么形式的?"

- WHEN 用户输入"镁"(无具体形式)
- THEN `ProductMatcher` 返回通用 Ingredient `镁`,并附 4 种形式候选(氧化/柠檬酸/甘氨酸/苏糖酸)
- AND `IntakeOrchestrator` 只问 2 个必要问题:"胃肠是否敏感"、"补镁目的(睡眠/便秘/认知)"
- AND 不问"是否在运动"等与判断无关的问题

场景 4 — 低置信度 disambiguation:

- WHEN 用户输入 "ons d3k2"(拼写残缺 + 混合)
- THEN `ProductMatcher` 置信度 < 0.6,返回 `needs_disambiguation`
- AND 候选列表包含 ["维 D3","维 K2","D3+K2 复合"]
- AND 前端引导用户选一个,不强行猜测

场景 5(新增 · OCR + DSLD 字典连携):

- WHEN OCR 识别出 `{ name_en: "Coenzyme Q10", amount: 100, unit: "mg" }`
- THEN `InputNormalizer` 查 DSLD 字典 → `{ name: "辅酶 Q10", standard_name_en: "Coenzyme Q10", amount: 100, unit: "mg" }`
- AND 若 DSLD 字典未命中(Top 500 之外的冷门成分),保留 `normalized: false` 标志
- AND `ProductMatcher` 继续走模糊匹配,不静默丢失
