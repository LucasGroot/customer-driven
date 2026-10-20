"""
Runs the analysis and writes the snapshot the dashboard reads to
data/processed/snapshot.json. The file contains question text, so it is
gitignored like the other processed data. Only counts are printed here.
"""

import json
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


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         output_path="data/processed/snapshot.json"):
    """
    Scores every question against the routines, groups the questions that need
    review by what they are about, and writes the resulting snapshot as JSON.
    """
    corpus = load_corpus(questions_path, routines_path)
    scores = cosine_similarity(corpus)

    review_ids = list(questions_needing_review(scores))
    review_texts = corpus.questions.loc[review_ids, "text"].tolist()
    review_embeddings = SentenceTransformer(SIMILARITY_MODEL_NAME).encode(review_texts, normalize_embeddings=True)

    snapshot = build_snapshot(
        corpus.questions,
        scores,
        last_run=date.today(),
        questions_uploaded=modified_date(questions_path),
        routines_uploaded=modified_date(routines_path),
        review_groups=group_review_questions(review_ids, review_embeddings),
    )

    Path(output_path).write_text(json.dumps(snapshot_to_json_dict(snapshot), ensure_ascii=False), encoding="utf-8")
    flagged = sum(question.needs_review for question in snapshot.questions)
    print(f"Wrote {len(snapshot.questions)} questions ({flagged} for review in "
          f"{len(snapshot.review_groups)} groups) and {len(snapshot.documents)} routines to {output_path}")


if __name__ == "__main__":
    main()
