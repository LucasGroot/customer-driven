"""
Stores the analysis snapshots, encrypted, in the append-only snapshot table.
"""

import json
import os

from cryptography.fernet import Fernet, MultiFernet

from src.db.connection import get_conn


def _fernet():
    # SNAPSHOT_KEYS: keys separated by commas, the first one is used to encrypt data
    return MultiFernet([Fernet(k) for k in os.environ["SNAPSHOT_KEYS"].split(",")])


def save_snapshot(data: dict) -> int:
    """Adds a run. There is no way here to change or remove an earlier one."""
    payload = _fernet().encrypt(json.dumps(data, ensure_ascii=False).encode("utf-8"))
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("insert into snapshot (payload) values (%s) returning id", (payload,))
        return cur.fetchone()[0]


def load_latest_snapshot() -> dict | None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select payload from snapshot order by id desc limit 1")
        row = cur.fetchone()
    return None if row is None else json.loads(_fernet().decrypt(bytes(row[0])))
