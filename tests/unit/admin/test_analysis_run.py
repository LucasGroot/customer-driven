"""
Tests the background runner with a made-up analysis, so no model is loaded.
"""

import threading
import time

from backend.admin.analysis_run import ANALYSIS_STEP_COUNT, AnalysisRunner, AnalysisStatus


def wait_until_done(runner):
    deadline = time.monotonic() + 5
    while runner.is_running() and time.monotonic() < deadline:
        time.sleep(0.01)


def test_reports_progress_and_finishes():
    release = threading.Event()
    seen_steps = []

    def analyse(report_progress):
        report_progress(2)
        seen_steps.append(runner.status)
        release.wait(timeout=5)

    runner = AnalysisRunner(analyse)
    assert runner.start()
    release.set()
    wait_until_done(runner)

    assert seen_steps == [AnalysisStatus(state="running", completed_steps=2)]
    assert runner.status == AnalysisStatus(state="finished", completed_steps=ANALYSIS_STEP_COUNT)


def test_refuses_a_second_run_while_one_is_running():
    release = threading.Event()
    runner = AnalysisRunner(lambda report_progress: release.wait(timeout=5))

    assert runner.start()
    assert not runner.start()
    release.set()
    wait_until_done(runner)


def test_a_failed_run_keeps_how_far_it_came():
    def analyse(report_progress):
        report_progress(3)
        raise ValueError("No questions found")

    runner = AnalysisRunner(analyse)
    runner.start()
    wait_until_done(runner)

    assert runner.status == AnalysisStatus(state="failed", completed_steps=3)
