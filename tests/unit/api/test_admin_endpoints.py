"""
Tests the admin page's import and analysis endpoints through the API, with
uploads written to a temporary folder and a made-up analysis.
"""

import threading
from io import BytesIO

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.admin import uploads
from backend.admin.analysis_run import AnalysisRunner
from backend.api import main


@pytest.fixture(autouse=True)
def temporary_data_folder(tmp_path, monkeypatch):
    monkeypatch.setattr(uploads, "QUESTIONS_PATH", tmp_path / "serviceNow" / "serviceNow_questions.xlsx")
    monkeypatch.setattr(uploads, "ROUTINES_FOLDER", tmp_path / "kvaliteket")


@pytest.fixture
def release_analysis():
    release = threading.Event()
    yield release
    release.set()


@pytest.fixture
def client(settings, resolve_key, release_analysis):
    app = main.create_app(settings)
    app.dependency_overrides[main.get_key_resolver] = lambda: resolve_key
    app.state.analysis_runner = AnalysisRunner(lambda report_progress: release_analysis.wait(timeout=5))
    return TestClient(app)


@pytest.fixture
def admin(make_token):
    return {"Authorization": f"Bearer {make_token(roles=['admin'])}"}


def servicenow_export():
    content = BytesIO()
    pd.DataFrame(
        [{"Nummer": "INC1", "Tjenestetilbud": "Lønn", "Kort beskrivelse": "Spørsmål", "Beskrivelse": "Tekst"}]
    ).to_excel(content, index=False)
    return ("eksport.xlsx", content.getvalue())


def routine(name):
    return ("routines", (name, b"%PDF-1.7 made-up routine"))


def test_normal_user_cannot_import(client, make_token):
    response = client.post(
        "/api/admin/import",
        headers={"Authorization": f"Bearer {make_token()}"},
        files=[routine("1760-1-Vernerunde.pdf")],
    )

    assert response.status_code == 403
    assert not uploads.ROUTINES_FOLDER.exists()


def test_imports_an_export_and_new_routines(client, admin):
    response = client.post(
        "/api/admin/import",
        headers=admin,
        files=[("questions", servicenow_export()), routine("1760-1-Vernerunde.pdf"), routine("1800-2-Ferie.pdf")],
    )

    assert response.status_code == 200
    assert response.json() == {
        "questionsReplaced": True,
        "routinesAdded": ["1760-1-Vernerunde.pdf", "1800-2-Ferie.pdf"],
        "routinesSkipped": [],
    }
    assert uploads.QUESTIONS_PATH.exists()


def test_adds_the_new_routines_and_skips_those_already_uploaded(client, admin):
    client.post("/api/admin/import", headers=admin, files=[routine("1760-1-Vernerunde.pdf")])

    response = client.post(
        "/api/admin/import",
        headers=admin,
        files=[routine("1800-2-Ferie.pdf"), routine("1760-1-Vernerunde.pdf")],
    )

    assert response.status_code == 200
    assert response.json() == {
        "questionsReplaced": False,
        "routinesAdded": ["1800-2-Ferie.pdf"],
        "routinesSkipped": ["1760-1-Vernerunde.pdf"],
    }
    assert sorted(path.name for path in uploads.ROUTINES_FOLDER.iterdir()) == ["1760-1-Vernerunde.pdf", "1800-2-Ferie.pdf"]


def test_saves_nothing_when_one_routine_is_broken(client, admin):
    response = client.post(
        "/api/admin/import",
        headers=admin,
        files=[routine("1800-2-Ferie.pdf"), ("routines", ("1760-1-Vernerunde.pdf", b"not a pdf"))],
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {"reason": "wrongType", "file": "1760-1-Vernerunde.pdf", "expected": "pdf"}
    assert not uploads.ROUTINES_FOLDER.exists()


def test_import_needs_at_least_one_file(client, admin):
    response = client.post("/api/admin/import", headers=admin, data={"unused": "x"})

    assert response.status_code == 400
    assert response.json()["detail"] == {"reason": "noFiles"}


def test_normal_user_cannot_start_an_analysis(client, make_token):
    response = client.post("/api/admin/analysis", headers={"Authorization": f"Bearer {make_token()}"})

    assert response.status_code == 403


def test_starts_one_analysis_at_a_time_and_blocks_imports_meanwhile(client, admin):
    started = client.post("/api/admin/analysis", headers=admin)
    second = client.post("/api/admin/analysis", headers=admin)
    upload = client.post("/api/admin/import", headers=admin, files=[routine("1760-1-Vernerunde.pdf")])

    assert started.status_code == 202
    assert started.json() == {"state": "running", "completedSteps": 0}
    assert second.status_code == 409
    assert upload.status_code == 409
    assert upload.json()["detail"] == {"reason": "analysisRunning"}
