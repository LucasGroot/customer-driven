"""
Tests how questions are grouped and titled, using made-up vectors and a made-up
language model so no confidential files or credentials are needed.
"""

import numpy as np

from src.snapshot import question_groups
from src.snapshot.question_groups import TitledGroup, group_similar_questions, title_groups


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

    groups = group_similar_questions(ids, embeddings)

    assert [sorted(group) for group in groups] == [sorted(ids[:8]), sorted(ids[8:])]


def test_the_largest_group_comes_first():
    ids = [f"A{n}" for n in range(5)] + [f"B{n}" for n in range(8)]
    embeddings = np.vstack([blob(0, 5, seed=1), blob(1, 8, seed=2)])

    groups = group_similar_questions(ids, embeddings)

    assert [len(group) for group in groups] == [8, 5]


def test_questions_that_fit_no_group_are_left_out():
    ids = ["X1", "X2"]

    assert group_similar_questions(ids, blob(0, 2, seed=4)) == []


def test_a_single_question_is_left_out_instead_of_failing():
    assert group_similar_questions(["X1"], blob(0, 1, seed=5)) == []


def test_every_group_is_titled_from_its_questions_with_the_routine_as_context(monkeypatch):
    prompts = []

    def fake_title_cluster(question_texts, routine_name):
        prompts.append((question_texts, routine_name))
        return f"Tittel {len(question_texts)}"

    monkeypatch.setattr(question_groups, "title_cluster", fake_title_cluster)
    texts = {"A1": "første", "A2": "andre", "B1": "tredje"}

    titled = title_groups([["A1", "A2"], ["B1"]], texts, routine_name="Ferierutine")

    assert titled == [TitledGroup("Tittel 2", ["A1", "A2"]), TitledGroup("Tittel 1", ["B1"])]
    assert prompts == [(["første", "andre"], "Ferierutine"), (["tredje"], "Ferierutine")]
