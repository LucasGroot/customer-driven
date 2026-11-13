# Project context for AI agents

Read [AI-FRAMEWORK.md](docs/AI-FRAMEWORK.md) first — it's the team's policy on how AI agents are used on this project. This file is the operational counterpart: what an agent working in this repo needs to know day to day.

## What this project is

Trondheim kommune (HR department) gets a high volume of repetitive HR/HMS support questions through ServiceNow. This project finds which questions have the lowest semantic match to the organization's formal routines in its quality system ("Kvaliteket"), to surface "knowledge gaps" — routines that are missing or unclear.

Pipeline: `backend/src/ai/pdf_reader.py` extracts words+fonts from Kvaliteket PDFs → `ai/chunking` splits them into chunks along bold headings → `ai/similarity_metrics` embeds chunks and ServiceNow questions (`NbAiLab/borealis-embed-212m`) and scores every question against every routine (a routine's score is the mean of its top-k chunk cosine similarities) → `snapshot/build_snapshot.py` places each question on its best routine and flags weak matches (`MIN_RELEVANCE`) for manual review → `ai/clustering` groups similar questions and titles the groups through an LLM → the snapshot is stored encrypted in PostgreSQL (`db/snapshot_store.py`; there is no `snapshot.json` any more) and served by the FastAPI backend, which also stores HR's decisions (`review/`).

`frontend/` is a React + TypeScript + Vite dashboard (Norwegian UI, English code) showing the ranked gaps. The whole app (API, dashboard, database) runs with `docker compose up --build`.

The main folders have a README that says what they hold and links to their neighbours; start at the [project README](README.md#project-structure). When you change what a folder does, update its README.

Two frontend decisions that are easy to undo by accident:
- Fonts are self-hosted in `frontend/public/fonts` — don't swap them for a Google Fonts link. Beyond the tighter CSP, as it avoids sending visitor IPs to Google, which a municipality should not do.
- `frontend/vite.config.ts` carries the security headers, including the production CSP that must be sent as a real response header (`frame-ancestors` is ignored in the `<meta>` tag in `index.html`).

## Data handling — non-negotiable

- `*.pdf`, `*.xlsx`, `*.zip`, `*.pkl` are gitignored on purpose (real HR ticket text, routine documents, embeddings derived from them). Never remove them from `.gitignore`, never commit them, never paste their contents into a chat or send them to an external API.
- If you need to reason about data content, use file structure/counts/anonymized samples, not raw free-text fields.
- The embedding model is multilingual (Norwegian included) by design — don't suggest swapping to an English-only model.

## Testing

- New functionality comes with tests. This is not optional, and not up to whoever happens to prompt the agent: backend tests go in `backend/tests/unit/<area>`, frontend tests next to the code as `*.test.ts(x)`. Calculations that decide what users see (priority, coverage levels, thresholds) always get tests.
- Before you call a task done, run what CI runs: in `backend/` `python -m pytest`, `ruff check .` and `ruff format --check .`, and in `frontend/` `npx tsc -b`, `npm run lint`, `npm run format:check` and `npx vitest run`. See [CONTRIBUTING.md](CONTRIBUTING.md).
- Use `tsc -b`, not `tsc --noEmit`: the root `tsconfig.json` only has project references, so `--noEmit` checks nothing.
- The database tests empty their tables and refuse to run unless `DBNAME` contains `test`. Never point them at a real database.

## Conventions

- Everything is in English: code (variable/function names, comments, docstrings, commit messages) and team-facing docs alike — the team includes international colleagues. This applies regardless of what language the request comes in.
- Naming must be intuitive enough that the code reads without needing a comment to explain it — e.g. `chunk_by_headings`, `is_bold`, `split_into_word_chunks`. No abbreviations, no vague names when a specific one is available. If a name needs a comment to be understood, rename it instead of commenting it.
- Comments explain *why*, not *what*. Only write one for something genuinely non-obvious from the code itself — a hidden constraint, a workaround for a specific bug, a subtle invariant. Never write a comment that just restates what the next line already says, and never add a comment to compensate for an unclear name or unclear structure — fix the name/structure instead.
- No speculative abstractions, error handling, or config beyond what's asked — this is a small student project, not a platform.
- Branch naming and commit message format follow [CONTRIBUTING.md](CONTRIBUTING.md).
- License is GPL-3.0 — don't introduce dependencies with incompatible licenses.
