"""
Runs the analysis in the background when an administrator asks for it, and
keeps track of how far it has come so the dashboard can show progress. Only
one run at a time: a second one would replace the snapshot the first writes.
"""

import logging
import threading
from dataclasses import dataclass
from typing import Callable, Literal

from backend.admin import uploads
from backend.api.audit_log import AuditLog, file_fingerprint
from backend.snapshot.router import SNAPSHOT_PATH

logger = logging.getLogger(__name__)

# The same five steps the run page lists (RUN_STEPS in frontend/src/hooks/useAnalysisRun.ts)
ANALYSIS_STEP_COUNT = 5

RunState = Literal["idle", "running", "finished", "failed"]
ProgressReporter = Callable[[int], None]


@dataclass(frozen=True)
class AnalysisStatus:
    state: RunState = "idle"
    completed_steps: int = 0


def analyse_uploaded_files(report_progress):
    """
    Runs the analysis on the uploaded files and replaces the served snapshot.
    """
    # Imported here so the API starts without loading the embedding model's libraries
    from backend.snapshot.run_analysis import run_analysis

    run_analysis(uploads.QUESTIONS_PATH, uploads.ROUTINES_FOLDER, SNAPSHOT_PATH, report_progress)


def input_fingerprints():
    """
    The files a run reads, as the audit log records them, so a result can be
    traced back to exactly the files it was built from.
    """
    questions = None
    if uploads.QUESTIONS_PATH.exists():
        questions = file_fingerprint(uploads.QUESTIONS_PATH.name, uploads.QUESTIONS_PATH.read_bytes())
    routines = []
    if uploads.ROUTINES_FOLDER.exists():
        # Only lowercase .pdf, the same files the PDF reader picks up
        routines = [
            file_fingerprint(path.name, path.read_bytes())
            for path in sorted(uploads.ROUTINES_FOLDER.iterdir())
            if path.suffix == ".pdf"
        ]
    return {"questions": questions, "routines": routines}


class AnalysisRunner:
    """
    Starts runs in a background thread and remembers the latest one's status.
    The status is kept in memory, so a restart of the API forgets it.
    """

    def __init__(
        self,
        analyse: Callable[[ProgressReporter], None] = analyse_uploaded_files,
        audit_log: AuditLog | None = None,
    ):
        self._analyse = analyse
        self._audit_log = audit_log
        self._lock = threading.Lock()
        self._status = AnalysisStatus()

    @property
    def status(self) -> AnalysisStatus:
        with self._lock:
            return self._status

    def is_running(self) -> bool:
        return self.status.state == "running"

    def start(self, started_by: str | None = None) -> bool:
        """
        Start a run in the background for the user with the e-mail started_by.
        Returns False if one is already running.
        """
        with self._lock:
            if self._status.state == "running":
                return False
            self._status = AnalysisStatus(state="running")
        threading.Thread(target=self._run, args=(started_by,), daemon=True).start()
        return True

    def _record(self, event: str, user: str | None, **details) -> None:
        if self._audit_log is not None:
            self._audit_log.record(event, user, **details)

    def _report_progress(self, completed_steps: int) -> None:
        with self._lock:
            self._status = AnalysisStatus(state="running", completed_steps=completed_steps)

    def _run(self, started_by: str | None) -> None:
        try:
            # Hashed here rather than in the request, so starting a run answers at once
            if self._audit_log is not None:
                self._record("analysis.started", started_by, inputs=input_fingerprints())
            self._analyse(self._report_progress)
        except Exception:
            # The reason stays in the server log, since it can name the uploaded files
            logger.exception("Analysis run failed")
            final_status = AnalysisStatus(state="failed", completed_steps=self.status.completed_steps)
        else:
            final_status = AnalysisStatus(state="finished", completed_steps=ANALYSIS_STEP_COUNT)
        self._record(f"analysis.{final_status.state}", started_by, completedSteps=final_status.completed_steps)
        with self._lock:
            self._status = final_status
