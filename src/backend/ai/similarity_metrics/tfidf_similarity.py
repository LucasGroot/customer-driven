from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.ai.similarity_metrics.shared_logic import top_k_per_routine, _check_k, tokenize


def tf_idf_similarity(corpus, k=3):
    """
    Scores each question against each routine using tf-idf cosine similarity.
    The vectorizer is fit on all routine chunks (so idf is computed over chunks),
    then questions are transformed into the same vocabulary. Each chunk is scored
    individually and a routine's score is the mean of its k highest chunk scores.
    Takes an already-built Corpus (see load_corpus). Returns a DataFrame of shape
    questions x routines.
    """

    _check_k(k)

    vectorizer = TfidfVectorizer(tokenizer=tokenize, lowercase=False, token_pattern=None)
    chunk_matrix = vectorizer.fit_transform(corpus.chunk_texts)
    question_matrix = vectorizer.transform(corpus.questions)
    chunk_scores = cosine_similarity(question_matrix, chunk_matrix)

    return top_k_per_routine(chunk_scores, corpus, k)