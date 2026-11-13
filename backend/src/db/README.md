[Project README](../../../README.md) › [Backend](../../README.md) › db

# db

The PostgreSQL side of the app: the connection, the tables, and the store for snapshots.

| File | What it does |
|---|---|
| [`connection.py`](connection.py) | `get_conn()`: one connection per use, committed when the block ends and rolled back on error |
| [`create_db.py`](create_db.py) | Creates the tables. It can be run any number of times |
| [`snapshot_store.py`](snapshot_store.py) | `save_snapshot` and `load_latest_snapshot`. The snapshot is encrypted with the keys in `SNAPSHOT_KEYS` |

## Tables

- `snapshot`: one row per analysis run, append-only (triggers refuse update, delete and truncate). The payload is encrypted JSON.
- `routine_review` and `question_decision`: HR's decisions, used by [`review/`](../review/README.md).

## Settings

In `.env` (see [`.env.example`](../../../.env.example)): `DBNAME`, `DBUSER`, `DBPASSWORD`, `DBHOST`, and `SNAPSHOT_KEYS`, a comma separated list of Fernet keys where the first one encrypts. Generate one with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Keep the key safe: without it the stored snapshots cannot be read.

## Running the database

With Docker Compose the database starts together with the app, and the API creates the tables when it starts, see [Running with Docker](../../../README.md#running-with-docker).

To run the API outside Docker you need a database it can reach. The name, user and password you give the database must be the same as `DBNAME`, `DBUSER` and `DBPASSWORD` in `.env`, and `DBHOST` is `localhost`. With the example values from `.env.example` (and your own password), write the first command on one line:

```bash
docker run --name kunnskapsgap-db -e POSTGRES_DB=kunnskapsgap -e POSTGRES_USER=kunnskapsgap -e POSTGRES_PASSWORD=<password> -p 127.0.0.1:5432:5432 -d postgres:16
python -m src.db.create_db
```

`create_db` and the API read the settings from `.env`, so nothing has to be exported in the terminal. If you leave out `POSTGRES_USER`, the database user is `postgres`, and then `DBUSER` has to be `postgres`.

## Tests

The database tests empty their tables, so they refuse to run unless `DBNAME` contains `test`. Use a separate database:

```bash
cd backend && DBNAME=kunnskapsgap_test python -m pytest tests/unit/db
```

## Not in use

`db.py`, `review_service.py` and `update_info.py` are not imported anywhere. They are left over from before the review and snapshot code moved to [`review/`](../review/README.md) and `snapshot_store.py`, and can be removed.
