"""
This file takes questions and routines and implements 3 similarity scoring methods:

tf-idf, bm25 and cosine similarity of LLM embeddings
"""

import os
import numpy as np
import pandas as pd
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
from sentence_transformers import SentenceTransformer

from chunker import chunk_by_headings


def extract_all_chunk_embeddings(folder_path="data/raw/kvaliteket", chunker=chunk_by_headings):
    """
    Reads every PDF in a folder and splits it into chunks using the given chunker.
    Returns a list of {"filename": str, "chunks": list[str]} entries, one per PDF.
    """

    all_chunks = []
    for pdf_file in os.listdir(folder_path):
        if not pdf_file.endswith(".pdf"):
            continue
        chunks = chunker(os.path.join(folder_path, pdf_file))
        all_chunks.append({"filename": pdf_file, "chunks": chunks})

    return all_chunks


def extract_questions(xlsx_path, sheet=0, column="Beskrivelse"):
    """
    Reads a column of questions from an xlsx file, dropping empty rows.
    Returns the questions as a list of strings.
    """

    df = pd.read_excel(xlsx_path, sheet_name=sheet)
    questions = df[column].dropna().astype(str).tolist()

    return questions


def build_index(questions_path, routines_path):
    """
    Loads questions and routines, combining each routine's chunks into one document.
    Shared by tf_idf_similarity and bm25_similarity, which both score on full documents.
    Returns (questions, routine_names, routine_texts).
    """

    questions = extract_questions(questions_path)
    routine_chunks = extract_all_chunk_embeddings(routines_path)
    routine_names = [r["filename"] for r in routine_chunks]
    routine_texts = [" ".join(c["text"] for c in r["chunks"]) for r in routine_chunks]

    return questions, routine_names, routine_texts


def tf_idf_similarity(questions_path, routines_path):
    """
    Scores each question against each routine using tf-idf cosine similarity.
    The vectorizer is fit on routine documents, then questions are transformed
    into the same vocabulary so both sides are directly comparable.
    Returns a DataFrame of shape questions x routines.
    """

    questions, routine_names, routine_texts = build_index(questions_path, routines_path)

    vectorizer = TfidfVectorizer()
    routine_matrix = vectorizer.fit_transform(routine_texts)
    question_matrix = vectorizer.transform(questions)
    scores = sk_cosine_similarity(question_matrix, routine_matrix)

    return pd.DataFrame(scores, index=questions, columns=routine_names)


def bm25_similarity(questions_path, routines_path):
    """
    Scores each question against each routine using BM25 over full documents.
    Returns a DataFrame of shape questions x routines.
    """

    questions, routine_names, routine_texts = build_index(questions_path, routines_path)

    tokenized_routines = [text.lower().split() for text in routine_texts]
    bm25 = BM25Okapi(tokenized_routines)
    scores = [bm25.get_scores(q.lower().split()) for q in questions]

    return pd.DataFrame(scores, index=questions, columns=routine_names)


def cosine_similarity(questions_path, routines_path,
                       model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"):
    """
    Scores each question against each routine using embedding cosine similarity.
    Each chunk is embedded and scored individually, then a routine's score is
    the average across its chunks, rather than embedding one merged document.
    Returns a DataFrame of shape questions x routines.
    """

    questions = extract_questions(questions_path)
    routine_chunks = extract_all_chunk_embeddings(routines_path)
    routine_names = [r["filename"] for r in routine_chunks]

    model = SentenceTransformer(model_name)
    question_embeddings = model.encode(questions, normalize_embeddings=True)

    chunk_counts = [len(r["chunks"]) for r in routine_chunks]
    all_chunk_texts = [c["text"] for r in routine_chunks for c in r["chunks"]]
    chunk_embeddings = model.encode(all_chunk_texts, normalize_embeddings=True)
    chunk_scores = question_embeddings @ chunk_embeddings.T

    scores = np.zeros((len(questions), len(routine_names)))
    start = 0
    for i, count in enumerate(chunk_counts):
        scores[:, i] = chunk_scores[:, start:start + count].mean(axis=1)
        start += count

    return pd.DataFrame(scores, index=questions, columns=routine_names)


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


if __name__ == "__main__":
    main()