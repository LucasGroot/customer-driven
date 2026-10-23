"""
Groups the questions that need review by what they are about. Several
questions in one group means that many people wonder about the same thing and
no routine answers it well enough, which is what HR wants to find.
"""

import numpy as np

from backend.ai.clustering.question_clustering import central_question_per_cluster, cluster_questions


def group_review_questions(question_ids, embeddings):
    """
    Returns the groups of question IDs, the largest first. In each group the
    question closest to the middle of the group comes first, since it stands for
    the group. Questions that fit no group are left out.
    question_ids and embeddings are in the same order.
    """

    labels = cluster_questions(embeddings)
    central_rows = central_question_per_cluster(embeddings, labels)

    groups = []
    for label, central_row in central_rows.items():
        other_rows = [row for row in np.flatnonzero(labels == label) if row != central_row]
        groups.append([question_ids[central_row]] + [question_ids[row] for row in other_rows])

    return sorted(groups, key=len, reverse=True)
