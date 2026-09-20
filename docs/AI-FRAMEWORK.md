# Framework for using AI agents in this project

This document describes how we, as a group, intend to use AI agents (Claude Code, GitHub Copilot, ChatGPT, etc.) while developing this project. The goal is for everyone on the team to work from the same principles, and to be able to show the customer and course supervisor that our AI use is deliberate and responsible — not just "prompt and hope."

The customer (Trondheim kommune) explicitly calls out AI ethics and privacy as part of the project's core challenge (point 17 in the project proposal): we work with real HR data, and must be able to explain how we use AI without exposing personal data. This framework is our answer to that.

The structure follows the model **Model + Context + Tools + Skills + Feedback** — engineering the AI agent's working environment, rather than just prompting loosely.

---

## 1. Model

- For coding assistance (Claude Code etc.) we use Claude models (Sonnet/Opus). We don't need to stick to one model at all times, but **no raw text from ServiceNow or Kvaliteket is ever sent to an external AI model** — see the privacy rules below.

## 2. Context

What the AI agent (and new team members) need to know about the project is kept in [AGENTS.md](AGENTS.md) in the repo, so it's picked up automatically by Claude Code and other tools that support the convention. In short, the context covers:

- Project goal: identify which ServiceNow inquiries (HR/HMS) are least covered by the formal routines in Kvaliteket, based on semantic similarity ("knowledge gaps").
- Customer context from the `Fra kunde` folder (project proposal, org info) — used to understand *why*, not something pasted uncritically into prompts.
- Domain language: Norwegian administrative language, HR/HMS terminology — the agent should not "translate away" the terms the customer actually uses.

## 3. Tools

- **Git/GitHub** for version control and code review (PRs).
- **Terminal + Python environment** for the backend (pdfplumber, sentence-transformers, pandas, numpy).
- **Claude Code / MCP tools** for editing files, searching, and running scripts — the agent should never be given access to push to `main` or delete data without a team member's approval.
- No frontend framework has been chosen yet (`frontend/` is empty) — once one is, this point and CLAUDE.md are updated.

## 4. Skills / instructions

These are the "house rules" the agent (and we ourselves) work by, kept in AGENTS.md:

- Code, including all comments, docstrings, and identifiers, is in English — regardless of what language a request comes in, since the team includes international colleagues.
- Comments explain *why*, not *what* (as already done in e.g. [chunker.py](backend/ai/chunker.py)) — don't let the AI agent pad the code with redundant docstrings.
- Don't add abstractions, error handling, or functionality beyond what the task actually requires.
- Commits are small and explain *why*, not just *what*.
- Any AI-generated code must be read and understood by whoever commits it — you own the code you ship, regardless of whether a human or an agent wrote the first draft.

## 5. Feedback

- **Code review (PR):** at least one other team member reviews AI-assisted code before merge — not because AI is unreliable, but because that's how we ensure someone on the team understands every line either way.
- **Domain validation:** results from the similarity analysis (e.g. [uncovered_questions.html](visualizations/uncovered_questions.html)) are checked against the HR domain expertise of the customer contact (Martine Krako Romstad) before we conclude a "knowledge gap" is actually real — the model can be semantically wrong.
- **Sprint feedback:** the Scrum process (per the project proposal) is our regular feedback loop with the supervisor — AI use and results are discussed there like any other work.
- **Transparency:** we're transparent about AI use — AI-assisted commits are marked with `Co-Authored-By`, and we're prepared to account for our AI use in the project report, in line with NTNU's guidelines on AI in student work.

---

## Non-negotiable privacy rules

This is the core reason we built this framework, and it applies regardless of which AI tool is used:

1. **Raw data from ServiceNow and Kvaliteket (PDF/XLSX) and generated embeddings (`.pkl`) are never committed to Git** — this is already enforced by [.gitignore](.gitignore), but applies equally to anything pasted into an AI chat or read and sent off-machine by an agent.
2. If the tool in use (Claude Code, ChatGPT, etc.) has external API access, real HR free-text must **not** be sent to it unless the municipality has approved the tool as a data processor. Use anonymized or synthetic data when in doubt, as the project proposal itself allows for (point 18).
3. AI output (e.g. generated routine text or summaries) shown to real users should be checked against the "clear language" requirement (språklova) — not just technically correct, but understandable to managers without a legal/HR background.

If you have questions about anything here, or think something should change — raise it with the team before deviating, so we keep the framework updated together.
