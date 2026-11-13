"""
Tests the cluster validation metrics with made-up themes and routines.
"""

import numpy as np
import pytest

from src.ai.evaluation.cluster_validation import (
    NOISE_LABEL,
    routine_pair_agreement,
    routine_purity,
    summarize_themes,
)


def test_summary_counts_themes_and_noise():
    labels = np.array([0, 0, 0, 1, 1, NOISE_LABEL, NOISE_LABEL, NOISE_LABEL])

    summary = summarize_themes(labels)

    assert summary["themes"] == 2
    assert summary["noise_share"] == pytest.approx(3 / 8)
    assert summary["median_size"] == 2.5
    assert summary["largest_size"] == 3


def test_questions_with_a_shared_routine_in_one_theme_agree_fully():
    labels = [0, 0, 1]
    routines = [{"1000-1"}, {"1000-1", "2000-1"}, {"3000-1"}]

    agreement = routine_pair_agreement(labels, routines)

    assert agreement["recall"] == 1.0
    assert agreement["precision"] == 1.0


def test_related_questions_in_different_themes_lower_the_recall():
    labels = [0, 1]
    routines = [{"1000-1"}, {"1000-1"}]

    agreement = routine_pair_agreement(labels, routines)

    assert agreement["related_pairs"] == 1
    assert agreement["recall"] == 0.0


def test_unrelated_questions_in_one_theme_lower_the_precision():
    labels = [0, 0]
    routines = [{"1000-1"}, {"2000-1"}]

    agreement = routine_pair_agreement(labels, routines)

    assert agreement["together_pairs"] == 1
    assert agreement["precision"] == 0.0


def test_noise_is_never_together():
    labels = [NOISE_LABEL, NOISE_LABEL]
    routines = [{"1000-1"}, {"1000-1"}]

    agreement = routine_pair_agreement(labels, routines)

    assert agreement["together_pairs"] == 0
    assert agreement["recall"] == 0.0


def test_f1_balances_precision_and_recall():
    labels = [0, 0, 0]
    routines = [{"1000-1"}, {"1000-1"}, {"2000-1"}]

    agreement = routine_pair_agreement(labels, routines)

    assert agreement["recall"] == 1.0
    assert agreement["precision"] == pytest.approx(1 / 3)
    assert agreement["f1"] == pytest.approx(0.5)


def test_purity_counts_every_listed_routine():
    labels = [0, 0, 0, 1]
    routines = [{"1000-1", "2000-1"}, {"2000-1"}, {"3000-1"}, {"4000-1"}]

    purity, judged = routine_purity(labels, routines)

    assert judged == 3
    assert purity == pytest.approx(2 / 3)


def test_purity_ignores_themes_with_one_question_and_noise():
    labels = [0, NOISE_LABEL, NOISE_LABEL]
    routines = [{"1000-1"}, {"1000-1"}, {"1000-1"}]

    purity, judged = routine_purity(labels, routines)

    assert judged == 0
    assert np.isnan(purity)
