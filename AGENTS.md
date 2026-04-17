# AGENTS.md

This file provides Codex-specific guidance for this repository.

## Source of Truth

- Default to [`CLAUDE.md`](./CLAUDE.md) for project context, product constraints, safety red lines, and skill routing.
- Keep this file intentionally thin so Codex and Claude do not drift.

## Codex Notes

- This repo is still in the planning stage. Treat `docs/` as the canonical human-maintained workspace.
- Start with [`docs/README.md`](./docs/README.md), then read the current product docs in `docs/product/`.
- Treat `gstack-output/`, `_bmad/`, `_bmad-output/`, and `sessions/` as tool or history directories. Do not restructure them unless explicitly asked.
- Treat `sessions/` and private health materials such as `docs/research/gemini-health-consultation.md` as privacy-sensitive. Do not stage or push them unless the user explicitly asks.

## Working Rule

- If this file and `CLAUDE.md` ever conflict, follow `CLAUDE.md` and update this file to match.
