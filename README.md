# VitaMe

VitaMe 是一个以补剂安全判断为入口的自我进化健康 Agent：用户在买补剂或准备服用补剂前，输入产品、成分、病史和在用药，系统告诉用户这款补剂是否需要警惕、为什么、以及下一步怎么更稳妥。

当前 P0 目标不是泛健康顾问、导购或百科，而是打穿一条链路：**输入 → 最少追问 → 红黄灰绿风险 → 人话解释 → 保存/复查**。长期方向是 **Verify → Reminder → Feedback → Memory → Hermit Agent**。

## Start Here

新人、PM、工程师和 Agent 都从这里开始：

1. [`docs/START-HERE.md`](./docs/START-HERE.md) — 10 分钟理解项目当前状态。
2. [`docs/product/当前判断.md`](./docs/product/当前判断.md) — 最新产品洞察和取舍。
3. [`docs/DOCS-COVERAGE.md`](./docs/DOCS-COVERAGE.md) — 文档完整性和缺口矩阵。
4. [`docs/product/P0-执行总纲.md`](./docs/product/P0-执行总纲.md) — P0 唯一执行基线。
5. [`docs/product/Agent-北极星.md`](./docs/product/Agent-北极星.md) — 长期 Agent 北极星。
6. [`docs/engineering/specs/api-contract.md`](./docs/engineering/specs/api-contract.md) — implemented vs planned API。
7. [`docs/engineering/specs/implementation-map.md`](./docs/engineering/specs/implementation-map.md) — 文档目标和代码实现对照。
8. [`docs/SESSION-STATE.md`](./docs/SESSION-STATE.md) — 当前工程进度 ledger。

## Project Shape

- `src/lib/capabilities/queryIntake/` — L0 意图识别和追问。
- `src/lib/db/` — L1 静态知识字典。
- `src/lib/capabilities/safetyJudgment/` — L2 规则判定。
- `src/lib/capabilities/safetyTranslation/` — L3 人话翻译和模板兜底。
- `src/app/api/` — Next.js API routes。
- `src/app/` 和 `src/components/` — P0 UI。
- `docs/` — 当前文档事实源。
- `docs/_archive/` — 旧文档、重复文档和工具输出，不进入日常阅读路径。

## Commands

```bash
npm run dev
npm run typecheck
npm run test:unit
npm run test:seed
npm run build
```

## Current Branch Policy

P0 文档和实施代码在同一个集成分支维护：`dev-merged-2026-04-24`。

原因：代码注释、测试、CLAUDE.md 和 engineering specs 互相引用；文档和代码分支分离会制造漂移。
