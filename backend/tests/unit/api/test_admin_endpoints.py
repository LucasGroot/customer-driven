"""
Tests the admin page's import and analysis endpoints through the API, with
uploads written to a temporary folder and a made-up analysis.
"""

import hashlib
import threading
import time
from io import BytesIO

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from src.admin import uploads
from src.admin.analysis_run import AnalysisRunner
from src.api import main


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
    app.state.analysis_runner = AnalysisRunner(
        lambda report_progress: release_analysis.wait(timeout=5), audit_log=app.state.audit_log
    )
    return TestClient(app)


def audit_entries(client):
    return client.app.state.audit_log.entries()


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
    assert sorted(path.name for path in uploads.ROUTINES_FOLDER.iterdir()) == [
        "1760-1-Vernerunde.pdf",
        "1800-2-Ferie.pdf",
    ]


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


def test_rejects_more_routines_than_one_upload_may_hold(client, admin, monkeypatch):
    monkeypatch.setattr(uploads, "MAX_ROUTINES_PER_UPLOAD", 2)

    response = client.post(
        "/api/admin/import",
        headers=admin,
        files=[routine("1760-1-Vernerunde.pdf"), routine("1800-2-Ferie.pdf"), routine("1900-1-Lønn.pdf")],
    )

    assert response.status_code == 413
    assert response.json()["detail"] == {"reason": "tooManyFiles", "maxFiles": 2}
    assert not uploads.ROUTINES_FOLDER.exists()


def test_turns_away_a_large_upload_before_checking_who_sent_it(client, monkeypatch):
    monkeypatch.setattr(uploads, "MAX_UPLOAD_BYTES", 100)

    response = client.post("/api/admin/import", files=[routine("1760-1-Vernerunde.pdf"), routine("1800-2-Ferie.pdf")])

    # 413 and not 401: the request was refused before its body or its token was read
    assert response.status_code == 413
    assert response.json()["detail"] == {"reason": "uploadTooLarge", "maxMegabytes": uploads.MAX_UPLOAD_MEGABYTES}


def test_dashboard_can_read_why_a_large_upload_was_turned_away(client, admin, settings, monkeypatch):
    monkeypatch.setattr(uploads, "MAX_UPLOAD_BYTES", 100)

    response = client.post(
        "/api/admin/import",
        headers={**admin, "Origin": settings.allowed_origin},
        files=[routine("1760-1-Vernerunde.pdf"), routine("1800-2-Ferie.pdf")],
    )

    assert response.status_code == 413
    assert response.headers["access-control-allow-origin"] == settings.allowed_origin


def test_turns_away_an_upload_that_does_not_state_its_size(client, admin):
    def chunks():
        yield b"--boundary\r\n"

    response = client.post(
        "/api/admin/import",
        headers={**admin, "Content-Type": "multipart/form-data; boundary=boundary"},
        content=chunks(),
    )

    assert response.status_code == 411
    assert response.json()["detail"] == {"reason": "lengthRequired"}


def test_leaves_other_methods_on_the_import_path_to_the_router(client, admin):
    response = client.get("/api/admin/import", headers=admin)

    assert response.status_code == 405


def test_records_who_uploaded_which_files(client, admin):
    export = servicenow_export()

    client.post("/api/admin/import", headers=admin, files=[("questions", export), routine("1760-1-Vernerunde.PDF")])

    [entry] = audit_entries(client)
    assert entry["event"] == "upload.saved"
    assert entry["user"] == "kari@test.no"
    assert entry["questionsReplaced"]["sha256"] == hashlib.sha256(export[1]).hexdigest()
    assert [routine["name"] for routine in entry["routinesAdded"]] == ["1760-1-Vernerunde.pdf"]


def test_the_logged_hash_shows_whether_a_saved_file_has_changed(client, admin):
    client.post("/api/admin/import", headers=admin, files=[routine("1760-1-Vernerunde.pdf")])
    [logged] = audit_entries(client)[0]["routinesAdded"]
    saved = uploads.ROUTINES_FOLDER / "1760-1-Vernerunde.pdf"

    assert hashlib.sha256(saved.read_bytes()).hexdigest() == logged["sha256"]
    saved.write_bytes(b"%PDF-1.7 changed afterwards")
    assert hashlib.sha256(saved.read_bytes()).hexdigest() != logged["sha256"]


def test_never_writes_file_content_to_the_log(client, admin):
    files = [("questions", servicenow_export()), routine("1760-1-Vernerunde.pdf")]
    client.post("/api/admin/import", headers=admin, files=files)

    log_text = client.app.state.audit_log.path.read_text(encoding="utf-8")
    assert "made-up routine" not in log_text
    assert "Spørsmål" not in log_text


def test_records_a_refused_upload_and_why(client, admin):
    client.post("/api/admin/import", headers=admin, files=[("routines", ("1760-1-Vernerunde.pdf", b"not a pdf"))])

    [entry] = audit_entries(client)
    assert entry["event"] == "upload.rejected"
    assert entry["user"] == "kari@test.no"
    assert entry["files"] == ["1760-1-Vernerunde.pdf"]
    assert entry["refusal"]["reason"] == "wrongType"


def test_records_a_normal_user_trying_an_admin_action(client, make_token):
    client.post("/api/admin/analysis", headers={"Authorization": f"Bearer {make_token()}"})

    [entry] = audit_entries(client)
    assert entry["event"] == "access.denied"
    assert entry["user"] == "kari@test.no"
    assert (entry["method"], entry["path"]) == ("POST", "/api/admin/analysis")


def test_records_who_ran_an_analysis_and_on_which_files(client, admin, release_analysis):
    client.post("/api/admin/import", headers=admin, files=[routine("1760-1-Vernerunde.pdf")])

    client.post("/api/admin/analysis", headers=admin)
    release_analysis.set()
    deadline = time.monotonic() + 5
    while client.app.state.analysis_runner.is_running() and time.monotonic() < deadline:
        time.sleep(0.01)

    saved, started, finished = audit_entries(client)
    assert (started["event"], started["user"]) == ("analysis.started", "kari@test.no")
    assert started["inputs"]["routines"] == saved["routinesAdded"]
    assert (finished["event"], finished["user"]) == ("analysis.finished", "kari@test.no")
