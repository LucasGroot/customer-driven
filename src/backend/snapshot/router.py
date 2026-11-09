"""
Serves the snapshot the dashboard shows. Without a real run, written by
scripts/build_snapshot.py, it serves the bundled sample of invented data
instead, and says so in the X-Snapshot-Source header.
"""

from pathlib import Path

from fastapi import APIRouter, Response


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SNAPSHOT_PATH = REPOSITORY_ROOT / "data" / "processed" / "snapshot.json"
SAMPLE_SNAPSHOT_PATH = Path(__file__).with_name("sample_snapshot.json")

router = APIRouter()


@router.get("/api/snapshot")
def get_snapshot():
    """
    The latest analysis run as JSON, exactly as the frontend reads it.
    """

    source, path = ("real", SNAPSHOT_PATH) if SNAPSHOT_PATH.exists() else ("sample", SAMPLE_SNAPSHOT_PATH)

    return Response(
        content=path.read_text(encoding="utf-8"),
        media_type="application/json",
        headers={"X-Snapshot-Source": source},
    )
