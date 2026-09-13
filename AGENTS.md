# Project context for AI agents

Read [AI-FRAMEWORK.md](AI-FRAMEWORK.md) first — it's the team's policy on how AI agents are used on this project. This file is the operational counterpart: what an agent working in this repo needs to know day to day.

## What this project is

Trondheim kommune (HR department) gets a high volume of repetitive HR/HMS support questions through ServiceNow. This project finds which questions have the lowest semantic match to the organization's formal routines in its quality system ("Kvaliteket"), to surface "knowledge gaps" — routines that are missing or unclear.

Pipeline: `backend/ai/pdf_reader.py` extracts words+fonts from Kvaliteket PDFs → `chunker.py` splits them into sections by bold headings → `embedding_extract.py` embeds both routine chunks and ServiceNow questions (`sentence-transformers/paraphrase-multilingual-mpnet-base-v2`, cached to `embeddings/*.pkl`) → `compute_similarity.py` ranks questions by summed top-k cosine similarity to routines (lowest = least covered) and renders `visualizations/uncovered_questions.html`.

No frontend exists yet (`frontend/` is empty).

## Data handling — non-negotiable

- `*.pdf`, `*.xlsx`, `*.zip`, `*.pkl` are gitignored on purpose (real HR ticket text, routine documents, embeddings derived from them). Never remove them from `.gitignore`, never commit them, never paste their contents into a chat or send them to an external API.
- If you need to reason about data content, use file structure/counts/anonymized samples, not raw free-text fields.
- The embedding model is multilingual (Norwegian included) by design — don't suggest swapping to an English-only model.

## Conventions

- Everything is in English: code (variable/function names, comments, docstrings, commit messages) and team-facing docs alike — the team includes international colleagues. This applies regardless of what language the request comes in.
- Comments explain *why*, not *what* (see [chunker.py](backend/ai/chunker.py) for the existing style) — don't add explanatory docstrings/comments beyond that.
- No speculative abstractions, error handling, or config beyond what's asked — this is a small student project, not a platform.
- Branch naming and commit message format follow [CONTRIBUTING.md](CONTRIBUTING.md).
- License is GPL-3.0 — don't introduce dependencies with incompatible licenses.
