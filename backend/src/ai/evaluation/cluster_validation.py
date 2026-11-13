"""
Measures how the themes from the clustering relate to the ground truth. There is
no ground truth for the themes themselves, so the check is indirect: questions
that share a relevant routine should land in the same theme.
"""

from collections import Counter
from itertools import combinations

import numpy as np

NOISE_LABEL = -1


def summarize_themes(labels):
    """
    Returns the number of themes, the share of questions outside every theme,
    and the median and largest theme size.
    """
    labels = np.asarray(labels)
    theme_sizes = np.bincount(labels[labels != NOISE_LABEL])

    return {
        "themes": len(theme_sizes),
        "noise_share": float((labels == NOISE_LABEL).mean()),
        "median_size": float(np.median(theme_sizes)),
        "largest_size": int(theme_sizes.max()),
    }


def routine_pair_agreement(labels, relevant_routine_ids):
    """
    Looks at every pair of questions that have a ground truth. A pair is related
    if the questions share a relevant routine, and together if both are in the
    same theme. Returns how many related pairs ended up together (recall) and
    how many pairs in a theme are related (precision, a lower bound, since the
    ground truth lists only the routines a person found).
    """
    related_pairs = 0
    together_pairs = 0
    related_and_together = 0

    for (first, first_routines), (second, second_routines) in combinations(zip(labels, relevant_routine_ids), 2):
        related = bool(first_routines & second_routines)
        together = first == second and first != NOISE_LABEL
        related_pairs += related
        together_pairs += together
        related_and_together += related and together

    recall = related_and_together / related_pairs if related_pairs else float("nan")
    precision = related_and_together / together_pairs if together_pairs else float("nan")
    f1 = 2 * precision * recall / (precision + recall) if related_and_together else 0.0

    return {
        "related_pairs": related_pairs,
        "together_pairs": together_pairs,
        "recall": recall,
        "precision": precision,
        "f1": f1,
    }


def routine_purity(labels, relevant_routine_ids):
    """
    For every theme with at least two of the questions, finds the routine most
    of them list as relevant, and returns the share of those questions that list
    it. Every listed routine counts, not only the best one. Returns the share
    and how many questions it is based on.
    """
    labels = np.asarray(labels)
    in_agreement = 0
    judged = 0

    for label in np.unique(labels[labels != NOISE_LABEL]):
        members = [routines for member_label, routines in zip(labels, relevant_routine_ids) if member_label == label]
        if len(members) < 2:
            continue
        routine_counts = Counter(routine for routines in members for routine in routines)
        if not routine_counts:
            continue
        in_agreement += routine_counts.most_common(1)[0][1]
        judged += len(members)

    return (in_agreement / judged if judged else float("nan")), judged
