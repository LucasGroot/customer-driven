"""
Tests that questions keep their ID and service through the pipeline,
using made-up data so no confidential files are needed.
"""

import numpy as np
import pandas as pd
import pytest

from backend.ai.similarity_metrics.shared_logic import Corpus, extract_questions, top_k_per_routine


def write_questions(path, rows):
    pd.DataFrame(rows, columns=["Nummer", "Kort beskrivelse", "Tjenestetilbud", "Beskrivelse"]).to_excel(path, index=False)
    return path


def test_extract_questions_combines_fields_and_keeps_metadata(tmp_path):
    path = write_questions(tmp_path / "questions.xlsx", [
        ["INC001", "Ferie", "HR", "Hvor mange dager?"],
        ["INC002", None, "HMS", "Avvik"],
        ["INC003", None, "HR", None],
    ])

    questions = extract_questions(path)

    # INC003 has no text at all and is dropped; the others keep ID and service
    assert list(questions.index) == ["INC001", "INC002"]
    assert questions.loc["INC001", "text"] == "Ferie\nHvor mange dager?"
    assert questions.loc["INC002", "text"] == "Avvik"
    assert questions.loc["INC002", "Tjenestetilbud"] == "HMS"


def test_extract_questions_rejects_duplicate_ids(tmp_path):
    path = write_questions(tmp_path / "questions.xlsx", [
        ["INC001", "Ferie", "HR", None],
        ["INC001", "Avvik", "HMS", None],
    ])

    with pytest.raises(ValueError, match="Duplicate"):
        extract_questions(path)


def test_top_k_per_routine_is_indexed_by_question_id():
    questions = pd.DataFrame({"Tjenestetilbud": ["HR"], "text": ["Ferie"]}, index=pd.Index(["INC001"], name="Nummer"))
    corpus = Corpus(questions, ["Ferie.pdf", "Avvik.pdf"], [4, 2], [""] * 6)
    chunk_scores = np.array([[0.82, 0.75, 0.40, 0.10, 0.30, 0.25]])

    scores = top_k_per_routine(chunk_scores, corpus, k=3)

    assert list(scores.index) == ["INC001"]
    assert scores.loc["INC001", "Ferie.pdf"] == pytest.approx(0.66, abs=0.01)
    assert scores.loc["INC001", "Avvik.pdf"] == pytest.approx(0.275)
