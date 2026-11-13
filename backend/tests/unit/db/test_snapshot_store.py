import os

import psycopg2.errors
import pytest
from cryptography.fernet import Fernet

from src.db.connection import get_conn
from src.db.create_db import SCHEMA
from src.db.snapshot_store import load_latest_snapshot, save_snapshot


@pytest.fixture(autouse=True)
def fresh_table(monkeypatch):
    assert "test" in (os.getenv("DBNAME") or ""), "Tests must run on a test database"
    monkeypatch.setenv("SNAPSHOT_KEYS", Fernet.generate_key().decode())
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("drop table if exists snapshot")
        cur.execute(SCHEMA)


def test_latest_run_is_returned():
    save_snapshot({"run": 1})
    save_snapshot({"run": 2})
    assert load_latest_snapshot() == {"run": 2}


def test_no_run_gives_none():
    assert load_latest_snapshot() is None


def test_payload_is_not_stored_in_clear():
    save_snapshot({"text": "sykefravær"})
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select payload from snapshot")
        assert b"sykefrav" not in bytes(cur.fetchone()[0])


def test_old_run_cannot_be_updated_or_deleted():
    save_snapshot({"run": 1})
    for statement in ("update snapshot set payload = ''::bytea", "delete from snapshot", "truncate snapshot"):
        with pytest.raises(psycopg2.errors.RaiseException), get_conn() as conn, conn.cursor() as cur:
            cur.execute(statement)
    assert load_latest_snapshot() == {"run": 1}
