[Project README](../README.md) › Backend

# Backend

A FastAPI application that serves the dashboard, and the analysis that produces what the dashboard shows. The code is in [`src/`](src), a Python package installed with `pip install -e backend`, so code imports it as `src.<package>`, for example `from src.api.main import create_app`.

| Folder | What is in it |
|---|---|
| `src/` | The package, described below |
| [`backend/tests/`](tests/README.md) | The tests, one folder per package |
| [`backend/scripts/`](scripts/README.md) | Run and evaluate the analysis from the command line |
| [`notebooks/`](notebooks/README.md) | Notebooks for exploring the methods |
| `Dockerfile` | The API's image, see [Running with Docker](../README.md#running-with-docker) |
| `requirements.txt`, `requirements-dev.txt` | What the app needs, and what developers need on top (tests, Ruff, notebooks) |
| `pyproject.toml` | The package, and the settings for pytest and Ruff |

## The package

| Package | What it does |
|---|---|
| [`api/`](src/api/README.md) | The app itself: Microsoft sign-in, roles, settings and the audit log |
| [`admin/`](src/admin/README.md) | Admin endpoints: upload new data and run the analysis |
| [`snapshot/`](src/snapshot/README.md) | Builds the analysis result (the snapshot) and serves it |
| [`review/`](src/review/README.md) | Stores HR's decisions: routine owners and what happened to each question |
| [`db/`](src/db/README.md) | The PostgreSQL connection, the tables and the encrypted snapshot store |
| [`ai/`](src/ai/README.md) | The NLP: reading PDFs, chunking, similarity, clustering, the language model and evaluation |

## How the parts fit together

1. An admin uploads data through [`admin/`](src/admin/README.md), which saves it in [`data/raw`](../data/raw/README.md).
2. "Kjør analyse" starts [`snapshot/run_analysis.py`](src/snapshot/run_analysis.py), which uses [`ai/`](src/ai/README.md) to score every question against every routine and then stores the snapshot, encrypted, through [`db/`](src/db/README.md).
3. The dashboard reads the snapshot from [`snapshot/router.py`](src/snapshot/router.py), and sends HR's decisions to [`review/`](src/review/README.md), which stores them in the same database.
4. Every route in [`api/main.py`](src/api/main.py) needs a valid Microsoft token, and the admin routes also need the admin role.

The matching dashboard code is in [`frontend/`](../frontend/README.md).

## Commands

Run these from `backend/` with the virtual environment active. The data and the logs are found relative to the code, so they stay in [`data/`](../data/README.md) and `logs/` in the project root.

| Command | Does |
|---|---|
| `pip install -r requirements-dev.txt && pip install -e .` | Installs everything, once |
| `python -m pytest` | Runs the tests. The database tests need a database whose name contains `test`, see [`backend/tests/`](tests/README.md) |
| `ruff check .` and `ruff format --check .` | Lint and format check, as CI runs them |
| `ruff check --fix . && ruff format .` | Fixes what Ruff can and formats the rest |

The API is started from the project root, see [Running without Docker](../README.md#running-without-docker).
