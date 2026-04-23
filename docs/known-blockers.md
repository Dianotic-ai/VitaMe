# Environmental blockers & known quirks — 阻塞实况速查

> 从 `CLAUDE.md` §18 拆出。CC 启动时不必读，**遇到对应症状（fetch 失败 / SUPP.AI 抓空 / SSL 错 / 节点切换无效）先来这里查**，再去开新 issue 或试 fallback。
>
> 与 `CLAUDE.md` §16 风险矩阵互补：§16 是**未发生**的风险 × 触发信号 × fallback；本文是**已发生**的阻塞 × 现象 × 当前解法。

## 1. 本地 VPN/DNS 劫持（D2 夜间发现）

**现象**：Clash Verge 全局 / TUN / 换节点均无效，以下域名解析被劫持到 fake-IP 保留段 `198.18.0.0/15`，fetch 报 `fetch failed` 或 SSL handshake 失败：

- `*.nih.gov` — 影响 `bakeNih.ts`
- `*.ncbi.nlm.nih.gov` / `pubchem.ncbi.nlm.nih.gov` — 影响 `bakePubchem.ts`
- `google.com` / `googleapis.com`

**不受影响 / 已验证可达**：
- `supp.ai` ✓（SSR HTML + JSON API 均正常）
- `lpi.oregonstate.edu` ✓（226KB HTML）
- `dri.cn` ✓（已通过 cn-dri 手录方式规避）

**解法**：
- 推迟 `bakeNih` + `bakePubchem` 到 SV 部署后（D9 阶段）在服务器上重跑（SV 2C4G 不在 GFW 内，无此阻塞）
- `bakePubchem.ts` 产物结构在 VPN 环境下仍能生成（所有 `pubchemCid: null`），SV 重跑时只需 overwrite 产物即可
- `ingredients.ts` 需在本地通过 LPI（可达）+ 手工补齐骨架，避开 NIH 深度段直到 SV 阶段

**不要做**：重复试 VPN 节点；这不是节点问题，是服务商级域名黑名单。

## 2. SUPP.AI CDN 两坑（D2 夜间发现）

**坑 1**：`/a/<slug>/<cui>` 默认 gzip 返回 **33KB SPA 壳**（前端渲染用），不含 SSR 注入的 `/i/<pair>` 链接，解析后 0 条结果。

- **解法**：请求头必须 `Accept-Encoding: identity` + `User-Agent: curl/8.0`，强制 CDN 回源拿完整 SSR HTML（~1MB/页，含 50 条 `/i/` 链接）

**坑 2**：`?p=0` 被 CDN 当成 SPA 路由的默认首页缓存，返 33KB 空壳；真正的分页从 `?p=1` 开始（1-indexed）。无参数的根路径等同于 `?p=1`。

- **解法**：分页循环 `for (p=1; p<=MAX; p++)`，不要从 0 起
- **测试**：`curl -H 'Accept-Encoding: identity' https://supp.ai/a/magnesium/C0024467?p=1 | grep -oE '/i/[a-z0-9-]+/C[0-9]+-C[0-9]+' | wc -l` 应返 ≥ 40

## 3. SUPP.AI CUI 映射坑（D2 夜间发现）

**现象**：纯元素级 CUI（`C0006675` Calcium / `C0302583` Iron / `C0043481` Zinc）在 SUPP.AI agent API 上返 404，无 interaction 图谱，listing 阶段 0 条。

**原因**：SUPP.AI 只为 **supplement 形式**（盐型、离子、膳食形式）建图，不为纯元素建图。

**解法**（已落到 `scripts/raw/suppai-ingredient-map.json`）：
- `calcium` → `C0006681`（Calcium Carbonate，ic=110）
- `iron` → `C0376520`（Iron, Dietary，ic=559）
- `zinc` → `C2346521`（Zinc Cation，ic=163）
- `vitamin-d` → `C0042866`（Vitamin D 顶层，而非 `C0255545` 无交互子类）

未来新增 ingredient 时遵此模式：优先选 `interacts_with_count` 最高的 supplement 形式 CUI，验证方法见 `scripts/raw/suppai-cui-probe.mjs`。

## 4. DSLD 数据 deferred 到 SV 阶段（D4 / W2-C 决策）

**现象**：`dsld.od.nih.gov` 与 `*.nih.gov` 同属 §1 描述的 fake-IP 劫持段，本地 fetch 不通。Wave 2 把 `bakeDsld` 外包给 Gemini 时已知本地不可达，brief 里允许 Plan B（手录 30-50 条）兜底。

**Gemini W2-C 实际产出**（2026-04-21）：
- `output/scripts/bakeDsld.ts`（96 行，沿用 bakeLpi 模式：Zod + sort by id + dedup + size log，工程上可用）
- `output/scripts/raw/dsld-ingredients-raw.json`（5 条占位：vitamin-b12 / magnesium / vitamin-d / zinc / vitamin-c）
- `output/src/lib/db/dsld-ingredients.ts`（bake 产物，2.2 KB）

**为什么不合仓**：
1. 数据量 5 条远低于 brief 下限 30-50 条
2. `dsldIngredientId` 是 Gemini 编的递增数字（1001/2002/3003/4004/5005），不是 DSLD 真实 ID（真实 ID 形如 31041）；构造的 `url` 打开 404
3. 违反 §11.4「sourceRef 必须可溯源」精神 — demo 被问 source 会尴尬

**当前决策**（D4 晚 Sunny 拍板）：W2-C **deferred 到 SV 部署阶段**（D9 阶段），原因：
- DSLD 在 `CLAUDE.md` §15.2 是 🟡 Should ship，**不挡 P0 主链**
- 主链不依赖 DSLD（query-intake 名称归一可暂时直传用户输入，不做 DSLD lookup）
- SV 服务器不在 GFW 内，重跑可拿真实数据

**SV 阶段重做时**：
- Gemini sandbox 5 条占位 raw json 作为 smoke test 模板保留：`D:\CCbuild\_vitame-wave2\w2-c-bake-dsld\output\scripts\raw\dsld-ingredients-raw.json`
- bakeDsld.ts 工程逻辑可直接复用，但**必须加 BOM 防御**：raw json 在 Windows 工具链下经常带 UTF-8 BOM，`JSON.parse` 拒收。在 `readFileSync` 后加 `.replace(/^\uFEFF/, '')` 即可
- 数据采集走 DSLD bulk CSV export（参 `output/known-blockers-suggested-update.md`），别走 per-ingredient API 节流

## 5. Git 未 commit 滚动状态提醒

历史背景（D2 晚）：Batch 1/2/3 所有产物（脚手架 + types + contraindications + cn-dri + pubchem + bakeSuppai 脚本 + L2 能力层）**均在工作区未提交**，压缩/崩溃风险下会损失。

**当前规则**：CC 不得擅自 `git commit`（`CLAUDE.md` §9.6），由 Sunny 决定 commit 节奏。`docs/SESSION-STATE.md` 是唯一跨会话锚点。
