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

## Docs Conventions

- `docs/product/` and `docs/decisions/` use `VitaMe-` as the filename prefix.
- Keep only the minimum structural markers in filenames, such as `v1`, `v2`, `P0`, `PRD`, and `User-Journey`.
- Use Chinese topic words by default; keep English only for stable product or workflow terms such as `PRD`, `User-Journey`, and vendor names like `Anthropic`.
- Keep dates only on time-bound records such as meeting notes, reviews, and consultations, using `YYYY-MM-DD`.
- Do not put dates on current canonical product docs; rely on frontmatter for time metadata.
- Every `docs/*.md` file must include the standard frontmatter fields: `title`, `description`, `doc_type`, `status`, `created`, `updated`, `canonical`, `privacy`, and `tags`.
- Optional frontmatter fields are `source_doc`, `source_docs`, `external_sources`, and `purpose`.
- Update `changelog.md` whenever filenames or frontmatter conventions change.

## Working Rule

- If this file and `CLAUDE.md` ever conflict, follow `CLAUDE.md` and update this file to match.
