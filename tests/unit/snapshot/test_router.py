"""
Tests the snapshot route with a temporary snapshot file, so no real analysis
has to have run.
"""

from fastapi.testclient import TestClient

from backend.snapshot import router as snapshot_router
from backend.snapshot.dev_app import app


client = TestClient(app)


def test_serves_the_sample_when_no_run_has_been_made(tmp_path, monkeypatch):
    monkeypatch.setattr(snapshot_router, "SNAPSHOT_PATH", tmp_path / "missing.json")

    response = client.get("/api/snapshot")

    assert response.status_code == 200
    assert response.headers["x-snapshot-source"] == "sample"
    assert response.json()["isExample"] is True


def test_serves_the_real_snapshot_when_a_run_has_been_made(tmp_path, monkeypatch):
    real_snapshot = tmp_path / "snapshot.json"
    real_snapshot.write_text('{"isExample": false, "questions": []}', encoding="utf-8")
    monkeypatch.setattr(snapshot_router, "SNAPSHOT_PATH", real_snapshot)

    response = client.get("/api/snapshot")

    assert response.headers["x-snapshot-source"] == "real"
    assert response.json() == {"isExample": False, "questions": []}
