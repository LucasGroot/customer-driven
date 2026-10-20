"""
Tests the ground truth loading and evaluation metrics with made-up data,
so no confidential files are needed.
"""

import pandas as pd
import pytest

from backend.ai.evaluation.ground_truth_evaluation import evaluate, load_ground_truth, missing_routine_ids


def write_ground_truth(path, rows):
    columns = ["servicenow_id", "service", "source_type", "correct_routine_ids", "other_relevant_routine_ids", "other_source"]
    pd.DataFrame(rows, columns=columns).to_csv(path, index=False)
    return path


@pytest.fixture
def ground_truth(tmp_path):
    path = write_ground_truth(tmp_path / "ground_truth.csv", [
        ["INC001", "Ferie", "routine", "1000-1", None, None],
        ["INC002", "Sykefravær", "routine", "2000-1;9999-1", "3000-1", None],
        ["INC003", "Personal", "no_source", None, None, None],
        ["INC004", "Personal", "other_source", None, None, "HTA kap 4"],
        ["INC005", "Personal", "unknown", None, None, None],
        ["INC006", "Tilsetting", "routine", "9999-1", None, None],
    ])
    return load_ground_truth(path)


@pytest.fixture
def scores():
    question_ids = pd.Index(["INC001", "INC002", "INC003", "INC004", "INC006"], name="Nummer")
    return pd.DataFrame(
        [
            [0.9, 0.1, 0.2],
            [0.8, 0.3, 0.5],
            [0.2, 0.3, 0.1],
            [0.4, 0.1, 0.2],
            [0.5, 0.5, 0.5],
        ],
        index=question_ids,
        columns=["1000-1 Ferie.pdf", "2000-1 Sykefravær.pdf", "3000-1 Permisjon.pdf"],
    )


def test_load_ground_truth_merges_routines_and_drops_unknown(ground_truth):
    assert "INC005" not in ground_truth.index
    assert ground_truth.loc["INC002", "relevant_routine_ids"] == {"2000-1", "9999-1", "3000-1"}
    assert not ground_truth.loc["INC004", "has_routine"]


def test_missing_routine_ids(ground_truth):
    assert missing_routine_ids(ground_truth, ["1000-1", "2000-1", "3000-1"]) == ["9999-1"]


def test_evaluate(ground_truth, scores):
    metrics = evaluate(scores, ground_truth)

    # INC001 is ranked 1st, INC002's best relevant routine (3000-1) is ranked 2nd
    assert metrics["hit_at_1"] == pytest.approx(0.5)
    assert metrics["hit_at_3"] == pytest.approx(1.0)
    assert metrics["mrr"] == pytest.approx((1 + 1 / 2) / 2)
    # Both questions with a routine score higher at the top than both without one
    assert metrics["gap_auc"] == pytest.approx(1.0)
    assert metrics["routine_questions"] == 2
    assert metrics["no_routine_questions"] == 2
    # INC006 only refers to a routine that is not among the PDFs
    assert metrics["skipped_missing_routine"] == 1


@pytest.mark.parametrize("hit_metric, cutoff", [("hit_at_5", 5), ("hit_at_10", 10)])
def test_hit_at_n_only_counts_routines_ranked_within_the_cutoff(hit_metric, cutoff):
    routine_names = [f"{1000 + number}-1 Rutine.pdf" for number in range(12)]
    scores = pd.DataFrame(
        [list(range(12, 0, -1))] * 2,
        index=["INC001", "INC002"],
        columns=routine_names,
    )
    # The routine at index n has rank n + 1, so one question's routine is ranked at the cutoff and the other's just below it
    ground_truth = pd.DataFrame(
        {
            "has_routine": [True, True],
            "relevant_routine_ids": [{f"{1000 + cutoff - 1}-1"}, {f"{1000 + cutoff}-1"}],
        },
        index=["INC001", "INC002"],
    )

    metrics = evaluate(scores, ground_truth)

    assert metrics[hit_metric] == pytest.approx(0.5)
