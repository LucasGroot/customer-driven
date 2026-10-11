"""
Groups questions into themes by clustering their embeddings, so recurring
inquiries can be counted and compared with the routines as one unit.
"""

import numpy as np
from sklearn.cluster import HDBSCAN


NOISE_LABEL = -1
DEFAULT_MIN_CLUSTER_SIZE = 3


def center_embeddings(question_embeddings):
    """
    Removes the component all questions share and scales each vector to unit length.
    Every question is about HR, so without this any two questions look alike.
    """

    embeddings = np.asarray(question_embeddings, dtype=float)
    centered = embeddings - embeddings.mean(axis=0)

    return centered / np.linalg.norm(centered, axis=1, keepdims=True)


def cluster_questions(question_embeddings, min_cluster_size=DEFAULT_MIN_CLUSTER_SIZE):
    """
    Clusters all questions together and returns one label per question.
    Questions that belong to no theme get NOISE_LABEL.
    """

    embeddings = center_embeddings(question_embeddings)

    # "leaf" keeps themes small and coherent; the default merged unrelated questions into one large theme
    return HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=1,
        cluster_selection_method="leaf",
    ).fit_predict(embeddings)


def central_question_per_cluster(question_embeddings, labels):
    """
    Returns {label: row of the question closest to the centre of that theme}.
    The central question is what names a theme. Noise is left out.
    """

    embeddings = center_embeddings(question_embeddings)

    central = {}
    for label in np.unique(labels[labels != NOISE_LABEL]):
        rows = np.flatnonzero(labels == label)
        centre = embeddings[rows].mean(axis=0)
        central[int(label)] = int(rows[np.argmax(embeddings[rows] @ centre)])

    return central
