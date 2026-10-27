"""
Tests how often a relevant routine is among the candidates, using made-up
scores so no confidential files are needed.
"""

import pandas as pd
import pytest

from backend.ai.evaluation.candidate_coverage import candidate_coverage, candidates_per_question


ROUTINE_NAMES = ["1000-1 A.pdf", "2000-1 B.pdf", "3000-1 C.pdf"]
QUESTION_IDS = ["INC001", "INC002"]

# Method one prefers A for both questions, method two prefers B for INC001 and C for INC002
METHOD_ONE = pd.DataFrame([[0.9, 0.2, 0.1], [0.9, 0.2, 0.1]], index=QUESTION_IDS, columns=ROUTINE_NAMES)
METHOD_TWO = pd.DataFrame([[0.1, 0.9, 0.2], [0.1, 0.2, 0.9]], index=QUESTION_IDS, columns=ROUTINE_NAMES)

GROUND_TRUTH = pd.DataFrame(
    {
        "has_routine": [True, True],
        "relevant_routine_ids": [{"2000-1"}, {"3000-1"}],
    },
    index=QUESTION_IDS,
)


def test_candidates_are_the_top_routines_of_every_method_put_together():
    candidates = candidates_per_question([METHOD_ONE, METHOD_TWO], top_n=1)

    assert candidates["INC001"] == {"1000-1", "2000-1"}
    assert candidates["INC002"] == {"1000-1", "3000-1"}


def test_one_method_alone_misses_what_a_combination_finds():
    alone, alone_size = candidate_coverage([METHOD_ONE], GROUND_TRUTH, top_n=1)
    combined, combined_size = candidate_coverage([METHOD_ONE, METHOD_TWO], GROUND_TRUTH, top_n=1)

    assert alone == pytest.approx(0.0)
    assert combined == pytest.approx(1.0)
    assert (alone_size, combined_size) == (1, 2)
