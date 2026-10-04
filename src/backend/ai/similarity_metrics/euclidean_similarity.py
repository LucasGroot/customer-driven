import numpy as np
from sentence_transformers import SentenceTransformer

from backend.ai.similarity_metrics.shared_logic import top_k_per_routine, _check_k


def euclidean_similarity(corpus,
                       model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
                       k=3):
    """
    Scores each question against each routine using chosen llm embedding similarity.
    Each chunk is embedded and scored individually, then a routine's score is
    the mean of its k highest chunk similarities. Routines with fewer than k
    chunks average over all the chunks they have.
    Takes an already-built Corpus (see load_corpus). Returns a DataFrame of shape
    questions x routines.
    """

    _check_k(k)

    model = SentenceTransformer(model_name)

    question_embeddings = model.encode(corpus.questions["text"].tolist(), normalize_embeddings=False)
    chunk_embeddings = model.encode(corpus.chunk_texts, normalize_embeddings=False)
    # Make euclidean distance negative since instead of cosine lower means better, now higher score is better again
    chunk_scores = -np.linalg.norm(
    question_embeddings[:, None, :] - chunk_embeddings[None, :, :],
    axis=2)

    return top_k_per_routine(chunk_scores, corpus, k)