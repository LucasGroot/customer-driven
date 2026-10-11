"""
Tests the question clustering with made-up vectors, so no confidential files are needed.
"""

import numpy as np

from backend.ai.clustering.question_clustering import (
    NOISE_LABEL,
    center_embeddings,
    central_question_per_cluster,
    cluster_questions,
)


def blob(axis, count, seed, dimensions=10):
    """
    Returns count unit vectors scattered tightly around one axis.
    """
    rng = np.random.default_rng(seed)
    direction = np.zeros(dimensions)
    direction[axis] = 1.0
    vectors = direction + rng.normal(scale=0.03, size=(count, dimensions))
    return vectors / np.linalg.norm(vectors, axis=1, keepdims=True)


def mean_pairwise_cosine(vectors):
    similarities = vectors @ vectors.T
    return similarities[~np.eye(len(vectors), dtype=bool)].mean()


def test_questions_about_different_things_never_share_a_theme():
    embeddings = np.vstack([blob(0, 8, seed=1), blob(1, 8, seed=2), blob(2, 8, seed=3)])

    labels = cluster_questions(embeddings)

    themes = [set(labels[start:start + 8]) - {NOISE_LABEL} for start in (0, 8, 16)]
    assert all(len(group) >= 1 for group in themes)
    assert themes[0].isdisjoint(themes[1]) and themes[0].isdisjoint(themes[2]) and themes[1].isdisjoint(themes[2])


def test_too_few_questions_are_all_noise():
    labels = cluster_questions(blob(0, 4, seed=4))

    assert (labels == NOISE_LABEL).all()


def test_centering_removes_what_all_questions_share():
    rng = np.random.default_rng(4)
    shared = np.array([10.0, 0.0, 0.0, 0.0])
    embeddings = shared + rng.normal(size=(30, 4))
    raw = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

    centered = center_embeddings(embeddings)

    assert mean_pairwise_cosine(raw) > 0.9
    assert mean_pairwise_cosine(centered) < 0.1
    assert np.allclose(np.linalg.norm(centered, axis=1), 1.0)


def test_central_question_is_closest_to_the_centre_of_the_theme():
    straggler = np.zeros((1, 10))
    straggler[0, 0], straggler[0, 3] = 0.6, 0.8
    embeddings = np.vstack([blob(0, 5, seed=6), straggler, blob(1, 5, seed=7)])
    labels = np.array([0] * 6 + [1] * 5)

    central = central_question_per_cluster(embeddings, labels)

    assert central[0] != 5
    assert 6 <= central[1] < 11

