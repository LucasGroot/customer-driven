# TDT4290 Customer Driven Project

Data-driven knowledge management in HR using NLP — a TDT4290 (Customer Driven Project) collaboration with **Trondheim kommune**.

## Background

Mid-level managers at Trondheim kommune often feel insecure about interpreting and applying HR guidelines. This leads to a high volume of repetitive support questions directed to HR via ServiceNow, which hinders efficient local decision-making and turns HR into a reactive support function.

## Goal

Identify which topics and questions raised through ServiceNow have the lowest semantic match with the organization's formal HR routines and guidelines in its quality management system ("Kvaliteket"). Surfacing this mismatch pinpoints concrete "knowledge gaps" in real time, so HR can prioritize updates to the routines that are actually causing confusion — closing the gap between theory (guidelines) and practice (what employees ask about) instead of just answering the same tickets over and over.

## How it works

1. [`backend/src/ai/pdf_reader.py`](backend/src/ai/pdf_reader.py) extracts words and font info from Kvaliteket routine PDFs.
2. [`backend/src/ai/chunker.py`](backend/src/ai/chunker.py) splits each PDF into sections by bold headings.
3. [`backend/src/ai/embedding_extract.py`](backend/src/ai/embedding_extract.py) generates embeddings for both routine chunks and ServiceNow questions using a multilingual sentence-transformer model, and caches them to `embeddings/*.pkl`.
4. [`backend/src/ai/compute_similarity.py`](backend/src/ai/compute_similarity.py) computes cosine similarity between every question and every routine chunk, and ranks questions by their summed top-k similarity — the lowest-scoring questions are the least represented in the current routines — and renders the result as an HTML report.

5. [`frontend/`](frontend/) presents the result as a dashboard: the gaps ranked by priority, why each one ranks where it does, and what HR decided to do about it.

## Status

src NLP pipeline (PDF parsing → chunking → embeddings → similarity ranking) is functional. The frontend is a working UI prototype running on mock data.

## Running the frontend

Requires Node.js 22.12 or newer. From `frontend/`:

```bash
npm install     # once, and again after dependencies change
npm run dev     # start the dashboard
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
|-- backend
|   |-- src
|   |   |-- ai
|   |   |   |-- chunking
|   |   |   |   |-- customized_chunking.py
|   |   |   |   |-- fixed_chunking.py
|   |   |   |   |-- heading_section.py
|   |   |   |-- evaluation
|   |   |   |   |-- ground_truth_evaluation.py
|   |   |   |-- similarity_metrics
|   |   |   |   |-- bm25_similarity.py
|   |   |   |   |-- cosine_similarity.py
|   |   |   |   |-- euclidean_similarity.py
|   |   |   |   |-- shared_logic.py
|   |   |   |   |-- tfidf_similarity.py
|   |   |   |-- pdf_reader.py
|   |   |-- db
|   |   |   |-- create_db.py
|   |   |   |-- get_info.py
|   |   |   |-- mockup.py
|   |   |   |-- update_info.py
|   |   |   |-- upload_doc.py
|   |   |   |-- upload_ia.py
|-- frontend
|-- tests
|   |-- unit
|   |   |-- db
|   |   |   |-- test_db.py
|-- visualization
|   |-- customized_chunking.ipynb
|   |-- fixed_chunking.ipynb
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

## How to install

```bash
sudo apt install libpq-dev python3-dev
pip install -r requirements.txt
pip install -e .
```

Installs project dependencies, then installs the package itself in editable mode so local imports (`src.ai...`) work globally without path hacks.


## Database
### install dependencies
``` bash
sudo apt install postgresql
sudo apt install libpq-dev python3-dev
```
in your venv:
```bash
pip install psycopg2
pip install python-dotenv
```

### create a database
to access the PostgreSQL environment
The postgres user is normally created by default with the installation of the package
```bash
sudo -i -u postgres
```
Normally, you are now in a postgresql user : `postgres@<your usual environement>:~$`

create the database : `createdb mockup`
put a password if it doesn't exists : `alter user postgres with passeword '<a password>'` Remember this password, you will need it later !
finally, you can enter the database : `psql mockup` It is normally empty and you are in a shell `mockup=#`

When you have terminated with your work here, use `\q` to exit the database and `Ctrl+D` to exit your session.

### Create the table and add data to the database
First, create/update your .env file at the root of the project by adding :
### for the database
```
DBNAME="mockup"
DBUSER="postgres"
DBPASSWORD=<your previous password>
DBHOST="localhost"
```

Then start your venv and execute the python file :
```bash
python3 backend/src/db/create_db.py
```

Normally it should not fail. If you go to your database using the previous step, you should be able to see empty tables.

```bash
python3 backend/src/db/mockup.py 
```

Now, the database has some data, you can try to visualise them by executing some requests. Only leader, settings routine and question have data.

Finally
```bash
python -m pytest tests/unit/db/
```
to run the tests. It should not fail.