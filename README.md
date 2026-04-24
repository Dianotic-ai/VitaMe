# VitaMe — 补剂安全翻译 Agent

> 一句话：用户在买补剂 / 吃补剂前，告诉 ta **能不能吃、为什么、要避开什么** —— 基于 ta 的病史 / 在用药 / 成分形式。
>
> **不是**：疾病诊断 / 症状追踪 / 电商 / 长期健康伴侣。

**项目节点**
- 目标：WAIC 2026 "超级个体创业黑客松"（2026-04-30 截止）
- Sprint：12 天 P0（2026-04-18 → 2026-04-29）
- 今日：D3（2026-04-20）
- 团队：PM Sunny + 1 工程合伙人

---

## 🚀 新人 5 分钟上手 — 按这个顺序读

| 顺序 | 文件 | 要看什么 |
|---|---|---|
| 1 | **本 README** | 5 分钟总览（你正在看） |
| 2 | [`docs/SESSION-STATE.md`](./docs/SESSION-STATE.md) | **当前进度单一事实源** — 做到哪了、下一步、已知阻塞 |
| 3 | [`CLAUDE.md`](./CLAUDE.md) | 工程规则 / §11 红线 / 3 层架构 / 8 核心对象 |
| 4 | [`DESIGN.md`](./DESIGN.md) | 视觉规范 —— **只有做 UI 的时候需要** |
| 5 | [`docs/engineering/specs/`](./docs/engineering/specs/) | 5 份 design doc（按任务选读，别全读） |
| 6 | [`docs/engineering/plans/2026-04-18-vitame-p0-plan.md`](./docs/engineering/plans/2026-04-18-vitame-p0-plan.md) | 12 天任务表 |

**如果你只有 10 分钟**：读 1 + 2 + `CLAUDE.md §1-3 + §11`。

---

## 🏗 架构（3 层 × 合规 middleware）

```
用户输入
  ↓
L1 — 知识字典（静态，预烘焙）       src/lib/db/*.ts
  ↓
L2 — 判断引擎（确定性规则）          src/lib/capabilities/safetyJudgment/
  ↓ Risk[] JSON
L3 — 翻译层（LLM 讲人话 + 兜底）     src/lib/capabilities/safetyTranslation/
  ↓
合规 6 层 middleware                  src/lib/capabilities/compliance/
  Evidence → Banned → Critical → (DemoBanner ∥ Disclaimer) → Audit
  ↓
用户看到的界面
```

**红线**（详见 [`CLAUDE.md §10-11`](./CLAUDE.md)）：
- L1 不 import adapters，不联网，不跑 LLM
- L2 只出结构化 JSON，不出人话
- L3 只翻译 L2 的结论，不凭空造风险
- LLM 调用只能出现在 `safetyTranslation/` 和 `queryIntake/`

---

## 📁 仓库结构（简版，全版看 [`CLAUDE.md §5`](./CLAUDE.md)）

```
vitame-p0/
├── CLAUDE.md              # 工程规则（看之前先读）
├── DESIGN.md              # 视觉规范
├── README.md              # 本文件
├── scripts/               # 数据烘焙脚本（不进 bundle）
│   ├── bakeLpi.ts         # LPI → src/lib/db/lpi-values.ts ✅
│   ├── bakeCnDri.ts       # 中国营养学会 DRIs ✅
│   ├── bakePubchem.ts     # PubChem（结构 OK，SV 部署后补 CID）
│   ├── bakeSuppai.ts      # SUPP.AI 相互作用 ✅
│   └── raw/               # 原始 JSON（bake 的输入）
├── src/
│   ├── app/               # Next.js App Router（目前只有 landing page）
│   ├── components/        # UI 组件 — RiskBadge / DisclaimerBlock / DemoBanner ✅
│   └── lib/
│       ├── db/            # L1 — 烘焙好的静态数据（全部 import 'server-only'）
│       ├── adapters/      # L2 — 3 路 adapter（hardcoded / suppai / ddinter）
│       ├── capabilities/
│       │   ├── safetyJudgment/      # L2 judgment engine ✅
│       │   ├── safetyTranslation/   # L3 模板兜底 ✅（LLM 未接）
│       │   └── compliance/          # 合规 filter（部分）
│       └── types/         # 8 个核心类型（Risk / SourceRef / Ingredient / ...）
├── tests/
│   ├── fixtures/seeds.json          # 20 条 seed 问题
│   └── unit/                        # 47/47 green
└── docs/                  # 所有设计文档 / session state
```

---

## ✅ 做完了什么（截至 D3 / 2026-04-20 晚）

**Scaffold**
- Next.js 14 App Router + TS strict（`noUncheckedIndexedAccess`）+ Tailwind + Vitest + Playwright
- 8 个核心类型（`Risk`, `SourceRef`, `Ingredient`, `Person`, `Query`, `Product`, `Archive`, `Interaction`）

**L1 数据烘焙**
- `contraindications.ts` — 50 条硬编码禁忌（3 red + 47 yellow，全部 `pharmacistReviewed:false`，需药剂师审）
- `cn-dri-values.ts` — 23 条中国营养学会 DRI 数值
- `lpi-values.ts` — 30 条 LPI 成分摘要（27.7 KB）
- `suppai-interactions.ts` — 1349 条 SUPP.AI 补剂-药物相互作用（735 KB，evidence≥3 过滤）
- `pubchem-cids.ts` — 10 KB 骨架（CID 字段全 null，VPN 阻塞，SV 部署后重跑）

**L2 判断引擎**
- `SafetyAdapter` 契约 + 3 路 adapter（hardcoded ✅ / suppai 空桩 / ddinter 永久空桩）
- `riskLevelMerger` + `judgmentEngine`（并发 3 路 → 合并 → 补 gray → 聚合 partialData）
- **47/47 unit tests green**，typecheck 0 error

**L3 翻译层（兜底部分）**
- `templates.ts` — 28/39 reasonCode 的兜底文案 + 4 个 level default 分支
- 纯函数无依赖，0 banned word，所有字符串在字符限制内
- ⚠️ LLM Adapter **还没接** —— 待接入 openclaw 代码后接通真翻译

**UI 组件**
- `RiskBadge` / `DisclaimerBlock` / `DemoBanner`（3 个原子组件，主仓 build 通过）
- ⚠️ 页面壳（query / intake / result / archive / recheck）**还没写**

**合规**
- `bannedWordsFilter.ts`（§11.2 词汇红线）
- ⚠️ Evidence / Critical / Audit / DemoBanner injector **还没接成 6 层 middleware**

**测试**
- 20 条 seed 问题（`tests/fixtures/seeds.json`）—— red=2 / yellow=10 / gray=3 / green=5
- 47 条 unit test（L2 引擎 + adapter + 禁词过滤 + DRI 数据）
- ⚠️ `npm run test:seed` **还跑不起来**（需要 API 路由落地之后）

---

## ⏳ 还没做的（Wave 2 候选，等拍板）

**短期（D4-D6）**
1. **L3 LLM Adapter** —— 从 openclaw 项目抽 chat + vision 代码，接上已就位的 `templates.ts` 兜底
2. **激活 `suppaiAdapter`** —— 当前 `partialData:true` 空桩，1349 条数据已就位，消费即可
3. **API 4 条路由** —— `api/{query-intake,safety-judgment,safety-translation,archive-recheck}/route.ts`
4. **合规 6 层 middleware 拼完** —— 目前只有 `bannedWordsFilter`

**中期（D6-D9）**
5. **5 个 UI 页面壳** —— `app/{query,intake,result,archive,recheck}/page.tsx`
6. **`bakeNih` + `bakePubchem` 补数据** —— 需要在 SV 服务器上跑（本地 VPN 劫持 NIH/PubChem 域名）
7. **部署到 `https://vitame.live`** —— 自建硅谷云（2C4G）+ Nginx + pm2

**P1 stretch（有空才做）**
8. `bakeDsld` / `bakeTga` / `bakeJp` / `bakeBluehat` —— 国际产品库
9. OCR（补剂瓶拍照识别）
10. Archive + Recheck 动画

全量看 [`docs/SESSION-STATE.md`](./docs/SESSION-STATE.md) 的 "⏳ 未完成" 段。

---

## 🏃 本地跑起来

```bash
# 依赖
npm install

# 环境变量（目前只有 LLM_PROVIDER 用得到；.env.local 别入库）
cp .env.local.example .env.local
# 手动填 MINIMAX_API_KEY（找 Sunny 要）

# 验证
npm run typecheck          # 应 0 error
npm run test:unit          # 应 47/47 green

# 起本地 dev server
npm run dev                # localhost:3000（目前只有 landing page）

# 重跑烘焙（raw 数据改了才需要，脚本幂等）
npm run bake:lpi           # LPI
npm run bake:cndri         # 中国 DRIs
npm run bake:suppai        # SUPP.AI（SUPP.AI 可达即可跑，~100 min）
# npm run bake:nih          ← VPN 劫持 *.nih.gov，本地跑不起，SV 部署后再说
# npm run bake:pubchem      ← 同上
```

---

## 🚨 绝对不能踩的线（[`CLAUDE.md §11`](./CLAUDE.md) 11 条红线摘录）

1. 每个 AI 生成的输出都要挂 `<DisclaimerBlock>`
2. 禁词：**治疗 / 治愈 / 处方 / 药效 / 根治 / cure / diagnosis / prescribe**（regex 强制）
3. 高风险组合（华法林 × 维 K 等）硬编码为红，**不走 LLM 推理**
4. 每条 Risk 和 L1 条目都要有非空 `sourceRefs`
5. LLM 只讲人话，**不造规则**
6. LLM 输出必须过 Zod schema；失败 → 模板兜底，**绝不吐原生 LLM 文本**
7. 合规 middleware 顺序固定：`Evidence → Banned → Critical → (DemoBanner ∥ Disclaimer) → Audit`
8. 只问真正影响判断的病史 / 用药，**不收姓名地址**
9. **不做** CPS / 联盟 / 电商跳转
10. 审计日志不能关（每次判断都写一行 JSONL）
11. 未经药剂师审的规则命中必挂 DemoBanner

**另外**：没有 design doc 支撑的 scope，不写。12 天里 scope creep 是第一杀手。

---

## 🛠 协作规范

- **任务分发**：PM（Sunny）拆 brief，工程合伙人执行 / 或外包给 Gemini CLI + Codex CLI
- **merge 门槛**：`npm run test:unit` green + `npm run typecheck` 0 error + 人肉 review
- **commit 节奏**：不频繁 commit，完成一个逻辑单元再推（当前单 commit 合入了 Wave 1 全部）
- **分支**：`vitame-dev-v0.1`（当前）是 dev 主分支；main 作为项目 pivot 前的历史留档，不动

---

## 📬 问题找谁

- PM / 产品 / 设计：Sunny
- 合规红线 / 文档：所有文档在 `docs/`，CLAUDE.md 是工程权威
- AI 对接：项目里的 Claude Code 会话把全部设计规则吃进 context；新会话冷启动读 `docs/SESSION-STATE.md` + `CLAUDE.md` 即可
