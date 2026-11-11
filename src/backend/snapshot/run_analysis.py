"""
Runs the whole analysis and writes the snapshot the dashboard reads. Used both
by scripts/build_snapshot.py and by the admin page's "Kjør analyse".
"""

import json
import os
from datetime import date
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity
from backend.ai.similarity_metrics.shared_logic import SIMILARITY_MODEL_NAME, load_corpus
from backend.snapshot.build_snapshot import build_snapshot, questions_needing_review, split_routine_filename
from backend.snapshot.models import snapshot_to_json_dict
from backend.snapshot.question_groups import group_similar_questions, title_groups


def modified_date(path):
    """
    The day a file or folder was last changed, which is when it was uploaded here.
    """

    return date.fromtimestamp(Path(path).stat().st_mtime)


def titled_groups_of(question_ids, embeddings, question_texts, routine_name=None):
    """
    Groups the given questions by what they are about and titles each group.
    embeddings has one row per question in the whole run, indexed by question ID.
    """
    groups = group_similar_questions(question_ids, embeddings.loc[question_ids].to_numpy())

    return title_groups(groups, question_texts, routine_name)


def rrun_analysis(questions_path, routines_path, report_progress=lambda completed_steps: None):
    """
    Scores every question against the routines, groups the questions that need
    review and the questions of each routine by what they are about, titles the
    groups, and writes the resulting snapshot as JSON.
    report_progress gets how many of the dashboard's five run steps are done.
    """
    # The titles come from the LiteLLM proxy, whose address and key are in .env
    load_dotenv()
    corpus = load_corpus(questions_path, routines_path)
    # Reading the questions and reading the routines both happen in load_corpus
    report_progress(2)

    scores = cosine_similarity(corpus)
    report_progress(3)

    question_texts = corpus.questions["text"].to_dict()
    embeddings = pd.DataFrame(
        SentenceTransformer(SIMILARITY_MODEL_NAME).encode(corpus.questions["text"].tolist(), normalize_embeddings=True),
        index=corpus.questions.index,
    )
    review_ids = list(questions_needing_review(scores))
    review_groups = titled_groups_of(review_ids, embeddings, question_texts)
    best_routine_of_matched = scores.drop(index=review_ids).idxmax(axis=1)
    routine_clusters = {
        filename: titled_groups_of(list(question_ids), embeddings, question_texts, split_routine_filename(filename)[1])
        for filename, question_ids in best_routine_of_matched.groupby(best_routine_of_matched).groups.items()
    }
    report_progress(4)

    snapshot = build_snapshot(
        corpus.questions,
        scores,
        last_run=date.today(),
        questions_uploaded=modified_date(questions_path),
        routines_uploaded={
            filename: modified_date(Path(routines_path) / filename)
            for filename in os.listdir(routines_path)
            if filename.endswith(".pdf")
        },
        review_groups=review_groups,
        routine_clusters=routine_clusters,
    )

    # The API reads the file on every request, so it must never see a half-written one
    save_snapshot(snapshot_to_json_dict(snapshot))
    report_progress(5)

    return snapshot
