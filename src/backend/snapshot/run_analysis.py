"""
Runs the whole analysis and writes the snapshot the dashboard reads. Used both
by scripts/build_snapshot.py and by the admin page's "Kjør analyse".
"""

import json
import os
from datetime import date
from pathlib import Path

from sentence_transformers import SentenceTransformer

from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity
from backend.ai.similarity_metrics.shared_logic import SIMILARITY_MODEL_NAME, load_corpus
from backend.snapshot.build_snapshot import build_snapshot, questions_needing_review
from backend.snapshot.models import snapshot_to_json_dict
from backend.snapshot.review_groups import group_review_questions


def modified_date(path):
    """
    The day a file or folder was last changed, which is when it was uploaded here.
    """

    return date.fromtimestamp(Path(path).stat().st_mtime)


def run_analysis(questions_path, routines_path, output_path, report_progress=lambda completed_steps: None):
    """
    Scores every question against the routines, groups the questions that need
    review by what they are about, and writes the resulting snapshot as JSON.
    report_progress gets how many of the dashboard's five run steps are done.
    """
    corpus = load_corpus(questions_path, routines_path)
    # Reading the questions and reading the routines both happen in load_corpus
    report_progress(2)

    scores = cosine_similarity(corpus)
    report_progress(3)

    review_ids = list(questions_needing_review(scores))
    review_texts = corpus.questions.loc[review_ids, "text"].tolist()
    review_embeddings = SentenceTransformer(SIMILARITY_MODEL_NAME).encode(review_texts, normalize_embeddings=True)
    review_groups = group_review_questions(review_ids, review_embeddings)
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
    )

    # The API reads the file on every request, so it must never see a half-written one
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(".tmp")
    temporary_path.write_text(json.dumps(snapshot_to_json_dict(snapshot), ensure_ascii=False), encoding="utf-8")
    os.replace(temporary_path, output_path)
    report_progress(5)

    return snapshot
