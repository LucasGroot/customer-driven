"""
Records who changed the data the analysis uses, and when, so an action can be
traced back to a person afterwards. Each event is one JSON line in
logs/audit.jsonl (gitignored).

Only metadata is written: names, sizes and SHA-256 hashes of files, never their
content. A hash lets anyone check later whether a file in data/raw is still the
one that was uploaded, by hashing it again and comparing.
"""

import hashlib
import json
import threading
from datetime import UTC, datetime
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
AUDIT_LOG_PATH = REPOSITORY_ROOT / "logs" / "audit.jsonl"


def file_fingerprint(name, content):
    """What the log says about a file: enough to recognise it, nothing of what it says."""

    return {"name": name, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()}


class AuditLog:
    """
    Appends events to the log file. Requests and the analysis thread write at
    the same time, so each line is written whole under a lock.
    """

    def __init__(self, path=None):
        self.path = path if path is not None else AUDIT_LOG_PATH
        self._lock = threading.Lock()

    def record(self, event, user, **details):
        """Write one event. user is the signed-in user's e-mail, or None for the server itself."""

        entry = {"time": datetime.now(UTC).isoformat(timespec="seconds"), "event": event, "user": user, **details}
        line = json.dumps(entry, ensure_ascii=False)
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("a", encoding="utf-8") as log_file:
                log_file.write(line + "\n")

    def entries(self):
        """Every event so far, oldest first."""

        if not self.path.exists():
            return []
        return [json.loads(line) for line in self.path.read_text(encoding="utf-8").splitlines()]
