"""
The admin page's endpoints: uploading new ServiceNow and Kvaliteket data, and
running the analysis on it. main.py adds require_admin to every route here.
Every change to the data, and every refused one, goes to the audit log.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from backend.admin import uploads
from backend.admin.analysis_run import AnalysisRunner
from backend.api.audit_log import AuditLog, file_fingerprint
from backend.api.auth import CurrentUser
from backend.api.dependencies import require_admin

router = APIRouter(prefix="/api/admin")


def get_analysis_runner(request: Request) -> AnalysisRunner:
    """The app's one runner, so every request sees the same run."""
    return request.app.state.analysis_runner


def get_audit_log(request: Request) -> AuditLog:
    return request.app.state.audit_log


Runner = Annotated[AnalysisRunner, Depends(get_analysis_runner)]
Audit = Annotated[AuditLog, Depends(get_audit_log)]
# The same check main.py puts on the router; FastAPI runs it once and hands over the user
Admin = Annotated[CurrentUser, Depends(require_admin)]


def read_upload(upload: UploadFile) -> uploads.UploadedFile:
    """Read at most one byte past the limit, so an oversized file is not read whole."""
    return uploads.UploadedFile(upload.filename or "", upload.file.read(uploads.MAX_FILE_BYTES + 1))


@router.post("/import")
def import_data(
    runner: Runner,
    audit_log: Audit,
    user: Admin,
    questions: Annotated[UploadFile | None, File()] = None,
    routines: Annotated[list[UploadFile] | None, File()] = None,
) -> dict:
    """
    Replace the ServiceNow export and/or add new Kvaliteket routines, skipping
    routines already uploaded. Nothing is saved unless every file passes its checks.
    """
    chosen = ([questions] if questions is not None else []) + (routines or [])
    chosen_names = [upload.filename or "" for upload in chosen]

    def reject(status_code, detail):
        audit_log.record("upload.rejected", user.email, files=chosen_names, refusal=detail)
        return HTTPException(status_code, detail)

    if runner.is_running():
        raise reject(status.HTTP_409_CONFLICT, {"reason": "analysisRunning"})
    if questions is None and not routines:
        raise reject(status.HTTP_400_BAD_REQUEST, {"reason": "noFiles"})
    if routines is not None and len(routines) > uploads.MAX_ROUTINES_PER_UPLOAD:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            {"reason": "tooManyFiles", "maxFiles": uploads.MAX_ROUTINES_PER_UPLOAD},
        )

    questions_file = read_upload(questions) if questions is not None else None
    routine_files = [read_upload(upload) for upload in routines or []]
    try:
        if questions_file is not None:
            uploads.check_questions(questions_file)
        uploads.check_routines(routine_files)
        new_routines, skipped_routines = uploads.split_new_routines(routine_files)
        uploads.check_routine_storage(new_routines)
    except uploads.UploadRejectedError as error:
        raise reject(error.status_code, error.detail) from None

    if questions_file is not None:
        uploads.save_questions(questions_file)
    added_routines = uploads.save_routines(new_routines)
    audit_log.record(
        "upload.saved",
        user.email,
        questionsReplaced=(
            file_fingerprint(questions_file.name, questions_file.content) if questions_file is not None else None
        ),
        routinesAdded=[file_fingerprint(name, file.content) for name, file in zip(added_routines, new_routines)],
        routinesSkipped=skipped_routines,
    )
    return {
        "questionsReplaced": questions_file is not None,
        "routinesAdded": added_routines,
        "routinesSkipped": skipped_routines,
    }


@router.post("/analysis", status_code=status.HTTP_202_ACCEPTED)
def start_analysis(runner: Runner, audit_log: Audit, user: Admin) -> dict:
    """Start a new analysis run on the uploaded files."""
    if not runner.start(started_by=user.email):
        audit_log.record("analysis.rejected", user.email, refusal={"reason": "analysisRunning"})
        raise HTTPException(status.HTTP_409_CONFLICT, {"reason": "analysisRunning"})
    return analysis_status(runner)


@router.get("/analysis")
def analysis_status(runner: Runner) -> dict:
    """How far the latest run has come."""
    current = runner.status
    return {"state": current.state, "completedSteps": current.completed_steps}
