"""
Evaluates similarity scores against the ground truth on two tasks:
finding the right routine for questions that have one, and giving lower
scores to questions without a routine (the knowledge gaps).
"""

import re

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score


EVALUATED_SOURCE_TYPES = ["routine", "other_source", "no_source"]

_ROUTINE_ID_RE = re.compile(r"\d+-\d+")


def routine_id_from_filename(filename):
    """
    Returns the routine ID a Kvaliteket PDF filename starts with, e.g. "5364-2".
    """
    return _ROUTINE_ID_RE.match(filename).group()


def parse_routine_ids(cell):
    """
    Returns the set of routine IDs in a ";"-separated cell, or an empty set for an empty cell.
    """
    if pd.isna(cell):
        return set()

    return set(_ROUTINE_ID_RE.findall(cell))


def load_ground_truth(csv_path):
    """
    Reads the ground truth CSV, indexed by servicenow_id.
    Correct and other relevant routines are merged into one set, since both count as a hit.
    Rows with any other source_type (e.g. "unknown") are left out.
    """
    ground_truth = pd.read_csv(csv_path, dtype=str).set_index("servicenow_id")
    ground_truth = ground_truth[ground_truth["source_type"].isin(EVALUATED_SOURCE_TYPES)].copy()

    correct_routine_ids = ground_truth["correct_routine_ids"].map(parse_routine_ids)
    other_relevant_routine_ids = ground_truth["other_relevant_routine_ids"].map(parse_routine_ids)
    ground_truth["relevant_routine_ids"] = [
        correct | other for correct, other in zip(correct_routine_ids, other_relevant_routine_ids)
    ]
    ground_truth["has_routine"] = ground_truth["source_type"] == "routine"

    return ground_truth[["service", "source_type", "has_routine", "relevant_routine_ids"]]


def missing_routine_ids(ground_truth, available_routine_ids):
    """
    Returns the routine IDs the ground truth refers to that are not among the available routines.
    """
    referenced_routine_ids = set().union(*ground_truth["relevant_routine_ids"])

    return sorted(referenced_routine_ids - set(available_routine_ids))


def rank_of_first_relevant_routine(question_scores, relevant_routine_ids):
    """
    Returns the 1-based rank of the highest-ranked relevant routine for one question.
    """
    ranked_routine_ids = question_scores.sort_values(ascending=False).index

    for rank, routine_id in enumerate(ranked_routine_ids, start=1):
        if routine_id in relevant_routine_ids:
            return rank


def evaluate(scores, ground_truth):
    """
    Compares a questions x routines score table (routines as PDF filenames) with the ground truth.
    Questions whose relevant routines are all missing from the PDFs are skipped,
    since no method can rank a routine it has never seen.
    Returns a Series with the metrics and how many questions they are based on.
    """
    scores = scores.rename(columns=routine_id_from_filename)
    ground_truth = ground_truth[ground_truth.index.isin(scores.index)]

    has_available_routine = ground_truth["relevant_routine_ids"].map(lambda ids: bool(ids & set(scores.columns)))
    routine_questions = ground_truth[ground_truth["has_routine"] & has_available_routine]
    no_routine_questions = ground_truth[~ground_truth["has_routine"]]

    ranks = pd.Series([
        rank_of_first_relevant_routine(scores.loc[question_id], relevant_routine_ids)
        for question_id, relevant_routine_ids in routine_questions["relevant_routine_ids"].items()
    ], dtype=float)

    top_scores = scores.max(axis=1)
    top_scores_routine = top_scores[routine_questions.index]
    top_scores_no_routine = top_scores[no_routine_questions.index]

    return pd.Series({
        "hit_at_1": (ranks <= 1).mean(),
        "hit_at_3": (ranks <= 3).mean(),
        "mrr": (1 / ranks).mean(),
        "gap_auc": gap_detection_auc(top_scores_routine, top_scores_no_routine),
        "mean_top_score_routine": top_scores_routine.mean(),
        "mean_top_score_no_routine": top_scores_no_routine.mean(),
        "routine_questions": len(routine_questions),
        "no_routine_questions": len(no_routine_questions),
        "skipped_missing_routine": int((ground_truth["has_routine"] & ~has_available_routine).sum()),
    })


def gap_detection_auc(top_scores_routine, top_scores_no_routine):
    """
    Returns the probability that a question with a routine gets a higher top score
    than a question without one (0.5 = random, 1.0 = perfect), or NaN if a group is empty.
    """
    if top_scores_routine.empty or top_scores_no_routine.empty:
        return np.nan

    labels = [1] * len(top_scores_routine) + [0] * len(top_scores_no_routine)
    return roc_auc_score(labels, pd.concat([top_scores_routine, top_scores_no_routine]))
