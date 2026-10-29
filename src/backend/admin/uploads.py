"""
Checks and saves the files an administrator uploads on the import page into
data/raw, where the analysis reads them. The files are confidential, so they
are only written there (gitignored) and their content never ends up in an
error message.
"""

import os
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import pandas as pd

from backend.ai.similarity_metrics.shared_logic import (
    QUESTION_ID_COLUMN,
    SERVICE_COLUMN,
    TEXT_COLUMNS,
    extract_questions,
)
from backend.snapshot.build_snapshot import split_routine_filename

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
QUESTIONS_PATH = REPOSITORY_ROOT / "data" / "raw" / "serviceNow" / "serviceNow_questions.xlsx"
ROUTINES_FOLDER = REPOSITORY_ROOT / "data" / "raw" / "kvaliteket"

MAX_FILE_MEGABYTES = 20
MAX_FILE_BYTES = MAX_FILE_MEGABYTES * 1024 * 1024
REQUIRED_QUESTION_COLUMNS = [QUESTION_ID_COLUMN, SERVICE_COLUMN, *TEXT_COLUMNS]

# The first bytes of the file itself, so a renamed file of another type is caught
XLSX_SIGNATURE = b"PK\x03\x04"
PDF_SIGNATURE = b"%PDF-"


@dataclass(frozen=True)
class UploadedFile:
    name: str
    content: bytes


class UploadRejectedError(Exception):
    """
    An upload that cannot be saved. reason and details are sent to the
    dashboard, which turns them into a message for the administrator.
    """

    def __init__(self, reason, status_code=400, **details):
        super().__init__(reason)
        self.status_code = status_code
        self.detail = {"reason": reason, **details}


def check_size(file):
    """
    Rejects a file over the size limit.
    """

    if len(file.content) > MAX_FILE_BYTES:
        raise UploadRejectedError("tooLarge", status_code=413, file=file.name, maxMegabytes=MAX_FILE_MEGABYTES)


def check_questions(file):
    """
    Rejects anything but a ServiceNow export the analysis can read: an .xlsx
    file with the columns it uses, at least one question, and unique numbers.
    """

    if not file.name.lower().endswith(".xlsx") or not file.content.startswith(XLSX_SIGNATURE):
        raise UploadRejectedError("wrongType", file=file.name, expected="xlsx")
    check_size(file)

    # Parsing an uploaded file can fail in many ways; any of them means it is unusable
    try:
        columns = pd.read_excel(BytesIO(file.content), nrows=0).columns
    except Exception:
        raise UploadRejectedError("unreadable", file=file.name) from None

    missing = [column for column in REQUIRED_QUESTION_COLUMNS if column not in columns]
    if missing:
        raise UploadRejectedError("missingColumns", file=file.name, columns=missing)

    try:
        questions = extract_questions(BytesIO(file.content))
    except ValueError:
        raise UploadRejectedError("duplicateQuestionNumbers", file=file.name) from None
    if questions.empty:
        raise UploadRejectedError("noQuestions", file=file.name)


def routine_code(filename):
    """
    The Kvaliteket document code, e.g. "1760-1" for "1760-1-Vernerunde.pdf",
    which identifies a routine even if its title changes.
    """

    code, _ = split_routine_filename(filename)
    return code


def existing_routine_codes(folder):
    """
    The codes of the routines already uploaded.
    """

    if not folder.exists():
        return set()
    return {routine_code(path.name) for path in folder.iterdir() if path.suffix.lower() == ".pdf"}


def check_routines(files):
    """
    Rejects routines that are not PDFs, have an unsafe name, or are chosen
    twice. Every file is checked before anything is saved, so an upload with a
    broken file saves nothing.
    """

    for file in files:
        # A name with a folder in it could write outside the routines folder
        if Path(file.name).name != file.name or "\\" in file.name or file.name.startswith("."):
            raise UploadRejectedError("invalidName", file=file.name)
        if not file.name.lower().endswith(".pdf") or not file.content.startswith(PDF_SIGNATURE):
            raise UploadRejectedError("wrongType", file=file.name, expected="pdf")
        check_size(file)

    codes = [routine_code(file.name) for file in files]
    chosen_twice = sorted({file.name for file, code in zip(files, codes) if codes.count(code) > 1})
    if chosen_twice:
        raise UploadRejectedError("routineChosenTwice", status_code=409, files=chosen_twice)


def split_new_routines(files):
    """
    Separates the routines not uploaded before from those that are, so an
    administrator can choose the whole Kvaliteket folder again and only the
    new ones are added. Returns the new files and the names of the skipped ones.
    """

    existing = existing_routine_codes(ROUTINES_FOLDER)
    new_files = [file for file in files if routine_code(file.name) not in existing]
    skipped_names = sorted(file.name for file in files if routine_code(file.name) in existing)
    return new_files, skipped_names


def write_file(path, content):
    """
    Writes a file through a temporary one, so a run never reads it half-written.
    """

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_name(path.name + ".tmp")
    temporary_path.write_bytes(content)
    os.replace(temporary_path, path)


def save_questions(file):
    """
    Replaces the ServiceNow export, since each export holds every question.
    """

    write_file(QUESTIONS_PATH, file.content)


def save_routines(files):
    """
    Adds the routines next to the ones already uploaded. Returns the saved names.
    """

    saved_names = []
    for file in files:
        # The PDF reader only picks up files ending in lowercase .pdf
        name = Path(file.name).stem + ".pdf"
        write_file(ROUTINES_FOLDER / name, file.content)
        saved_names.append(name)
    return saved_names
