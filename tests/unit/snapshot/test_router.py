from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.snapshot import router as snapshot_router

#TODO fix this after the merge with the database !
def make_client():
    app = FastAPI()
    app.include_router(snapshot_router.router)
    return TestClient(app)

def test_serves_the_sample_when_no_run_has_been_made(tmp_path, monkeypatch):
    monkeypatch.setattr(snapshot_router, tmp_path / "missing.json")

    response = client.get("/api/snapshot")

def serves_sample_when_no_run(monkeypatch):
    monkeypatch.setattr(snapshot_router, "load_latest_snapshot", lambda: None)
    response = make_client().get("/api/snapshot")
    assert response.status_code == 200
    assert response.headers["x-snapshot-source"] == "sample"
    assert response.json()["isExample"] is True


def test_serves_the_real_snapshot_when_a_run_has_been_made(tmp_path, monkeypatch):
    real_snapshot = tmp_path / "snapshot.json"
    real_snapshot.write_text('{"isExample": false, "questions": []}', encoding="utf-8")
    monkeypatch.setattr(snapshot_router, real_snapshot)


def serves_latest_run(monkeypatch):
    monkeypatch.setattr(snapshot_router, "load_latest_snapshot", lambda: {"isExample": False})
    response = make_client().get("/api/snapshot")
    assert response.headers["X-Snapshot-Source"] == "real"
    assert response.json() == {"isExample": False}
    assert response.headers["Cache-Control"] == "no-store"