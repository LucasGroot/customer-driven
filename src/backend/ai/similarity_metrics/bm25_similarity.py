import numpy as np
from rank_bm25 import BM25Okapi

from backend.ai.similarity_metrics.shared_logic import _check_k, top_k_per_routine, tokenize

def bm25_similarity(corpus, k=3):
    """
    Scores each question against each routine using BM25 over routine chunks.
    Each chunk is scored individually and a routine's score is the mean of its
    k highest chunk scores. Note that BM25 scores are unbounded, so they are only
    comparable within a method, not against tf-idf or cosine values.
    Takes an already-built Corpus (see load_corpus). Returns a DataFrame of shape
    questions x routines.
    """

    _check_k(k)

    bm25 = BM25Okapi([tokenize(text) for text in corpus.chunk_texts])
    chunk_scores = np.vstack([bm25.get_scores(tokenize(q)) for q in corpus.questions])

    return top_k_per_routine(chunk_scores, corpus, k)