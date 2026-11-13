# TDT4290 Customer Driven Project

Data-driven knowledge management in HR using NLP — a TDT4290 (Customer Driven Project) collaboration with **Trondheim kommune**.

## Background

Mid-level managers at Trondheim kommune often feel insecure about interpreting and applying HR guidelines. This leads to a high volume of repetitive support questions directed to HR via ServiceNow, which hinders efficient local decision-making and turns HR into a reactive support function.

## Goal

Identify which topics and questions raised through ServiceNow have the lowest semantic match with the organization's formal HR routines and guidelines in its quality management system ("Kvaliteket"). Surfacing this mismatch pinpoints concrete "knowledge gaps" in real time, so HR can prioritize updates to the routines that are actually causing confusion — closing the gap between theory (guidelines) and practice (what employees ask about) instead of just answering the same tickets over and over.

## How it works

1. The words and fonts of the Kvaliteket routine PDFs are read, and each routine is split into chunks along its bold headings ([`ai/chunking`](backend/src/ai/README.md#chunking)).
2. The chunks and the ServiceNow questions are embedded with a multilingual sentence-transformer model, and every question is scored against every routine ([`ai/similarity_metrics`](backend/src/ai/README.md#similarity_metrics)).
3. Each question is placed on the routine it matches best. A question that matches no routine well enough is flagged for HR to place by hand ([`snapshot`](backend/src/snapshot/README.md)).
4. Similar questions are grouped into themes, and a language model titles each group ([`ai/clustering`](backend/src/ai/README.md#clustering)).
5. The result, the snapshot, is stored encrypted in a PostgreSQL database ([`db`](backend/src/db/README.md)), and a FastAPI backend serves it ([`backend/src`](backend/README.md)).
6. The [dashboard](frontend/README.md) presents the routines ranked by priority, why each one ranks where it does, and what HR decided to do about it. HR's decisions are stored in the same database.

## Status

The analysis, the API and the dashboard work together behind Microsoft sign-in. The analysis result and HR's decisions are stored in PostgreSQL, and the whole app runs with Docker Compose.

## Running the project

Four parts work together: an analysis that scores the data, a PostgreSQL database that stores the result, an API that serves it, and the dashboard that shows it. The simplest way to run them all is [Docker](#running-with-docker).

### Before you start: signing in

The dashboard only opens after Microsoft sign-in. There is no way to create an account or give yourself a role, neither in the dashboard nor in this repository. **You get what you need from the group:**

- the tenant ID and client ID for `.env`, and
- a username and a first-time password. Microsoft asks you to choose your own password the first time you sign in.

The account has a role in the app: `Bruker` sees the dashboard, and `Admin` can also upload data and run the analysis. Only the administrator of the Entra tenant can create accounts and change roles, see [entra-app-registration.md](docs/entra-app-registration.md).

Without these, the app starts, but Microsoft refuses the sign-in. This also applies to the sample data, which is only shown after signing in.

This is the group's test setup. When Trondheim kommune takes over the product, the app is registered in the municipality's own Entra ID, and its employees sign in with their usual work accounts.

### Running with Docker

The API, the dashboard and the PostgreSQL database run as containers, with no Python, Node.js or PostgreSQL on your machine. You need Docker Desktop (or Docker with Compose), and it has to be running.

1. Copy the example settings. Run this in the project root:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill it in:

   | Setting                                               | What to write                                                                                                                                                                                |
   | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`                  | From the group, see [Before you start](#before-you-start-signing-in). Whoever administers the app finds them in the Entra admin center under **App registrations**, the app, **Overview** |
   | `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_CLIENT_ID`        | The same two values again. The dashboard reads these ones                                                                                                                                    |
   | `DBNAME`, `DBUSER`                                    | Your choice. `kunnskapsgap` for both works. Docker creates the database with these names the first time it starts                                                                            |
   | `DBPASSWORD`                                          | Make up a password. Avoid `$`, `#`, quotes and spaces                                                                                                                                        |
   | `DBHOST`                                              | Leave as it is. In Docker the API finds the database by itself                                                                                                                               |
   | `SNAPSHOT_KEYS`                                       | A key that encrypts the stored results. Make one in the next step                                                                                                                            |
   | `LITELLM_API_URL`, `LITELLM_API_KEY`, `LITELLM_MODEL` | From whoever runs the LiteLLM proxy. The analysis uses it to title the question groups. Without it the dashboard works, but running an analysis stops with an error |
   | `ALLOWED_ORIGIN`                                      | Leave as it is                                                                                                                                                                               |

3. Make the `SNAPSHOT_KEYS` key and paste the line it prints after `SNAPSHOT_KEYS=` in `.env`.

   macOS and Linux:

   ```bash
   openssl rand -base64 32 | tr '+/' '-_'
   ```

   Windows, or if you have Python with `pip install cryptography`:

   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

4. The app registration needs `http://localhost:8080` as a _single-page application_ redirect URI, under **Authentication**. Without it, Microsoft refuses the sign-in. This is already done for the test setup you get from the group. Otherwise, only an owner of the app registration can add it.

5. Start everything, and open <http://localhost:8080> when the terminal says the API is running:

   ```bash
   docker compose up --build
   ```

The first build takes a while, because it downloads the embedding model into the image. Stop with `Ctrl+C`, or with `docker compose down` if it runs in the background (`docker compose up -d`).

Good to know:

- The database is created from `DBNAME`, `DBUSER` and `DBPASSWORD` the first time only. If you change them later, the old database keeps the old values and the API cannot connect. Delete the database and start over with `docker compose down -v` (this deletes the stored data).
- The API creates its tables when it starts. The database is only reachable from the other containers, not from your machine.
- The analysis results and HR's decisions are stored in the database; uploaded data and the audit log live in Docker volumes. Nothing is stored in the images. `docker compose down` keeps all of it; `docker compose down -v` deletes it.
- Keep `SNAPSHOT_KEYS` safe, and never change it for a database that already has results: without the key, the stored snapshots cannot be read.
- The Entra IDs are built into the dashboard, so run `docker compose build` again if you change them.

### Running without Docker

You need Python 3.10 or newer (CI tests 3.12 to 3.14), Node.js 22.12 or newer, and a PostgreSQL database.

1. Install the Python dependencies in a virtual environment at the project root.

   macOS and Linux:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate      # every new terminal
   pip install -r backend/requirements-dev.txt
   pip install -e backend
   ```

   Windows (PowerShell):

   ```powershell
   py -m venv .venv
   .venv\Scripts\activate         # every new terminal
   pip install -r backend/requirements-dev.txt
   pip install -e backend
   ```

   If PowerShell refuses to run the activate script, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once and try again. `pip install -e backend` installs the backend itself in editable mode, so `backend...` can be imported from anywhere. `requirements-dev.txt` adds what developers need (tests, Ruff, notebooks) to the runtime requirements.

2. Install the dashboard's dependencies:

   ```bash
   cd frontend && npm install
   ```

3. Copy `.env.example` to `.env` and fill it in, as in steps 1 to 4 of [Running with Docker](#running-with-docker). `DBHOST` is `localhost` here, and the database name, user and password are the ones of the database you start in the next step.

4. Start a PostgreSQL database and create its tables. Use the same values as in `.env` for `<DBNAME>`, `<DBUSER>` and `<DBPASSWORD>`, and write the first command on one line:

   ```bash
   docker run --name kunnskapsgap-db -e POSTGRES_DB=<DBNAME> -e POSTGRES_USER=<DBUSER> -e POSTGRES_PASSWORD=<DBPASSWORD> -p 127.0.0.1:5432:5432 -d postgres:16
   python -m src.db.create_db
   ```

   You do not need to `export` anything: the API and `create_db` read the settings from `.env`. Next time, start the same database with `docker start kunnskapsgap-db`. More about the database in [`backend/src/db`](backend/src/db/README.md).

5. Start the API, with the virtual environment active, from the project root:

   ```bash
   python -m uvicorn src.api.main:create_app --factory --env-file .env --port 8000
   ```

6. Start the dashboard in another terminal, and open <http://localhost:5173>:

   ```bash
   cd frontend && npm run dev
   ```

The dashboard asks the API for its data, so the API has to be running.

### The data

The real data is confidential HR data from Trondheim kommune, so **it is not in this repository and has not been uploaded to GitHub**. Whoever runs the application on real data has to get the files from the customer and be allowed to handle them. There are two files to get:

- the ServiceNow export of questions, as an `.xlsx` file, and
- the Kvaliteket routines, as PDFs.

An admin uploads them on the dashboard's "Importer data" page, see [Updating the data](#updating-the-data). You can also put them in place by hand: the export at `data/raw/serviceNow/serviceNow_questions.xlsx` and the PDFs in `data/raw/kvaliteket/`. Never commit them or paste them into a chat, see [`data/`](data/README.md).

#### Running without the real data

- **Sample data.** If nothing has been uploaded, the API serves a bundled sample of invented data, and the dashboard says "Eksempeldata" in the sidebar. The dashboard works on it, so this is enough for developing the frontend. It does not run an analysis, so it cannot test the backend.
- **Your own test files.** To run the whole analysis, make small files with invented content and upload them, signed in with an account that has the `Admin` role:
  - The questions: an `.xlsx` file with the columns `Nummer` (a unique number per question), `Tjenestetilbud` (the service), `Kort beskrivelse` and `Beskrivelse` (the question text). A question needs text in at least one of the two description columns.
  - The routines: PDFs named `<document code>-<title>.pdf`, for example `1760-1-Vernerunde.pdf`. Give them bold headings, because that is how a routine is split into sections. Start small, with a few routines and a few dozen questions, so a run is quick.

The analysis sends the text of a few questions per cluster to the LiteLLM proxy in `.env` to get a title for each group. Use invented text for test files, so it does not matter where the proxy is.

### Updating the data

Users with the admin role can update the data from the dashboard:

1. **Importer data**, a page only they see, uploads a new ServiceNow export, which replaces the previous one, and Kvaliteket routines, which are added to the ones already there. A routine that is already uploaded is skipped, matched on its document code (`1760-1` in `1760-1-Vernerunde.pdf`), so the whole Kvaliteket folder can be chosen again to add only the new routines. Nothing is saved if any file fails its checks, for example a file that is not a PDF.
2. **Kjør analyse**, where only they have the run button, then runs the analysis on the uploaded files in the background and shows its progress. When it finishes, the dashboard loads the new result.

The API refuses uploads and runs from anyone without the admin role, whatever the dashboard shows. The code is in [`backend/src/admin`](backend/src/admin/README.md).

The admin role is given in Entra by whoever administers the app, not in the dashboard, see [entra-app-registration.md](docs/entra-app-registration.md).

### Building the snapshot without the dashboard

```bash
python backend/scripts/build_snapshot.py
```

This analyses all questions against all routines, which takes a few minutes, and stores the result in the database. The API serves the newest snapshot, so run the analysis again, from the script or from "Kjør analyse", only when:

- the ServiceNow export or the PDFs change, or
- the scoring or the review threshold (`MIN_RELEVANCE` in [`backend/src/snapshot/build_snapshot.py`](backend/src/snapshot/build_snapshot.py)) changes, since which questions need review is decided when the snapshot is built, or
- the code that builds the snapshot changes, for example after pulling. An old snapshot can lack fields the dashboard expects.

The questions that need review are grouped by what they are about, so HR can decide on a whole group at once. Without a snapshot the API serves the bundled sample, and the dashboard says "Eksempeldata" in the sidebar.

### Things to know

- A snapshot contains ticket text. It is encrypted in the database with `SNAPSHOT_KEYS`, and the key is never committed. Do not export or share it.
- Uploaded files are saved to `data/raw/`, which is gitignored for the same reason.
- An uploaded routine cannot be replaced or removed from the dashboard yet. Delete the old PDF from `data/raw/kvaliteket/` by hand first.
- The API remembers how far a run has come only while it is running. Restarting it during a run loses the run; start it again.

### Tests

```bash
(cd backend && python -m pytest) # backend, with the virtual environment active
cd frontend && npx vitest run   # frontend, once
cd frontend && npm test         # frontend, in watch mode (press q to quit)
```

The database tests need a database whose name contains `test`, see [`backend/tests/`](backend/tests/README.md).

### Linting and formatting

```bash
(cd backend && ruff check --fix . && ruff format .)   # backend: fix and format
cd frontend && npm run lint:fix       # frontend: fix and format
```

CI fails if either finds something to fix. In VS Code, install the recommended extensions (Ruff, ESLint and Prettier) to have files fixed and formatted on save. See [CONTRIBUTING.md](CONTRIBUTING.md) for everything to run before a pull request.

## Project structure

The main folders have a README that says what is in them and links to the folders they work with.

```
.github/workflows/    CI: lint, format, type check and tests
backend/              the API and the analysis (Python)
  src/                the Python package, imported as "src"
    api/              sign-in, roles, settings, audit log
    admin/            uploading data and running the analysis
    snapshot/         building and serving the analysis result
    review/           HR's decisions
    db/               PostgreSQL connection, tables and the snapshot store
    ai/               PDF reading, chunking, similarity, clustering, LLM, evaluation
  tests/              backend tests
  scripts/            run and evaluate the analysis from the command line
  notebooks/          notebooks for exploring the methods
data/                 the customer's data and what the analysis writes (not in git)
  raw/  processed/
docs/                 the AI framework and the Entra app registration
frontend/             the dashboard (React, TypeScript, Vite)
  src/                app, auth, api, hooks, domain, features, components, styles
docker-compose.yml    the whole app: API, dashboard and database
```

The READMEs: [`backend`](backend/README.md) · [`backend/tests`](backend/tests/README.md) · [`backend/scripts`](backend/scripts/README.md) · [`backend/notebooks`](backend/notebooks/README.md) · [`data`](data/README.md) · [`docs`](docs/README.md) · [`frontend`](frontend/README.md) · [`frontend/src`](frontend/src/README.md).

## Documentation

- [AI-FRAMEWORK.md](docs/AI-FRAMEWORK.md) — how the group uses AI agents on this project.
- [entra-app-registration.md](docs/entra-app-registration.md) — setting up Microsoft sign-in and roles, for the customer.
- [AGENTS.md](AGENTS.md) — project context for AI coding agents.
- [CONTRIBUTING.md](CONTRIBUTING.md) — commits, branches and the checks before a pull request.
- [CODE-STYLE.md](CODE-STYLE.md) — code style best practices and conventions.
