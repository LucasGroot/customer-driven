"""
Runs all three similarity methods and exports the top matches per question,
together with Nummer, Tjenestetilbud and the question text, to an xlsx file
in data/processed for manual inspection.
"""

from pathlib import Path

import pandas as pd

from backend.ai.similarity_metrics.shared_logic import SERVICE_COLUMN, load_corpus
from backend.ai.similarity_metrics.bm25_similarity import bm25_similarity
from backend.ai.similarity_metrics.tfidf_similarity import tf_idf_similarity
from backend.ai.similarity_metrics.llm_embedding_similarity import llm_embedding_similarity


METHODS = {
    "tf-idf": tf_idf_similarity,
    "bm25": bm25_similarity,
    "cosine": llm_embedding_similarity,
}


def top_matches_for_question(question_scores, top_n):
    """
    Picks the top_n routines for one question.
    Returns a dict like {"routine_1": ..., "score_1": ..., "routine_2": ...}.
    """
    best_routines = question_scores.nlargest(top_n)

    matches = {}
    for rank, (routine, score) in enumerate(best_routines.items(), start=1):
        matches[f"routine_{rank}"] = routine
        matches[f"score_{rank}"] = round(score, 3)

    return matches


def top_matches(scores, top_n):
    """
    Turns a questions x routines score table into one row per question,
    with the top_n routines and their scores as columns.
    """
    rows = {}
    for question_id, question_scores in scores.iterrows():
        rows[question_id] = top_matches_for_question(question_scores, top_n)

    return pd.DataFrame.from_dict(rows, orient="index")


def compare_methods(questions, top_1_per_method):
    """
    Puts each method's top-1 routine side by side and marks
    the questions where all methods picked the same routine.
    """
    comparison = questions.copy()
    for method_name, top_1 in top_1_per_method.items():
        comparison[method_name] = top_1

    method_columns = list(top_1_per_method)
    comparison["all_agree"] = comparison[method_columns].nunique(axis=1) == 1

    return comparison


def print_summary(comparison, output_path):
    """
    Prints how often the methods agree, overall and per Tjenestetilbud.
    """
    agreement = comparison["all_agree"].mean()
    agreement_per_service = comparison.groupby(SERVICE_COLUMN)["all_agree"].agg(["count", "mean"])

    print(f"Wrote results for {len(comparison)} questions to {output_path}")
    print(f"All methods agree on top-1 for {agreement:.0%} of questions")
    print("\nAgreement per Tjenestetilbud:")
    print(agreement_per_service.round(2))


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         output_path="data/processed/similarity_results.xlsx",
         top_n=3):
    """
    Builds the corpus once, scores it with every method and writes one sheet
    per method plus a sheet comparing each method's top-1 routine.
    """
    corpus = load_corpus(questions_path, routines_path)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    top_1_per_method = {}
    with pd.ExcelWriter(output_path) as writer:
        for method_name, method in METHODS.items():
            scores = method(corpus)
            matches = corpus.questions.join(top_matches(scores, top_n))
            matches.to_excel(writer, sheet_name=method_name, index_label="Nummer")

            top_1_per_method[method_name] = matches["routine_1"]

        comparison = compare_methods(corpus.questions, top_1_per_method)
        comparison.to_excel(writer, sheet_name="comparison", index_label="Nummer")

    print_summary(comparison, output_path)


if __name__ == "__main__":
    main()
