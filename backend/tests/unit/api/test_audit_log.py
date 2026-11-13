"""
Tests the audit log on its own: one whole JSON line per event, kept in order.
"""

import threading

from src.api.audit_log import AuditLog, file_fingerprint


def test_appends_one_line_per_event(tmp_path):
    log = AuditLog(tmp_path / "audit.jsonl")

    log.record("upload.saved", "kari@test.no", routinesSkipped=["1760-1-Vernerunde.pdf"])
    log.record("analysis.started", None)

    first, second = log.entries()
    assert first["event"] == "upload.saved"
    assert first["user"] == "kari@test.no"
    assert first["routinesSkipped"] == ["1760-1-Vernerunde.pdf"]
    assert first["time"].endswith("+00:00")
    assert second["user"] is None


def test_keeps_every_line_whole_when_written_at_once(tmp_path):
    log = AuditLog(tmp_path / "audit.jsonl")
    users = [f"bruker{index}@test.no" for index in range(50)]
    writers = [threading.Thread(target=log.record, args=("upload.saved", user)) for user in users]

    for writer in writers:
        writer.start()
    for writer in writers:
        writer.join()

    assert sorted(entry["user"] for entry in log.entries()) == sorted(users)


def test_a_fingerprint_names_the_file_but_holds_none_of_it():
    fingerprint = file_fingerprint("1760-1-Vernerunde.pdf", b"%PDF-1.7 secret text")

    assert fingerprint == {
        "name": "1760-1-Vernerunde.pdf",
        "bytes": 20,
        "sha256": "513f0973b0b00a04e9082eeb80fdd02da101578f95a319d539313728641e5794",
    }
