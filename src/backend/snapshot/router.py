"""
Serves the snapshot the dashboard shows. Without a real run, written by
scripts/build_snapshot.py or the admin page, it serves the bundled sample of
invented data instead, and says so in the X-Snapshot-Source header.
"""

import json
from pathlib import Path

from fastapi import APIRouter, Response

from backend.db.snapshot_store import load_latest_snapshot

SAMPLE_SNAPSHOT_PATH = Path(__file__).with_name("sample_snapshot.json")

router = APIRouter()


@router.get("/api/snapshot")
def get_snapshot():
    """
    The latest analysis run as JSON, exactly as the frontend reads it.
    """

    snapshot = load_latest_snapshot()
    if snapshot is None:
        source, content = "sample", SAMPLE_SNAPSHOT_PATH.read_text(encoding="utf-8")
    else:
        source, content = "real", json.dumps(snapshot, ensure_ascii=False)

    return Response(
        content=content,
        media_type="application/json",
        headers={"X-Snapshot-Source": source, "Cache-Control": "no-store"},
    )