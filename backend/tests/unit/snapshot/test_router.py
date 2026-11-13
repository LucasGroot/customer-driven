"""
Tests that the snapshot endpoint serves the newest stored snapshot when there is
one, and the bundled sample otherwise.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.snapshot import router as snapshot_router


def make_client():
    app = FastAPI()
    app.include_router(snapshot_router.router)
    return TestClient(app)


def test_serves_sample_when_no_run(monkeypatch):
    monkeypatch.setattr(snapshot_router, "load_latest_snapshot", lambda: None)
    response = make_client().get("/api/snapshot")
    assert response.status_code == 200
    assert response.headers["X-Snapshot-Source"] == "sample"


def test_serves_latest_run(monkeypatch):
    monkeypatch.setattr(snapshot_router, "load_latest_snapshot", lambda: {"isExample": False})
    response = make_client().get("/api/snapshot")
    assert response.headers["X-Snapshot-Source"] == "real"
    assert response.json() == {"isExample": False}
    assert response.headers["Cache-Control"] == "no-store"
