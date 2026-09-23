# TDT4290 Customer Driven Project

Data-driven knowledge management in HR using NLP — a TDT4290 (Customer Driven Project) collaboration with **Trondheim kommune**.

## Background

Mid-level managers at Trondheim kommune often feel insecure about interpreting and applying HR guidelines. This leads to a high volume of repetitive support questions directed to HR via ServiceNow, which hinders efficient local decision-making and turns HR into a reactive support function.

## Goal

Identify which topics and questions raised through ServiceNow have the lowest semantic match with the organization's formal HR routines and guidelines in its quality management system ("Kvaliteket"). Surfacing this mismatch pinpoints concrete "knowledge gaps" in real time, so HR can prioritize updates to the routines that are actually causing confusion — closing the gap between theory (guidelines) and practice (what employees ask about) instead of just answering the same tickets over and over.

## How it works

1. [`backend/ai/pdf_reader.py`](backend/ai/pdf_reader.py) extracts words and font info from Kvaliteket routine PDFs.
2. [`backend/ai/chunker.py`](backend/ai/chunker.py) splits each PDF into sections by bold headings.
3. [`backend/ai/embedding_extract.py`](backend/ai/embedding_extract.py) generates embeddings for both routine chunks and ServiceNow questions using a multilingual sentence-transformer model, and caches them to `embeddings/*.pkl`.
4. [`backend/ai/compute_similarity.py`](backend/ai/compute_similarity.py) computes cosine similarity between every question and every routine chunk, and ranks questions by their summed top-k similarity — the lowest-scoring questions are the least represented in the current routines — and renders the result as an HTML report.

5. [`frontend/`](frontend/) presents the result as a dashboard: the gaps ranked by priority, why each one ranks where it does, and what HR decided to do about it.

## Status

Backend NLP pipeline (PDF parsing → chunking → embeddings → similarity ranking) is functional. The frontend is a working UI prototype running on mock data.

## Documentation

- [AI-FRAMEWORK.md](docs/AI-FRAMEWORK.md) — how the group uses AI agents on this project.
- [AGENTS.md](AGENTS.md) — project context for AI coding agents.
- [CONTRIBUTING.md](CONTRIBUTING.md) — commit message and branch naming conventions.
- [CODE-STYLE.md](CODE-STYLE.md) — code style best practices and conventions.
