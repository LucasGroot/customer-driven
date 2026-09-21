"""
This file takes questions and routines and implements 3 similarity scoring methods:

tf-idf, bm25 and cosine similarity of LLM embeddings

All three methods score at chunk level: every chunk of a routine is scored
against each question, and a routine's score is the mean of its k highest
chunk scores.
"""

import re
from dataclasses import dataclass

import numpy as np
import pandas as pd
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
from sentence_transformers import SentenceTransformer

from chunking.fixed_chunking import DEFAULT_CHUNK_SIZE, chunk_by_fixed_size
from chunking.customized_chunking import chunk_by_layout
from pdf_reader import read_all_pdfs


_TOKEN_RE = re.compile(r"\w+")


def tokenize(text):
    """
    Lowercases and splits on anything that isn't a letter or digit, so
    "timer?" and "timer" match. \\w is unicode-aware, so æ, ø and å are kept.
    Used by both tf-idf and bm25 so they see identical tokens.
    """

    return _TOKEN_RE.findall(text.lower())


@dataclass
class Corpus:
    questions: list
    routine_names: list
    chunk_counts: list
    chunk_texts: list


def extract_all_chunk_embeddings(folder_path="data/raw/kvaliteket", chunker=chunk_by_layout):
    """
    Reads every PDF in a folder and splits it into chunks using the given chunker.
    If the chunker returns no non-blank chunks for a PDF, that PDF is re-chunked
    with chunk_by_fixed_size instead.
    Returns a list of {"filename": str, "chunks": list[str]} entries, one per PDF.
    """
 
    all_chunks = []
    documents = read_all_pdfs(folder_path)
    for document in documents:
        words, source = document["words"], document["source_pdf"]
        chunks = chunker(words, source, max_chunk_size=DEFAULT_CHUNK_SIZE) or []
 
        has_text = any(c["text"].strip() for c in chunks)
        if not has_text and chunker is not chunk_by_fixed_size:
            name = getattr(chunker, "__name__", "chunker")
            print(f"NOTE: {name} returned no chunks for {source}, falling back to chunk_by_fixed_size")
            chunks = chunk_by_fixed_size(words, source, chunk_size=DEFAULT_CHUNK_SIZE) or []
 
        all_chunks.append({"filename": source, "chunks": chunks})
 
    return all_chunks


def extract_questions(xlsx_path, sheet=0, column="Beskrivelse"):
    """
    Reads a column of questions from an xlsx file, dropping empty rows.
    Returns the questions as a list of strings.
    """

    df = pd.read_excel(xlsx_path, sheet_name=sheet)
    questions = df[column].dropna().astype(str).tolist()

    return questions


def load_corpus(questions_path, routines_path, chunker=chunk_by_layout):
    """
    Loads questions and chunks every routine, dropping blank chunks.
    Shared by all three scoring methods so they see exactly the same input.
    Raises ValueError if there are no questions or no usable chunks at all.
    """

    questions = extract_questions(questions_path)
    if not questions:
        raise ValueError(f"No questions found in {questions_path}")

    routine_chunks = extract_all_chunk_embeddings(routines_path, chunker=chunker)
    routine_names = [r["filename"] for r in routine_chunks]
    texts_per_routine = [
        [c["text"] for c in r["chunks"] if c["text"].strip()]
        for r in routine_chunks
    ]
    chunk_counts = [len(texts) for texts in texts_per_routine]
    chunk_texts = [text for texts in texts_per_routine for text in texts]

    if not chunk_texts:
        raise ValueError(f"No non-empty chunks found in {routines_path}")

    return Corpus(questions, routine_names, chunk_counts, chunk_texts)


def _check_k(k):
    if k < 1:
        raise ValueError("k must be at least 1")


def top_k_per_routine(chunk_scores, corpus, k):
    """
    Collapses a (questions x chunks) score matrix into a (questions x routines)
    DataFrame. A routine's score is the mean of its k highest chunk scores.
    Routines with fewer than k chunks average over the chunks they have.
    Routines with no chunks get NaN (and a warning).
    """

    scores = np.full((chunk_scores.shape[0], len(corpus.routine_names)), np.nan)
    start = 0
    for i, count in enumerate(corpus.chunk_counts):
        if count == 0:
            print(f"WARNING: no chunks for {corpus.routine_names[i]}")
        else:
            routine_scores = chunk_scores[:, start:start + count]
            scores[:, i] = np.sort(routine_scores, axis=1)[:, -k:].mean(axis=1)
        start += count

    return pd.DataFrame(scores, index=corpus.questions, columns=corpus.routine_names)


def tf_idf_similarity(questions_path, routines_path, chunker=chunk_by_layout, k=3):
    """
    Scores each question against each routine using tf-idf cosine similarity.
    The vectorizer is fit on all routine chunks (so idf is computed over chunks),
    then questions are transformed into the same vocabulary. Each chunk is scored
    individually and a routine's score is the mean of its k highest chunk scores.
    Returns a DataFrame of shape questions x routines.
    """

    _check_k(k)
    corpus = load_corpus(questions_path, routines_path, chunker)

    vectorizer = TfidfVectorizer(tokenizer=tokenize, lowercase=False, token_pattern=None)
    chunk_matrix = vectorizer.fit_transform(corpus.chunk_texts)
    question_matrix = vectorizer.transform(corpus.questions)
    chunk_scores = sk_cosine_similarity(question_matrix, chunk_matrix)

    return top_k_per_routine(chunk_scores, corpus, k)


def bm25_similarity(questions_path, routines_path, chunker=chunk_by_layout, k=3):
    """
    Scores each question against each routine using BM25 over routine chunks.
    Each chunk is scored individually and a routine's score is the mean of its
    k highest chunk scores. Note that BM25 scores are unbounded, so they are only
    comparable within a method, not against tf-idf or cosine values.
    Returns a DataFrame of shape questions x routines.
    """

    _check_k(k)
    corpus = load_corpus(questions_path, routines_path, chunker)

    bm25 = BM25Okapi([tokenize(text) for text in corpus.chunk_texts])
    chunk_scores = np.vstack([bm25.get_scores(tokenize(q)) for q in corpus.questions])

    return top_k_per_routine(chunk_scores, corpus, k)


def cosine_similarity(questions_path, routines_path,
                       model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
                       chunker=chunk_by_layout,
                       k=3):
    """
    Scores each question against each routine using embedding cosine similarity.
    Each chunk is embedded and scored individually, then a routine's score is
    the mean of its k highest chunk similarities. Routines with fewer than k
    chunks average over all the chunks they have.
    Returns a DataFrame of shape questions x routines.
    """

    _check_k(k)
    corpus = load_corpus(questions_path, routines_path, chunker)

    model = SentenceTransformer(model_name)
    question_embeddings = model.encode(corpus.questions, normalize_embeddings=True)
    chunk_embeddings = model.encode(corpus.chunk_texts, normalize_embeddings=True)
    chunk_scores = question_embeddings @ chunk_embeddings.T

    return top_k_per_routine(chunk_scores, corpus, k)


def main():
    """
    Runs all three similarity methods on the same questions and routines,
    asserts each result has shape questions x routines, and prints the
    top match per question for each method as a sanity check.
    """
 
    questions_path = "data/raw/questions/HR_HMS related questions in ServiceNow january - june 2026.xlsx"
    routines_path = "data/raw/kvaliteket"
 
    num_questions = len(extract_questions(questions_path))
    num_routines = len(extract_all_chunk_embeddings(routines_path))
 
    methods = {
        "tf-idf": tf_idf_similarity,
        "bm25": bm25_similarity,
        "cosine": cosine_similarity,
    }
 
    for name, method in methods.items():
        scores = method(questions_path, routines_path)
        assert scores.shape == (num_questions, num_routines), \
            f"{name}: expected shape {(num_questions, num_routines)}, got {scores.shape}"
        empty = list(scores.columns[scores.isna().any()])
        if empty:
            f"{name}: NaN scores for {empty}"


if __name__ == "__main__":
    main()