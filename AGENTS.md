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

## Skill Usage

- Prefer answering through the most relevant existing skill whenever the user's request can be mapped from context, intent, and scenario, even if the user did not name the skill explicitly.
- Do not default to an ad-hoc freeform answer when a clear skill already covers the task.
- When multiple skills could apply, choose the smallest set that best matches the user's actual goal, and use them in a clear sequence.
- When the right skill is unclear, coverage seems partial, or the user is asking for a capability that may exist elsewhere, use `find-skills` first to narrow to a more precise skill before answering.
- Treat `find-skills` as a precision tool for ambiguous routing, capability discovery, and long-tail tasks, not as a replacement for obvious first-party skills that are already available.

## Docs Conventions

- `docs/product/` and `docs/decisions/` use `VitaMe-` as the filename prefix.
- Keep only the minimum structural markers in filenames, such as `v1`, `v2`, `P0`, `PRD`, and `User-Journey`.
- Use Chinese topic words by default; keep English only for stable product or workflow terms such as `PRD`, `User-Journey`, and vendor names like `Anthropic`.
- Keep dates only on time-bound records such as meeting notes, reviews, and consultations, using `YYYY-MM-DD`.
- Do not put dates on current canonical product docs; rely on frontmatter for time metadata.
- Every `docs/*.md` file must include the standard frontmatter fields: `title`, `description`, `doc_type`, `status`, `created`, `updated`, `canonical`, `privacy`, and `tags`.
- Use `status: active` for current source-of-truth docs, `reference` for historical context, and `superseded` for documents that are explicitly outdated and replaced by newer decisions.
- Optional frontmatter fields are `source_doc`, `source_docs`, `external_sources`, `purpose`, and `superseded_by`.
- Update `changelog.md` whenever filenames or frontmatter conventions change.

## Working Rule

- If this file and `CLAUDE.md` ever conflict, follow `CLAUDE.md` and update this file to match.
