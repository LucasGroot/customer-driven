# TDT4290 Customer Driven Project

Data-driven knowledge management in HR using NLP — a TDT4290 (Customer Driven Project) collaboration with **Trondheim kommune**.

## Background

Mid-level managers at Trondheim kommune often feel insecure about interpreting and applying HR guidelines. This leads to a high volume of repetitive support questions directed to HR via ServiceNow, which hinders efficient local decision-making and turns HR into a reactive support function.

## Goal

Identify which topics and questions raised through ServiceNow have the lowest semantic match with the organization's formal HR routines and guidelines in its quality management system ("Kvaliteket"). Surfacing this mismatch pinpoints concrete "knowledge gaps" in real time, so HR can prioritize updates to the routines that are actually causing confusion — closing the gap between theory (guidelines) and practice (what employees ask about) instead of just answering the same tickets over and over.

## How it works

1. [`src/backend/ai/pdf_reader.py`](src/backend/ai/pdf_reader.py) extracts words and font info from Kvaliteket routine PDFs.
2. [`src/backend/ai/chunker.py`](src/backend/ai/chunker.py) splits each PDF into sections by bold headings.
3. [`src/backend/ai/embedding_extract.py`](src/backend/ai/embedding_extract.py) generates embeddings for both routine chunks and ServiceNow questions using a multilingual sentence-transformer model, and caches them to `embeddings/*.pkl`.
4. [`src/backend/ai/compute_similarity.py`](src/backend/ai/compute_similarity.py) computes cosine similarity between every question and every routine chunk, and ranks questions by their summed top-k similarity — the lowest-scoring questions are the least represented in the current routines — and renders the result as an HTML report.

5. [`frontend/`](frontend/) presents the result as a dashboard: the gaps ranked by priority, why each one ranks where it does, and what HR decided to do about it.

## Status

Backend NLP pipeline (PDF parsing → chunking → embeddings → similarity ranking) is functional, and the dashboard fetches its data from a local API. HR's decisions (discarding or mapping a question, routine status and owner) are kept in the browser only until the database exists.

## Running the project

Three parts work together: a script that analyses the data, a small API that serves the result, and the dashboard that shows it.

### First time

1. Install the Python dependencies in a virtual environment at the project root:

   ```bash
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   .venv/bin/pip install -e .
   ```

2. Install the frontend dependencies (Node.js 22.12 or newer):

   ```bash
   cd frontend && npm install
   ```

3. Copy `.env.example` to `.env` and fill in the IDs from the Microsoft Entra app registration (see [Entra app registration](#entra-app-registration-for-customer-only) below).

4. The real data is confidential and not in git. An admin uploads it on the dashboard's "Importer data" page (see [Updating the data](#updating-the-data)), which saves it to `data/raw/`. You can also put the ServiceNow export at `data/raw/serviceNow/serviceNow_questions.xlsx` and the Kvaliteket PDFs in `data/raw/kvaliteket/` by hand. Without them the dashboard still runs, on a sample of invented data.

### Every time

From the project root, in two terminals. First the API:

```bash
.venv/bin/python -m uvicorn backend.api.main:create_app --factory --env-file .env --port 8000
```

If your virtual environment is called `venv`, use `venv/bin/python` instead.

Then the dashboard, and open <http://localhost:5173>:

```bash
cd frontend && npm run dev
```

The dashboard asks the API for its data, so the API has to be running.

### Updating the data

Users with the admin role can update the data from the dashboard:

1. **Importer data**, a page only they see, uploads a new ServiceNow export, which replaces the previous one, and Kvaliteket routines, which are added to the ones already there. A routine that is already uploaded is skipped, matched on its document code (`1760-1` in `1760-1-Vernerunde.pdf`), so the whole Kvaliteket folder can be chosen again to add only the new routines. Nothing is saved if any file fails its checks, for example a file that is not a PDF.
2. **Kjør analyse**, where only they have the run button, then runs the analysis on the uploaded files in the background and shows its progress. When it finishes, the dashboard loads the new result.

The API refuses uploads and runs from anyone without the admin role, whatever the dashboard shows.

### Building the snapshot

The analysis can also be run without the dashboard:

```bash
.venv/bin/python scripts/build_snapshot.py
```

This is not needed every time. It analyses all questions against all routines, which takes a few minutes, and writes the result to `data/processed/snapshot.json`. The API serves that file until it is replaced, so run the analysis again, from the script or from "Kjør analyse", only when:

- the ServiceNow export or the PDFs change, or
- the scoring or the review threshold (`MIN_RELEVANCE` in `src/backend/snapshot/build_snapshot.py`) changes, since which questions need review is decided when the snapshot is built, or
- the code that builds the snapshot changes, for example after pulling. An old file can lack fields the dashboard expects.

The questions that need review are grouped by what they are about, so HR can decide on a whole group at once.

The API reads the file on every request, so there is no need to restart it. Reload the page.

Without a snapshot the API serves the bundled sample, and the dashboard says "Eksempeldata" in the sidebar. This lets anyone run the project without the confidential data.

### Things to know

- `data/processed/snapshot.json` contains ticket text. It is gitignored. Do not commit or share it.
- Uploaded files are saved to `data/raw/`, which is gitignored for the same reason.
- An uploaded routine cannot be replaced or removed from the dashboard yet. Delete the old PDF from `data/raw/kvaliteket/` by hand first.
- The API remembers how far a run has come only while it is running. Restarting it during a run loses the run; start it again.
- Decisions made on the review page are lost when the page is reloaded.

### Tests

```bash
.venv/bin/python -m pytest   # backend
cd frontend && npx vitest run   # frontend, once
cd frontend && npm test         # frontend, in watch mode (press q to quit)
Backend NLP pipeline (PDF parsing → chunking → embeddings → similarity ranking) is functional. The frontend is a working UI prototype running on mock data, behind Microsoft sign-in.

## How to install

macOS and Linux:

```bash
python3 -m venv venv          # first time only
source venv/bin/activate      # every new terminal
pip install -r requirements.txt
pip install -e .
```

Windows (PowerShell):

```powershell
py -m venv venv               # first time only
venv\Scripts\activate         # every new terminal
pip install -r requirements.txt
pip install -e .
```

If PowerShell refuses to run the activate script, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once and try again.

Creates a virtual environment so the project's packages stay separate from the rest of your machine, installs project dependencies, then installs the package itself in editable mode so local imports (`backend.ai...`) work globally without path hacks.

## Running the application

### Running the API/backend

The API in [`src/backend/api/`](src/backend/api/) handles Microsoft sign-in and user roles. It needs a Microsoft Entra app registration.

macOS and Linux:

```bash
cp .env.example .env    # first time only
uvicorn backend.api.main:create_app --factory --env-file .env --reload
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env    # first time only
uvicorn backend.api.main:create_app --factory --env-file .env --reload
```

Fill in the tenant and client IDs in `.env`. 

Run the tests with `python -m pytest tests/unit/api`.

### Running the frontend

Requires Node.js 22.12 or newer. From `frontend/`

```bash
npm install     # once, and again after dependencies change
npm run dev     # start the dashboard
```

The dashboard asks you to sign in with Microsoft and then asks the API who you are, so the API must be running too. The dev server forwards `/api` to it on port 8000. Both read the root `.env`.

### Testing the frontend

```bash
npm test        # run the tests in watch mode (press q to quit)
npx vitest run  # run the tests once, e.g. before committing
```

## Documentation

- [AI-FRAMEWORK.md](docs/AI-FRAMEWORK.md) — how the group uses AI agents on this project.
- [AGENTS.md](AGENTS.md) — project context for AI coding agents.
- [CONTRIBUTING.md](CONTRIBUTING.md) — commit message and branch naming conventions.
- [CODE-STYLE.md](CODE-STYLE.md) — code style best practices and conventions.

### Project organization

```
|--.github
|   |-- workflow
|   |   |-- ci.yml
|-- assets
|-- docs
|-- src
|   |-- backend
|   |   |-- api
|   |   |-- chunking
|   |   |   |-- customized_chunking.py
|   |   |   |-- fixed_chunking.py
|   |   |   |-- heading_section.py
|   |   |-- pdf_reader.py
|   |-- frontend
|-- tests
|   |-- visualization
|   |   |-- customized_chunking.ipynb
|   |   |-- fixed_chunking.ipynb
|-- .gitignore
|-- .gitmessage
|-- AGENTS.md
|-- CODING-STYLE.md
|-- CONTRIBUTING.md
|-- LICENSE
|-- README.MD
|-- requirements.txt
|-- pyproject.toml
```


## Entra app registration (for customer only)

The dashboard and the API use the same app registration. For sign-in from the dashboard to work, it needs:

1. **Authentication** → add the platform *Single-page application* with the redirect URI `http://localhost:5173`.
2. **Expose an API** → set the Application ID URI to `api://<client id>` and add a scope named `access_as_user`.
3. **Manifest** → set `requestedAccessTokenVersion` to `2`. The API only accepts v2 tokens, whose audience is the client ID.
4. **App roles** → create two roles for *Users/Groups*: `Admin` with the value `admin`, and `Bruker` with the value `user`.

Who gets which role is managed under **Enterprise applications** → the app:

- **Users and groups** → assign each user a role. A user with both roles counts as admin.
- **Properties** → set **Assignment required?** to **Yes**, so users without a role cannot sign in at all.

A user's role reaches the API inside the token, so a role change takes effect the next time they sign in.