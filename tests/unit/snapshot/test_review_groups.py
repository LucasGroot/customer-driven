"""
Tests how the questions that need review are grouped, using made-up vectors so
no confidential files are needed.
"""

import numpy as np

from backend.snapshot.review_groups import group_review_questions


def blob(axis, count, seed, dimensions=10):
    """
    Returns count unit vectors scattered tightly around one axis.
    """
    rng = np.random.default_rng(seed)
    direction = np.zeros(dimensions)
    direction[axis] = 1.0
    vectors = direction + rng.normal(scale=0.03, size=(count, dimensions))
    return vectors / np.linalg.norm(vectors, axis=1, keepdims=True)


def test_questions_about_the_same_thing_end_up_in_one_group_and_others_in_another():
    ids = [f"A{n}" for n in range(8)] + [f"B{n}" for n in range(5)]
    embeddings = np.vstack([blob(0, 8, seed=1), blob(1, 5, seed=2)])

    groups = group_review_questions(ids, embeddings)

    assert [sorted(group) for group in groups] == [sorted(ids[:8]), sorted(ids[8:])]


def test_the_largest_group_comes_first():
    ids = [f"A{n}" for n in range(5)] + [f"B{n}" for n in range(8)]
    embeddings = np.vstack([blob(0, 5, seed=1), blob(1, 8, seed=2)])

    groups = group_review_questions(ids, embeddings)

    assert [len(group) for group in groups] == [8, 5]


def test_questions_that_fit_no_group_are_left_out():
    ids = ["X1", "X2"]

    assert group_review_questions(ids, blob(0, 2, seed=4)) == []
