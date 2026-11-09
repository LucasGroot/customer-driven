"""
Groups questions that are about the same thing, and gives each group a title.
Several questions in one group means that many people wonder about the same thing,
which is what HR wants to find: when no routine answers it well enough, or as a
subtopic that makes up a large part of what is asked about a routine.
"""

from dataclasses import dataclass

import numpy as np

from backend.ai.clustering.cluster_titles import title_cluster
from backend.ai.clustering.question_clustering import (
    DEFAULT_MIN_CLUSTER_SIZE,
    central_question_per_cluster,
    cluster_questions,
)


@dataclass(frozen=True)
class TitledGroup:
    """
    A group of question IDs under one title, with the question that stands for
    the group first.
    """

    title: str
    question_ids: list


def group_similar_questions(question_ids, embeddings):
    """
    Returns the groups of question IDs, the largest first. In each group the
    question closest to the middle of the group comes first, since it stands for
    the group. Questions that fit no group are left out.
    question_ids and embeddings are in the same order.
    """
    # Centring the embeddings of fewer questions than a group needs would divide by zero
    if len(question_ids) < DEFAULT_MIN_CLUSTER_SIZE:
        return []

    labels = cluster_questions(embeddings)
    central_rows = central_question_per_cluster(embeddings, labels)

    groups = []
    for label, central_row in central_rows.items():
        other_rows = [row for row in np.flatnonzero(labels == label) if row != central_row]
        groups.append([question_ids[central_row]] + [question_ids[row] for row in other_rows])

    return sorted(groups, key=len, reverse=True)


def title_groups(groups, question_texts, routine_name=None):
    """
    Gives every group a title made from its questions. question_texts maps a
    question ID to its text. routine_name is set for groups inside one routine.
    """
    return [
        TitledGroup(
            title=title_cluster([question_texts[question_id] for question_id in group], routine_name),
            question_ids=group,
        )
        for group in groups
    ]
