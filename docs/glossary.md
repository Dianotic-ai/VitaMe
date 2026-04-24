---
title: "Glossary"
description: "VitaMe 项目术语表，用于解释 DSLD、SUPP.AI、SourceRef 等术语。"
doc_type: "glossary"
status: "active"
created: "2026-04-21"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["glossary", "terms", "docs"]
---

# Glossary — VitaMe 术语表

> 从 `CLAUDE.md` §17 拆出。CC 启动时不必读，遇到不认识的术语再查。

| Term | Meaning |
|---|---|
| **DSLD** | Dietary Supplement Label Database, NIH / ODS. Used as an ingredient-name dictionary, not a product DB. |
| **SUPP.AI** | Allen AI's supplement × drug interaction dataset (~59K pairs, filtered to ~1500 for us). |
| **DDInter** | Drug × drug interaction database. Chinese academic source. |
| **TGA / ARTG** | Therapeutic Goods Administration (Australia) / Australian Register of Therapeutic Goods. |
| **蓝帽子 (Blue Hat)** | China's official health-food (保健食品) registration mark. |
| **NIH ODS** | Office of Dietary Supplements at the US National Institutes of Health. |
| **LPI** | Linus Pauling Institute at Oregon State. Micronutrient information center. |
| **DRIs** | Dietary Reference Intakes. Chinese version from 中国营养学会. |
| **機能性表示食品** | Japan's "Food with Function Claims" system. |
| **L1 / L2 / L3** | Internal layer naming: knowledge dict / judgment engine / translation layer. See `CLAUDE.md` §3. |
| **SSR** | Server-Side Rendering (Next.js mode we use). |
| **OCR** | Optical Character Recognition. Minimax multimodal for bottle reading. |
| **CPS** | Cost-Per-Sale affiliate commission. **Not** in scope for P0. |
| **WAIC** | World Artificial Intelligence Conference. Hackathon host. |
| **Superpowers** | [obra/superpowers](https://github.com/obra/superpowers) Claude Code plugin. See `CLAUDE.md` §8. |
| **SourceRef** | Mandatory evidence-origin tag on every data entry. See `CLAUDE.md` §12.2. |
| **TemplateFallback** | When LLM output fails Zod validation, we emit a pre-written template string instead. |
| **Tier 3 TDD** | Our selective TDD + seed E2E safety net approach. See `CLAUDE.md` §13. |
