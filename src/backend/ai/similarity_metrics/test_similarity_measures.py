from backend.ai.similarity_metrics.shared_logic import load_corpus
from backend.ai.similarity_metrics.bm25_similarity import bm25_similarity
from backend.ai.similarity_metrics.tfidf_similarity import tf_idf_similarity
from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity

def main(questions_path = "data/raw/questions/HR_HMS related questions in ServiceNow january - june 2026.xlsx",
         routines_path = "data/raw/kvaliteket"):
    """
    Reads the PDFs and builds the corpus once, then runs all three similarity
    methods on that same corpus, asserts each result has shape
    questions x routines, and prints the top match per question for each
    method as a sanity check.
    """

    corpus = load_corpus(questions_path, routines_path)
    num_questions = len(corpus.questions)
    num_routines = len(corpus.routine_names)

    methods = {
        "tf-idf": tf_idf_similarity,
        "bm25": bm25_similarity,
        "cosine": cosine_similarity,
    }

    for name, method in methods.items():
        scores = method(corpus)
        assert scores.shape == (num_questions, num_routines), \
            f"{name}: expected shape {(num_questions, num_routines)}, got {scores.shape}"
        empty = list(scores.columns[scores.isna().any()])
        if empty:
            print(f"{name}: NaN scores for {empty}")


if __name__ == "__main__":
    main()