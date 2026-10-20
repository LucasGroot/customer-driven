"""
Tests how scores become a snapshot, using made-up questions and routines so no
confidential files are needed.
"""

import json
from datetime import date

import numpy as np
import pandas as pd

from backend.snapshot import build_snapshot as snapshot_builder
from backend.snapshot.build_snapshot import build_snapshot, format_norwegian_date, split_routine_filename
from backend.snapshot.models import AnalysisSnapshot, snapshot_to_json_dict
from backend.snapshot.router import SAMPLE_SNAPSHOT_PATH


def test_routine_filename_splits_into_code_and_name():
    assert split_routine_filename("1760-1-Vernerunde.pdf") == ("1760-1", "Vernerunde")


def test_routine_name_keeps_its_own_dashes_and_dots():
    assert split_routine_filename("1638-1-Plan 2025-2027 ink. HMS-mål.pdf") == ("1638-1", "Plan 2025-2027 ink. HMS-mål")


def test_filename_without_a_code_is_used_as_both_code_and_name():
    assert split_routine_filename("Notater.pdf") == ("Notater", "Notater")


def test_date_is_written_in_norwegian():
    assert format_norwegian_date(date(2026, 9, 3)) == "3. september 2026"


QUESTION_IDS = [f"INC{number}" for number in range(1, 11)]
QUESTIONS = pd.DataFrame(
    {
        "Tjenestetilbud": ["Lønn"] * 9 + [None],
        "text": ["Hvor er lønnen?\nSvar"] + [f"Spørsmål {number}" for number in range(2, 11)],
    },
    index=QUESTION_IDS,
)

# INC1 is best matched by the first routine and the others by the second
SCORES = pd.DataFrame(
    {
        "1000-1-Lønn.pdf": [0.8] + [0.1] * 9,
        "2000-1-Vernerunde.pdf": [0.2] + [round(0.1 * number, 1) for number in range(2, 11)],
        "3000-1-Tom.pdf": [np.nan] * 10,
    },
    index=QUESTIONS.index,
)


def make_snapshot():
    return build_snapshot(
        QUESTIONS,
        SCORES,
        last_run=date(2026, 10, 19),
        questions_uploaded=date(2026, 9, 12),
        routines_uploaded=date(2026, 9, 1),
    )


def test_every_question_points_to_its_best_routine_and_score():
    questions = {question.id: question for question in make_snapshot().questions}

    assert (questions["INC1"].document_code, questions["INC1"].coverage) == ("1000-1", 0.8)
    assert (questions["INC5"].document_code, questions["INC5"].coverage) == ("2000-1", 0.5)
    assert questions["INC1"].text == "Hvor er lønnen? Svar"


def test_questions_with_a_best_score_under_the_threshold_go_to_review(monkeypatch):
    monkeypatch.setattr(snapshot_builder, "MIN_RELEVANCE", 0.35)

    flagged = [question.id for question in make_snapshot().questions if question.needs_review]

    # INC2 and INC3 have the only best scores under 0.35 (0.2 and 0.3)
    assert flagged == ["INC2", "INC3"]


def test_a_best_score_exactly_on_the_threshold_is_not_sent_to_review(monkeypatch):
    monkeypatch.setattr(snapshot_builder, "MIN_RELEVANCE", 0.3)

    flagged = [question.id for question in make_snapshot().questions if question.needs_review]

    assert flagged == ["INC2"]


def test_a_missing_category_becomes_unknown():
    assert make_snapshot().questions[-1].category == "Ukjent"


def test_empty_routines_are_left_out():
    snapshot = make_snapshot()

    assert [(document.code, document.name) for document in snapshot.documents] == [
        ("1000-1", "Lønn"),
        ("2000-1", "Vernerunde"),
    ]
    assert snapshot.sources[1].count == 2


def test_the_snapshot_says_it_is_real_data_and_dates_the_run():
    snapshot = make_snapshot()

    assert not snapshot.is_example
    assert snapshot.last_run_label == "19. oktober 2026"
    assert snapshot.sources[0].uploaded_label == "12. september 2026"


def test_json_uses_camel_case_names():
    data = snapshot_to_json_dict(make_snapshot())

    assert data["lastRunLabel"] == "19. oktober 2026"
    assert data["questions"][0]["documentCode"] == "1000-1"
    assert data["questions"][1]["needsReview"] is True


def test_the_bundled_sample_matches_the_contract_exactly():
    sample = json.loads(SAMPLE_SNAPSHOT_PATH.read_text(encoding="utf-8"))

    assert sample["isExample"] is True
    assert snapshot_to_json_dict(AnalysisSnapshot.model_validate(sample)) == sample


def test_review_groups_give_their_questions_a_group_and_a_heading():
    snapshot = build_snapshot(
        QUESTIONS,
        SCORES,
        last_run=date(2026, 10, 19),
        questions_uploaded=date(2026, 9, 12),
        routines_uploaded=date(2026, 9, 1),
        review_groups=[["INC3", "INC2"]],
    )

    assert [(group.id, group.heading_question_id) for group in snapshot.review_groups] == [("r0", "INC3")]
    group_of = {question.id: question.group_id for question in snapshot.questions}
    assert (group_of["INC2"], group_of["INC3"], group_of["INC1"]) == ("r0", "r0", None)


def test_json_leaves_out_the_group_of_questions_in_no_group():
    data = snapshot_to_json_dict(
        build_snapshot(
            QUESTIONS,
            SCORES,
            last_run=date(2026, 10, 19),
            questions_uploaded=date(2026, 9, 12),
            routines_uploaded=date(2026, 9, 1),
            review_groups=[["INC3", "INC2"]],
        )
    )

    assert data["questions"][1]["groupId"] == "r0"
    assert "groupId" not in data["questions"][0]
    assert data["reviewGroups"] == [{"id": "r0", "headingQuestionId": "INC3"}]


def test_questions_needing_review_are_the_ones_under_the_threshold(monkeypatch):
    monkeypatch.setattr(snapshot_builder, "MIN_RELEVANCE", 0.35)

    assert list(snapshot_builder.questions_needing_review(SCORES)) == ["INC2", "INC3"]
