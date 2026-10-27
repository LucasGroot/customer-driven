"""
Measures how often the right routine is among the top candidates, for each
scoring method alone and for combinations of them. A combination gives an AI
model more candidates to choose from, so the mean number of candidates per
question is printed too. Only numbers are printed.
"""

import pandas as pd

from backend.ai.evaluation.candidate_coverage import candidate_coverage
from backend.ai.evaluation.ground_truth_evaluation import load_ground_truth
from backend.ai.similarity_metrics.bm25_similarity import bm25_similarity
from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity
from backend.ai.similarity_metrics.shared_logic import load_corpus
from backend.ai.similarity_metrics.tfidf_similarity import tf_idf_similarity


COMBINATIONS = [
    ["cosine"],
    ["tf-idf"],
    ["bm25"],
    ["cosine", "tf-idf"],
    ["cosine", "bm25"],
    ["cosine", "tf-idf", "bm25"],
]
TOP_NS = [3, 5, 10]


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         ground_truth_path="data/raw/ground_truth.csv"):
    """
    Scores the questions with each method once and prints the candidate
    coverage and candidate count of every combination at several top-N.
    """
    corpus = load_corpus(questions_path, routines_path)
    ground_truth = load_ground_truth(ground_truth_path)
    scores = {
        "cosine": cosine_similarity(corpus),
        "tf-idf": tf_idf_similarity(corpus),
        "bm25": bm25_similarity(corpus),
    }

    rows = []
    for methods in COMBINATIONS:
        row = {"methods": " + ".join(methods)}
        for top_n in TOP_NS:
            coverage, mean_candidates = candidate_coverage([scores[method] for method in methods], ground_truth, top_n)
            row[f"top {top_n} coverage"] = coverage
            row[f"top {top_n} candidates"] = mean_candidates
        rows.append(row)

    print(pd.DataFrame(rows).set_index("methods").round(2).to_string())


if __name__ == "__main__":
    main()
