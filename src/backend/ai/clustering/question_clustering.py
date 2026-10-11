"""
Groups questions into themes by clustering their embeddings, so recurring
inquiries can be counted and compared with the routines as one unit.
"""

import numpy as np
from sklearn.cluster import HDBSCAN


NOISE_LABEL = -1
DEFAULT_MIN_CLUSTER_SIZE = 3
DEFAULT_RELEVANCE_MARGIN = 0.05


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


def themes_per_question(question_embeddings, labels, relevance_margin=DEFAULT_RELEVANCE_MARGIN):
    """
    Returns, for every question, a list of (theme label, relevance) pairs. The
    first pair is the primary theme, which is the one clustering gave the
    question and the only one to use when counting. The rest are other themes
    whose relevance is within relevance_margin of the best one. Relevance is
    the cosine similarity to the centre of the theme.
    Questions outside every theme get an empty list.
    """

    embeddings = center_embeddings(question_embeddings)
    theme_labels = np.unique(labels[labels != NOISE_LABEL])
    if len(theme_labels) == 0:
        return [[] for _ in labels]

    theme_sums = np.array([embeddings[labels == label].sum(axis=0) for label in theme_labels])
    centres = theme_sums / np.linalg.norm(theme_sums, axis=1, keepdims=True)
    relevance = embeddings @ centres.T

    # A question must not pull the centre of its own theme towards itself, or it always looks best placed there
    for column, label in enumerate(theme_labels):
        for row in np.flatnonzero(labels == label):
            centre_without_question = theme_sums[column] - embeddings[row]
            relevance[row, column] = embeddings[row] @ centre_without_question / np.linalg.norm(centre_without_question)

    memberships = []
    for row, label in enumerate(labels):
        if label == NOISE_LABEL:
            memberships.append([])
            continue

        primary_column = int(np.flatnonzero(theme_labels == label)[0])
        within_margin = relevance[row] >= relevance[row].max() - relevance_margin
        within_margin[primary_column] = False
        other_columns = np.flatnonzero(within_margin)
        other_columns = other_columns[np.argsort(relevance[row, other_columns])[::-1]]

        memberships.append(
            [(int(label), float(relevance[row, primary_column]))]
            + [(int(theme_labels[column]), float(relevance[row, column])) for column in other_columns]
        )

    return memberships


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
