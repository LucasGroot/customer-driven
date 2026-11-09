"""
Measures how often a relevant routine is among the candidates that a later
step, such as an AI model, gets to choose from. The candidates of a question
are the top routines of one or several scoring methods put together.
"""

import numpy as np

from backend.ai.evaluation.ground_truth_evaluation import answerable_routine_questions, routine_id_from_filename


def candidates_per_question(score_tables, top_n):
    """
    Returns {question ID: set of routine IDs}, the top_n routines of every method put together.
    Each score table is questions x routines, with routines as PDF filenames.
    """

    tables = [scores.rename(columns=routine_id_from_filename) for scores in score_tables]

    return {
        question_id: set().union(*(set(scores.loc[question_id].nlargest(top_n).index) for scores in tables))
        for question_id in tables[0].index
    }


def candidate_coverage(score_tables, ground_truth, top_n):
    """
    Returns (share of the questions with a routine that have a relevant routine
    among their candidates, mean number of candidates per question).
    Questions whose relevant routines are all missing from the PDFs are left
    out, as in evaluate, since no method could find them.
    """

    candidates = candidates_per_question(score_tables, top_n)
    available_routine_ids = {routine_id_from_filename(name) for name in score_tables[0].columns}
    ground_truth = ground_truth[ground_truth.index.isin(candidates)]
    routine_questions = answerable_routine_questions(ground_truth, available_routine_ids)

    covered = [
        bool(relevant_routine_ids & candidates[question_id])
        for question_id, relevant_routine_ids in routine_questions["relevant_routine_ids"].items()
    ]

    return np.mean(covered), np.mean([len(routine_ids) for routine_ids in candidates.values()])
