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


class AnalysisRunner:
    """
    Starts runs in a background thread and remembers the latest one's status.
    The status is kept in memory, so a restart of the API forgets it.
    """

    def __init__(self, analyse: Callable[[ProgressReporter], None] = analyse_uploaded_files):
        self._analyse = analyse
        self._lock = threading.Lock()
        self._status = AnalysisStatus()

    @property
    def status(self) -> AnalysisStatus:
        with self._lock:
            return self._status

    def is_running(self) -> bool:
        return self.status.state == "running"

    def start(self) -> bool:
        """
        Start a run in the background. Returns False if one is already running.
        """
        with self._lock:
            if self._status.state == "running":
                return False
            self._status = AnalysisStatus(state="running")
        threading.Thread(target=self._run, daemon=True).start()
        return True

    def _report_progress(self, completed_steps: int) -> None:
        with self._lock:
            self._status = AnalysisStatus(state="running", completed_steps=completed_steps)

    def _run(self) -> None:
        try:
            self._analyse(self._report_progress)
        except Exception:
            # The reason stays in the server log, since it can name the uploaded files
            logger.exception("Analysis run failed")
            final_status = AnalysisStatus(state="failed", completed_steps=self.status.completed_steps)
        else:
            final_status = AnalysisStatus(state="finished", completed_steps=ANALYSIS_STEP_COUNT)
        with self._lock:
            self._status = final_status
