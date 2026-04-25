# CLAUDE.md v3.0 — RAG Chatbot Pivot

> **Version**: v3.0 (草稿) · **Branch**: `v0.3-rag-chatbot` · **Updated**: 2026-04-25
> **Predecessor**: v2.10 (代码状态 = git tag `v0.2` = `0ff1c4a`)
> **Pivot**: 「窄安全检查工具」→「对话式补剂选择 Agent + RAG 引证」
> Change log → `docs/CLAUDE.md-changelog.md`

## 0. How to read

- 新会话首读：本文件 §1 → §3 → §9 → 任务相关 spec
- UI 任务额外读 `DESIGN.md`
- 冲突以本文件为准；不确定时按 §17 停下来问

### 0.1 按需读文档（触发时再读）

| 文档 | 何时读 |
|---|---|
| `docs/SESSION-STATE.md` | 每次新会话开头 |
| `docs/known-blockers.md` | 部署 / fetch / SSL 错时 |
| `docs/glossary.md` | 遇到陌生术语 |
| `docs/engineering/specs/conversational-shell.md` | 改 `/api/chat` |
| `docs/engineering/specs/kb-retriever.md` | 改 RAG 检索 |

---

## 1. Project context

### 1.1 一句话定位

VitaMe 是**补剂选择对话 Agent**。用户用自然语言聊补剂 — 该买什么成分、剂型、剂量、时间、品牌、跟用户身体状况（体检报告/口述症状）、现有用药/疾病冲不冲突。Agent 综合权威知识源 + LLM 训练知识 + 多轮对话给出可执行决策。

### 1.2 当前里程碑

WAIC 黑客松，截止 **2026-04-30**。v0.3 重构 4 天（D1=2026-04-25 → D4=2026-04-29）。
Deliverable：流式对话 + RAG 引证 + 多轮深入 + 5-10 个核心场景人工 review 通过 + 90s demo 视频。

### 1.3 对 CC 的含义

- 每改一行代码都问一句"这服务于'用户聊 5+ 轮拿到选择保健品、保健品是用时间剂量的决策'吗？"
- 对话质量 > 代码优雅度

---

## 2. Product scope

### 2.1 What it does

1. 自然语言多轮对话（5+ 轮直到用户决策）
2. 推荐成分 + 剂型 + 剂量范围 + 服用时间
3. 提供当前推荐的补剂成分的生产厂商的品牌及具体的药物名称，这部分可以去全球的保健品购买平台上去搜。
4. 检查与现有用药/疾病/孕期/哺乳冲突
5. 引证 8 权威源（剂量/相互作用必引；品牌可凭训练知识）
6. archive 跨会话恢复
7. 文字描述症状 / 体检数值 → 综合分析
8. **跨会话健康档案**：自动记忆用户疾病 / 用药 / 过敏 / 特殊人群，下次自然引用不重复追问

### 2.2 Hard limits（仅 8 条合规底线，详 §9）

不能去掉：disclaimer / banned word / critical 硬编码 / sourceRefs / 数据最小化 / audit log / DemoBanner / 健康档案仅本地

### 2.3 P0 不做

实时价格 / 体检 OCR / 主动提醒 cron / 服务端用户账号系统（健康档案走客户端 LocalStorage）

---

## 3. Architecture v3.0

### 3.1 主路径流程

```
用户输入 + 多轮 history
  → /api/chat (Vercel Edge + streamText)
  → KB Retriever (keyword grep L1 8 源, ~100ms)
  → System prompt 注入 (角色 + retrieved facts + 引证规则 + disclaimer)
  → streamText (minimax 国际版) → token 流
  → 后置：audit log + disclaimer 校验 + banned word 后置 regex
  → 前端 useChat 接 token 流，气泡逐字蹦
```

### 3.2 KB Retriever（详见 spec doc）

输入：query + history → 抽 entity（先用 `aliases.ts` 关键词匹配，后续可升级 LLM NER） → grep L1 8 源（每源 ≤10 条）→ 输出 JSON facts 数组（带 `sourceRefs`）→ 注入 prompt。

### 3.3 8 知识源（L1 KB）

| 源 | 文件 | 用途 |
|---|---|---|
| NIH ODS / LPI / DRIs / PubChem | `ingredients.ts` | 剂量 / 机制 / 形式 |
| SUPP.AI | `suppai-interactions.ts` | 补×药相互作用 + pubmed |
| Hardcoded contraindications | `contraindications.ts` | 药师精筛禁忌 |
| DSLD / TGA / 蓝帽子 / 日本机能性 | 各产品库文件 | 区域注册产品 |

### 3.4 SourceRef 类型

```ts
// src/lib/types/sourceRef.ts
export type SourceRef = {
  source: 'nih-ods' | 'lpi' | 'cn-dri' | 'pubchem' | 'chebi' | 'suppai'
        | 'hardcoded-contraindication' | 'dsld' | 'tga' | 'jp-kinosei' | 'cn-bluehat';
  id: string;
  url?: string;
  retrievedAt: string;
};
```

每条 retrieved fact 必带 sourceRefs，prompt 中要求 LLM 引证格式 `[来源: NIH ODS Vitamin D]`。

### 3.5 User Profile Layer

**存储**：客户端 zustand persist → LocalStorage。sessionId = 首访生成 UUID 永久存。
**Schema**：`{conditions, medications, specialGroups, allergies, ageRange, sex, notes, conversationSummaries}`，每条带 `firstMentionedAt` / `lastConfirmedAt`。
**抽取**：每轮对话结束自动跑一次轻 LLM call，从本轮上下文提取新健康信息（疾病/用药/过敏），merge 进 profile。
**注入**：跟当前 query 相关的字段以 XML scaffold 注入 system prompt：

```xml
<user_profile>
  <conditions>糖尿病(2026-04-22)、肾结石(2026-04-25)</conditions>
  <medications>二甲双胍(长期)</medications>
  <allergies>甲壳类</allergies>
  <recent_topics>Q10 × 他汀, 维生素 D 剂量</recent_topics>
</user_profile>
```

LLM 行为规则（写在 system prompt 里）：自然引用"我记得你提过 X..."；不重复追问已记录信息；超 30 天的字段礼貌确认是否仍有效。

---

## 4. Tech stack

- Next.js 16 App Router + TS strict + Tailwind
- Frontend：`@ai-sdk/react` 的 `useChat` + zustand persist 多轮 history
- `/api/chat` = **Vercel Edge runtime + streamText**（流式不受 60s 限制）
- 老路由保持 Node runtime
- LLM：minimax 国际版（`api.minimax.io/anthropic`，Anthropic Messages 协议）
- Audit：Upstash Redis（`UPSTASH_REDIS_REST_URL` + `_TOKEN`）
- Deploy：Vercel main 自动部署，自动 SSL

---

## 5. Repo structure（新增）

```
src/app/api/chat/route.ts              Edge streaming
src/app/chat/page.tsx                  chat UI 入口
src/lib/chat/retriever.ts              KB 检索器
src/lib/chat/systemPrompt.ts           对话型 system prompt
src/lib/chat/conversationStore.ts      zustand history persist
src/lib/profile/profileStore.ts        zustand persist 健康档案
src/lib/profile/memoryExtractor.ts     post-turn LLM 抽取
src/lib/profile/profileInjector.ts     按相关性筛字段注入 prompt
src/components/chat/                   气泡 / 输入框 / loading
src/app/profile/page.tsx               档案查看 + 编辑 + 一键清空
docs/engineering/specs/conversational-shell.md
docs/engineering/specs/kb-retriever.md
docs/engineering/specs/user-profile.md
```

旧目录全部保留，chat 路径不调。

---

## 6. Env / Commands

```
LLM_PROVIDER=minimax-intl
LLM_MODEL=MiniMax-M2.7
LLM_BASE_URL=https://api.minimax.io/anthropic
LLM_API_KEY=                                # Kevin intl token

NEXT_PUBLIC_AGENT_MODE=1
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

```bash
npx next dev --webpack --port 3000   # 避 Turbopack 字体 bug
npm run build && npm run start
npm run test:unit                    # 仅测确定性逻辑
```

---

## 7. Doc index

| 任务 | 读 |
|---|---|
| 新会话启动 | `docs/SESSION-STATE.md` + 本文件 |
| `/api/chat` | `docs/engineering/specs/conversational-shell.md` |
| RAG retriever | `docs/engineering/specs/kb-retriever.md` |
| chat UI | `DESIGN.md` |
| 加新数据源 | `docs/engineering/plans/data-ingest.md` |

不在表里 → 停下来问 §17。

---

## 9. Compliance red lines（8 条，不可破）

1. **Disclaimer 强制**：每条 chat 输出末尾必带，prompt 强制 + 后置校验补齐
2. **Banned vocab**：禁 `治疗 / 治愈 / 处方 / 药效 / 根治 / cure / prescribe / diagnosis`，后置 regex 命中替换 + audit
3. **Critical 硬编码**：`contraindications.ts` 高危组合（华法林×维K / SSRI×圣约翰草 / 鱼油×华法林 等）必须命中后强制注入 retrieved facts，不让 LLM 凭训练知识乱答
4. **sourceRefs 必有**：每条 L1 db 条目 + 每条 retrieved fact 必带源
5. **数据最小化**：不收姓名 / 地址 / 身份证 / 联系方式
6. **Audit log 不能停**：每次 `/api/chat` 写一条 `{event,sessionId,inputHash,outputHash,retrievedSourceIds,ts}`，写失败 = 硬错误
7. **DemoBanner**：response 顶部固定挂"本 Demo 为原型展示，禁忌规则尚未经执业药师临床复核，不构成医疗建议"
8. **健康档案隐私**：user profile 仅存客户端 LocalStorage，**不上传服务器**（P0）；每条 condition/medication 必含 `firstMentionedAt`；档案页必须有"一键清空"按钮；audit log 不记录 profile 内容（仅记 sessionId hash）

> v2.10 §11.5 / §11.6 / §11.9 / §11.13 / §11.14 全部移除。chat 路径下 LLM 可自由综合、推品牌、讨论剂量、自由理解意图。

---

## 10. Layer discipline（仅 2 条）

1. **chat 路径**（`/api/chat`）：自由 + RAG。LLM 可自由综合、推品牌、讨论剂量（必引源）、输出非结构化 markdown。
2. **旧 4 层**（v0.2）：锁定不动，chat 路径不调用。

---

## 11. Test policy

| 区域 | 是否单测 |
|---|---|
| `/api/chat` 自由文本 | ❌ 不强制 |
| KB retriever | ✅ 必须 |
| Compliance 后置校验 | ✅ 必须 |
| L1 db 完整性 | ✅ 必须 |
| chat UI | ❌ 视觉 review |
| 老 4 层 | 不动 |

Seed test：v0.3 期间 5-10 个核心场景人工 review，不强制 100% 自动 pass。

---

## 12. v0.3 4 天 gate

| Gate | Day | Pass | Failed → 降级 |
|---|---|---|---|
| chat 路由 streaming | D1 | curl `/api/chat` 流式 | 改非流式 + 客户端轮询 |
| chat UI 多轮 | D2 | 浏览器 5+ 轮 | 单轮 web form |
| RAG 质量 | D3 | 5 场景人工通过 | 增厚 retriever / 调 prompt |
| 部署 + 真机 | D4 | 微信 WebView + 90s 视频 | 桌面浏览器录 |

---

## 13. Glossary / Blockers / Changelog / 上下文压缩

`docs/glossary.md` / `docs/known-blockers.md` / `docs/CLAUDE.md-changelog.md` / `docs/compression-rules.md`。

---

## 14. 已知坑（仅留 chat path 相关）

| # | 坑 | 防 |
|---|---|---|
| 1 | LLM 输出禁词 | 后置 regex + audit |
| 2 | retriever 命中过多 prompt 爆炸 | 每源 ≤10 条，总 facts < 8K tokens |
| 3 | Critical 高危让 LLM 凭训练答 | retriever 必命中，否则前置兜底"请咨询医生" |
| 4 | `db/*.ts` 漏 `'server-only'` | 文件首行强制 |
| 5 | LLM 漏 disclaimer | 后置 middleware 检测 + 补 |
| 6 | history token 爆炸 | 仅保留最近 5 轮 |
| 7 | Edge runtime 不支持 Node fs | audit 走 Upstash REST |
| 8 | profile 注入过多致 prompt 爆炸 | profileInjector 先按 query 相关性筛，仅注入相关条目 |
| 9 | profile 数据泄露 | 仅存客户端 LocalStorage / 档案页有清空按钮 / audit 不记 profile 内容 |

---

## 15. Pre-output checklist（每 turn 自检）

- [ ] 新文件首行 `// file: <path> — <purpose>`
- [ ] 不破坏老路由 v0.2 行为
- [ ] 新 LLM 调用仅在 `/api/chat`
- [ ] Critical 高危 retriever 必命中
- [ ] disclaimer 注入 + banned word 校验跑
- [ ] audit log 跑
- [ ] 无 `any` / `@ts-ignore`
- [ ] DESIGN.md 视觉规范

---

## 16. When to stop and ask

设计冲突 / 加新 env / 改 §9 八条 / 新建 LLM 调用点 / chat 路径外的代码改动。**问的方式**：陈述情况 + 给 2-3 个具体选项。

---

## 17. Agent App Mode

### 启用
路由 = `/api/chat` 或 env `NEXT_PUBLIC_AGENT_MODE=1`


### 仍保留底线
§9 八条全部仍生效。

### 退出 / 回滚

- `git checkout v0.2` → 立刻回到 v2.10 严格架构
- v0.3 demo 期结束（5/1 后）由人工评估方向：继续做对话 agent 留 v3.0；要做严肃医疗工具回 v2.10

---

