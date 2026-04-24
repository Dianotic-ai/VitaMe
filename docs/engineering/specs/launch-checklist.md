---
title: "Launch Checklist"
description: "VitaMe P0 demo / production 前的 env、域名、Nginx、pm2、WeChat WebView、日志、回滚检查清单。"
doc_type: "checklist"
status: "active"
created: "2026-04-24"
updated: "2026-04-24"
canonical: true
privacy: "internal"
tags: ["engineering", "launch", "deploy", "checklist"]
---

# VitaMe — Launch Checklist

## 1. Build Gate

- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run test:seed`
- [ ] `npm run build`

## 2. Env Gate

- [ ] `LLM_PROVIDER`
- [ ] `LLM_MODEL`
- [ ] `LLM_BASE_URL`
- [ ] `LLM_API_KEY`
- [ ] `NEXT_PUBLIC_APP_ENV`
- [ ] `NEXT_PUBLIC_DEMO_MODE`
- [ ] `AUDIT_LOG_DIR`

## 3. Server Gate

- [ ] Node version matches local build.
- [ ] pm2 process configured.
- [ ] Nginx reverse proxy configured.
- [ ] Let's Encrypt cert active.
- [ ] Cloudflare DNS points to SV server.
- [ ] `vitame.live` opens on mobile.

## 4. Product Gate

- [ ] CoQ10 + Warfarin demo case works.
- [ ] Unknown ingredient returns gray.
- [ ] Green result includes boundary sentence.
- [ ] Disclaimer visible on result page.
- [ ] DemoBanner visible for unreviewed rule.
- [ ] No CPS / shopping recommendation UI.

## 5. WeChat Gate

- [ ] Opens inside WeChat WebView.
- [ ] No viewport overflow on common iPhone widths.
- [ ] Input and CTA are usable one-handed.
- [ ] Result page readable without zoom.

## 6. Rollback

- [ ] Previous build artifact or commit recorded.
- [ ] pm2 rollback command documented.
- [ ] DNS rollback not required for app-level rollback.
