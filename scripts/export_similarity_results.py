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
from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity


def top_matches(scores, top_n):
    """
    Turns a questions x routines score table into one row per question
    with the top_n routines and their scores as columns.
    """
    rows = {}
    for question_id, row in scores.iterrows():
        best = row.nlargest(top_n)
        rows[question_id] = {
            **{f"routine_{i}": name for i, name in enumerate(best.index, start=1)},
            **{f"score_{i}": round(score, 3) for i, score in enumerate(best.values, start=1)},
        }
    return pd.DataFrame.from_dict(rows, orient="index")


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         output_path="data/processed/similarity_results.xlsx",
         top_n=3):
    """
    Builds the corpus once, scores it with every method and writes one sheet
    per method plus a sheet comparing each method's top-1 routine.
    """
    corpus = load_corpus(questions_path, routines_path)
    methods = {
        "tf-idf": tf_idf_similarity,
        "bm25": bm25_similarity,
        "cosine": cosine_similarity,
    }

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    top_1 = corpus.questions.copy()
    with pd.ExcelWriter(output_path) as writer:
        for name, method in methods.items():
            matches = corpus.questions.join(top_matches(method(corpus), top_n))
            matches.to_excel(writer, sheet_name=name, index_label="Nummer")
            top_1[name] = matches["routine_1"]
        # Shows at a glance where the methods agree or disagree
        top_1["all_agree"] = top_1[list(methods)].nunique(axis=1) == 1
        top_1.to_excel(writer, sheet_name="comparison", index_label="Nummer")

    print(f"Wrote results for {len(corpus.questions)} questions to {output_path}")
    print(f"All methods agree on top-1 for {top_1['all_agree'].mean():.0%} of questions")
    print("\nAgreement per Tjenestetilbud:")
    print(top_1.groupby(SERVICE_COLUMN)["all_agree"].agg(["count", "mean"]).round(2))


if __name__ == "__main__":
    main()
