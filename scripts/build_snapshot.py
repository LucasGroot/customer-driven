"""
Runs the analysis and writes the snapshot the dashboard reads to
data/processed/snapshot.json. The file contains question text, so it is
gitignored like the other processed data. Only counts are printed here.
"""

import json
from datetime import date
from pathlib import Path

from backend.ai.similarity_metrics.cosine_similarity import cosine_similarity
from backend.ai.similarity_metrics.shared_logic import load_corpus
from backend.snapshot.build_snapshot import build_snapshot
from backend.snapshot.models import snapshot_to_json_dict


def modified_date(path):
    """
    The day a file or folder was last changed, which is when it was uploaded here.
    """

    return date.fromtimestamp(Path(path).stat().st_mtime)


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         output_path="data/processed/snapshot.json"):
    """
    Scores every question against the routines and writes the resulting snapshot as JSON.
    """
    corpus = load_corpus(questions_path, routines_path)
    scores = cosine_similarity(corpus)

    snapshot = build_snapshot(
        corpus.questions,
        scores,
        last_run=date.today(),
        questions_uploaded=modified_date(questions_path),
        routines_uploaded=modified_date(routines_path),
    )

    Path(output_path).write_text(json.dumps(snapshot_to_json_dict(snapshot), ensure_ascii=False), encoding="utf-8")
    flagged = sum(question.needs_review for question in snapshot.questions)
    print(f"Wrote {len(snapshot.questions)} questions ({flagged} for review) and "
          f"{len(snapshot.documents)} routines to {output_path}")


if __name__ == "__main__":
    main()
