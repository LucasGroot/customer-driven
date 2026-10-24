"""
Evaluates every similarity method against the ground truth and prints
one row of metrics per method, so methods and models can be compared.
"""

import pandas as pd

from src.ai.evaluation.ground_truth_evaluation import (
    evaluate,
    load_ground_truth,
    missing_routine_ids,
    routine_id_from_filename,
)
from src.ai.similarity_metrics.shared_logic import load_corpus
from src.ai.similarity_metrics.bm25_similarity import bm25_similarity
from src.ai.similarity_metrics.tfidf_similarity import tf_idf_similarity
from src.ai.similarity_metrics.cosine_similarity import cosine_similarity
from src.ai.similarity_metrics.euclidean_similarity import euclidean_similarity


METHODS = {
    "tf-idf": tf_idf_similarity,
    "bm25": bm25_similarity,
    "cosine": cosine_similarity,
    "euclidean": euclidean_similarity,
}


def print_data_warnings(corpus, ground_truth):
    """
    Prints ground truth entries that cannot be evaluated: routines missing
    from the PDFs and questions missing from the ServiceNow export.
    """
    available_routine_ids = [routine_id_from_filename(name) for name in corpus.routine_names]
    missing_routines = missing_routine_ids(ground_truth, available_routine_ids)
    missing_questions = ground_truth.index.difference(corpus.questions.index)

    if missing_routines:
        print(f"WARNING: routine IDs not found among the PDFs: {', '.join(missing_routines)}")
    if len(missing_questions):
        print(f"WARNING: {len(missing_questions)} ground truth question(s) not found in the ServiceNow export")


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         ground_truth_path="data/raw/ground_truth.csv"):
    """
    Builds the corpus once, scores it with every method and prints the metrics side by side.
    """
    corpus = load_corpus(questions_path, routines_path)
    ground_truth = load_ground_truth(ground_truth_path)
    print_data_warnings(corpus, ground_truth)

    results = pd.DataFrame({
        method_name: evaluate(method(corpus), ground_truth)
        for method_name, method in METHODS.items()
    }).T

    print()
    print(results.round(3).to_string())


if __name__ == "__main__":
    main()
