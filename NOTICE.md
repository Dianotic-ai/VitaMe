# Third-Party Software Notices

VitaMe is a proprietary commercial project (see [`LICENSE`](./LICENSE)). It is **built on top of** standard open-source frameworks and libraries listed below. We use these as published from public NPM registry — **we do not fork, modify, or redistribute** their source.

Each third-party library is governed by its own license. Those licenses apply to their respective code only and do not extend to VitaMe's proprietary code.

---

## Runtime Dependencies (browser + server)

| Library | Version | License | Purpose |
|---|---|---|---|
| [Next.js](https://github.com/vercel/next.js) | ^16.2.4 | MIT | React framework + App Router + Edge runtime |
| [React](https://github.com/facebook/react) | ^18.3.1 | MIT | UI library |
| [react-dom](https://github.com/facebook/react) | ^18.3.1 | MIT | UI rendering |
| [Vercel AI SDK (`ai`)](https://github.com/vercel/ai) | ^6.0.168 | Apache-2.0 | LLM streaming + tool use |
| [@ai-sdk/anthropic](https://github.com/vercel/ai) | ^3.0.71 | Apache-2.0 | Anthropic provider for AI SDK |
| [@ai-sdk/react](https://github.com/vercel/ai) | ^3.0.170 | Apache-2.0 | React hooks for AI SDK (useChat) |
| [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) | ^0.90.0 | MIT | Anthropic SDK (fallback / direct) |
| [@upstash/redis](https://github.com/upstash/upstash-redis) | ^1.37.0 | MIT | Edge-compatible Redis client (audit log) |
| [zustand](https://github.com/pmndrs/zustand) | ^5.0.12 | MIT | Client state management (4 stores) |
| [zod](https://github.com/colinhacks/zod) | ^3.23.8 | MIT | Tool inputSchema validation |
| [react-markdown](https://github.com/remarkjs/react-markdown) | ^9.1.0 | MIT | Chat bubble rendering |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | ^4.0.1 | MIT | GitHub-flavored markdown (tables) |
| [nanoid](https://github.com/ai/nanoid) | ^5.1.9 | MIT | URL-safe ID generation |
| [server-only](https://www.npmjs.com/package/server-only) | ^0.0.1 | MIT | Server-only module guard (Next.js) |

## Build / Dev Dependencies

| Library | Version | License | Purpose |
|---|---|---|---|
| [TypeScript](https://github.com/microsoft/TypeScript) | ^6.0.3 | Apache-2.0 | Static typing |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | ^3.4.14 | MIT | Utility-first CSS |
| [PostCSS](https://github.com/postcss/postcss) | ^8.4.47 | MIT | CSS processing |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | ^10.4.20 | MIT | CSS vendor prefixes |
| [ESLint](https://github.com/eslint/eslint) | ^9.39.4 | MIT | JavaScript linting |
| [eslint-config-next](https://github.com/vercel/next.js) | ^16.2.4 | MIT | Next.js ESLint preset |
| [Vitest](https://github.com/vitest-dev/vitest) | ^4.1.5 | MIT | Unit testing framework |
| [@vitest/coverage-v8](https://github.com/vitest-dev/vitest) | ^4.1.5 | MIT | Coverage reporting |
| [Playwright](https://github.com/microsoft/playwright) | ^1.59.1 | Apache-2.0 | E2E testing |
| [tsx](https://github.com/privatenumber/tsx) | ^4.19.1 | MIT | TypeScript execution |
| [cheerio](https://github.com/cheeriojs/cheerio) | ^1.0.0 | MIT | HTML parsing (data baking scripts) |
| [jsdom](https://github.com/jsdom/jsdom) | ^25.0.1 | MIT | DOM in Node (testing) |
| [dotenv](https://github.com/motdotla/dotenv) | ^17.4.2 | BSD-2-Clause | Env var loading |
| [npm-run-all](https://github.com/mysticatea/npm-run-all) | ^4.1.5 | MIT | Parallel npm scripts |

---

## Knowledge Base References (data sources for safety judgments)

VitaMe's hardcoded contraindication and ingredient knowledge is **manually curated** by our product team based on publicly available scientific data. We do not scrape, copy, or redistribute these sources' raw datasets — we extract specific facts (dosage ranges, interactions, contraindications) and embed them as code rules with attribution. All sources are credited in the in-app DemoBanner and in citation pills next to each fact.

| Source | Used for | Attribution form |
|---|---|---|
| **NIH ODS** (National Institutes of Health, Office of Dietary Supplements) | Vitamin / mineral dosage references | "美国 NIH ODS" pill |
| **Linus Pauling Institute (LPI)** — Oregon State University | Micronutrient mechanisms | "美国 LPI" pill |
| **Chinese Nutrition Society DRIs** (中国居民膳食营养素参考摄入量) | Chinese-population dosage standards | "中国营养学会 DRIs" pill |
| **SUPP.AI** (Allen Institute for AI) | Supplement × drug interactions | "美国 AI2 SUPP.AI" pill |
| **PubChem** (NIH chemical database) | Compound identifiers | "美国 NIH PubChem" pill |
| **ChEBI** (EMBL-EBI) | Chemical entities | "欧洲 EBI ChEBI" pill |
| **DSLD** (NIH Dietary Supplement Label Database) | US supplement labels | "美国 NIH DSLD" pill |
| **TGA** (Australia Therapeutic Goods Administration) | AU regulatory | "澳大利亚 TGA" pill |
| **JP 機能性表示食品** (Japanese Functional Foods) | JP regulatory | "日本机能性表示食品" pill |
| **CN 蓝帽子保健食品** (中国 SAMR 认证) | CN regulatory | "中国蓝帽子保健食品" pill |

The DemoBanner UI component displays a permanent disclaimer:

> 本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS、Linus Pauling Institute、SUPP.AI、中国营养学会 DRIs 等公开权威数据整理，**尚未经执业药师临床复核，不构成医疗建议**。

---

## Original Work by VitaMe Team

The following are **100% original work** by the VitaMe Team and are covered by the proprietary [`LICENSE`](./LICENSE):

- All application source code in `src/`
- Brand visual system: VitaMe Logo, PersonMark, SeedSproutStage four-stage SVG (种子 → 发芽 → 开花 → 结果)
- Pill Box × Seed signature visual contract (DESIGN.md §11.5)
- All product documentation in `docs/`
- All hardcoded contraindication rules in `src/lib/db/contraindications.ts` (manually curated from public sources, original编码)
- All system prompts and few-shot examples
- All UX flows, user journeys, component contracts

---

Last updated: 2026-04-27
