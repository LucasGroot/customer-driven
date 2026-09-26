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

from backend.ai.chunking.fixed_chunking import DEFAULT_CHUNK_SIZE
from backend.ai.chunking.customized_chunking import chunk_by_layout
from backend.ai.pdf_reader import read_all_pdfs


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
    Reads and chunks the PDFs exactly once; the resulting Corpus is shared by
    all three scoring methods so they see exactly the same input.
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

    empty_routines = [
        name for name, count in zip(routine_names, chunk_counts) if count == 0
    ]

    if empty_routines:
        print(f"WARNING: no usable text extracted from {len(empty_routines)} document(s):")
        for name in empty_routines:
            print(f"  - {name}")


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
        if count > 0:
            routine_scores = chunk_scores[:, start:start + count]
            scores[:, i] = np.sort(routine_scores, axis=1)[:, -k:].mean(axis=1)
        start += count

    return pd.DataFrame(scores, index=corpus.questions, columns=corpus.routine_names)