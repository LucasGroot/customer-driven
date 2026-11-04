"""
Tests the checks on uploaded ServiceNow exports and Kvaliteket routines, with
made-up files written to a temporary folder instead of data/raw.
"""

from io import BytesIO

import pandas as pd
import pytest

from backend.admin import uploads
from backend.admin.uploads import UploadedFile, UploadRejectedError


@pytest.fixture(autouse=True)
def temporary_data_folder(tmp_path, monkeypatch):
    monkeypatch.setattr(uploads, "QUESTIONS_PATH", tmp_path / "serviceNow" / "serviceNow_questions.xlsx")
    monkeypatch.setattr(uploads, "ROUTINES_FOLDER", tmp_path / "kvaliteket")


def excel_file(rows, name="eksport.xlsx"):
    content = BytesIO()
    pd.DataFrame(rows).to_excel(content, index=False)
    return UploadedFile(name, content.getvalue())


def pdf_file(name):
    return UploadedFile(name, b"%PDF-1.7 made-up routine")


QUESTION_ROW = {"Nummer": "INC1", "Tjenestetilbud": "Lønn", "Kort beskrivelse": "Spørsmål", "Beskrivelse": "Tekst"}


def rejection_reason(check, *arguments):
    with pytest.raises(UploadRejectedError) as error:
        check(*arguments)
    return error.value.detail["reason"]


def test_accepts_a_servicenow_export():
    uploads.check_questions(excel_file([QUESTION_ROW]))


def test_rejects_a_file_that_is_not_excel():
    assert rejection_reason(uploads.check_questions, UploadedFile("eksport.xlsx", b"not a spreadsheet")) == "wrongType"


def test_rejects_an_export_missing_columns():
    file = excel_file([{"Nummer": "INC1", "Beskrivelse": "Tekst"}])

    with pytest.raises(UploadRejectedError) as error:
        uploads.check_questions(file)

    assert error.value.detail["columns"] == ["Tjenestetilbud", "Kort beskrivelse"]


def test_rejects_an_export_with_the_same_number_twice():
    assert rejection_reason(uploads.check_questions, excel_file([QUESTION_ROW, QUESTION_ROW])) == "duplicateQuestionNumbers"


def test_rejects_an_export_without_questions():
    empty_row = {**QUESTION_ROW, "Kort beskrivelse": None, "Beskrivelse": None}

    assert rejection_reason(uploads.check_questions, excel_file([empty_row])) == "noQuestions"


def test_rejects_a_file_over_the_size_limit(monkeypatch):
    monkeypatch.setattr(uploads, "MAX_FILE_BYTES", 10)

    assert rejection_reason(uploads.check_routines, [pdf_file("1760-1-Vernerunde.pdf")]) == "tooLarge"


@pytest.mark.parametrize("name", ["../1760-1-Vernerunde.pdf", "mappe/1760-1-Vernerunde.pdf", ".skjult.pdf"])
def test_rejects_routine_names_that_could_leave_the_folder(name):
    assert rejection_reason(uploads.check_routines, [pdf_file(name)]) == "invalidName"


def test_rejects_a_routine_that_is_not_a_pdf():
    file = UploadedFile("1760-1-Vernerunde.pdf", b"PK\x03\x04 a zip")

    assert rejection_reason(uploads.check_routines, [file]) == "wrongType"


def test_skips_a_routine_already_uploaded_even_with_a_new_title():
    uploads.save_routines([pdf_file("1760-1-Vernerunde.pdf")])
    new_routine = pdf_file("1800-2-Ferie.pdf")

    new_files, skipped_names = uploads.split_new_routines([pdf_file("1760-1-Vernerunde ny tittel.pdf"), new_routine])

    assert new_files == [new_routine]
    assert skipped_names == ["1760-1-Vernerunde ny tittel.pdf"]


def test_rejects_the_same_routine_chosen_twice():
    files = [pdf_file("1760-1-Vernerunde.pdf"), pdf_file("1760-1-Vernerunde (1).pdf")]

    assert rejection_reason(uploads.check_routines, files) == "routineChosenTwice"


def test_adds_routines_next_to_the_existing_ones_with_a_lowercase_extension():
    uploads.save_routines([pdf_file("1760-1-Vernerunde.pdf")])

    saved = uploads.save_routines([pdf_file("1800-2-Ferie.PDF")])

    assert saved == ["1800-2-Ferie.pdf"]
    assert sorted(path.name for path in uploads.ROUTINES_FOLDER.iterdir()) == ["1760-1-Vernerunde.pdf", "1800-2-Ferie.pdf"]


def test_replaces_the_previous_servicenow_export():
    uploads.save_questions(UploadedFile("gammel.xlsx", b"old"))

    uploads.save_questions(UploadedFile("ny.xlsx", b"new"))

    assert uploads.QUESTIONS_PATH.read_bytes() == b"new"
    assert [path.name for path in uploads.QUESTIONS_PATH.parent.iterdir()] == ["serviceNow_questions.xlsx"]
