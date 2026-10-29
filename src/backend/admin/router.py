"""
The admin page's endpoints: uploading new ServiceNow and Kvaliteket data, and
running the analysis on it. main.py adds require_admin to every route here.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from backend.admin import uploads
from backend.admin.analysis_run import AnalysisRunner

router = APIRouter(prefix="/api/admin")


def get_analysis_runner(request: Request) -> AnalysisRunner:
    """The app's one runner, so every request sees the same run."""
    return request.app.state.analysis_runner


Runner = Annotated[AnalysisRunner, Depends(get_analysis_runner)]


def read_upload(upload: UploadFile) -> uploads.UploadedFile:
    """Read at most one byte past the limit, so an oversized file is not read whole."""
    return uploads.UploadedFile(upload.filename or "", upload.file.read(uploads.MAX_FILE_BYTES + 1))


@router.post("/import")
def import_data(
    runner: Runner,
    questions: Annotated[UploadFile | None, File()] = None,
    routines: Annotated[list[UploadFile] | None, File()] = None,
) -> dict:
    """
    Replace the ServiceNow export and/or add new Kvaliteket routines. Nothing
    is saved unless every file passes its checks.
    """
    if runner.is_running():
        raise HTTPException(status.HTTP_409_CONFLICT, {"reason": "analysisRunning"})
    if questions is None and not routines:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, {"reason": "noFiles"})

    questions_file = read_upload(questions) if questions is not None else None
    routine_files = [read_upload(upload) for upload in routines or []]
    try:
        if questions_file is not None:
            uploads.check_questions(questions_file)
        uploads.check_routines(routine_files)
    except uploads.UploadRejectedError as error:
        raise HTTPException(error.status_code, error.detail) from None

    if questions_file is not None:
        uploads.save_questions(questions_file)
    added_routines = uploads.save_routines(routine_files)
    return {"questionsReplaced": questions_file is not None, "routinesAdded": added_routines}


@router.post("/analysis", status_code=status.HTTP_202_ACCEPTED)
def start_analysis(runner: Runner) -> dict:
    """Start a new analysis run on the uploaded files."""
    if not runner.start():
        raise HTTPException(status.HTTP_409_CONFLICT, {"reason": "analysisRunning"})
    return analysis_status(runner)


@router.get("/analysis")
def analysis_status(runner: Runner) -> dict:
    """How far the latest run has come."""
    current = runner.status
    return {"state": current.state, "completedSteps": current.completed_steps}
