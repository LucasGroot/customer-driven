"""
Tests that the snapshot endpoint serves the snapshot of the latest analysis run
when there is one, and the bundled sample otherwise.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.snapshot import router as snapshot_router


def make_client():
    app = FastAPI()
    app.include_router(snapshot_router.router)
    return TestClient(app)


def test_serves_sample_when_no_run(monkeypatch, tmp_path):
    monkeypatch.setattr(snapshot_router, "SNAPSHOT_PATH", tmp_path / "missing.json")
    response = make_client().get("/api/snapshot")
    assert response.status_code == 200
    assert response.headers["X-Snapshot-Source"] == "sample"


def test_serves_latest_run(monkeypatch, tmp_path):
    snapshot_path = tmp_path / "snapshot.json"
    snapshot_path.write_text('{"isExample": false}', encoding="utf-8")
    monkeypatch.setattr(snapshot_router, "SNAPSHOT_PATH", snapshot_path)
    response = make_client().get("/api/snapshot")
    assert response.headers["X-Snapshot-Source"] == "real"
    assert response.json() == {"isExample": False}
