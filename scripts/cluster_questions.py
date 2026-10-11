"""
Clusters the ServiceNow questions into themes and prints how they came out.
Only question IDs and counts are printed, never the question text; look the
central questions up in the export to read what each theme is about.
"""

import numpy as np
from sentence_transformers import SentenceTransformer

from backend.ai.clustering.question_clustering import (
    NOISE_LABEL,
    central_question_per_cluster,
    cluster_questions,
    themes_per_question,
)
from backend.ai.similarity_metrics.shared_logic import SERVICE_COLUMN, extract_questions


MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
TOP_THEMES_SHOWN = 10


def print_summary(questions, labels):
    """
    Prints how many questions fell into a theme and the size of the themes.
    """
    theme_sizes = np.bincount(labels[labels != NOISE_LABEL])
    noise_share = (labels == NOISE_LABEL).mean()

    print(f"{len(questions)} questions -> {len(theme_sizes)} themes, {noise_share:.0%} outside any theme")
    print(f"theme size: median {np.median(theme_sizes):.0f}, largest {theme_sizes.max()}")


def print_overlap(memberships):
    """
    Prints how many questions are also relevant for other themes than their own.
    """
    placed = [themes for themes in memberships if themes]
    with_other_themes = sum(len(themes) > 1 for themes in placed)

    print(f"{with_other_themes} of {len(placed)} placed questions are also relevant for another theme")


def print_largest_themes(questions, labels, central_rows):
    """
    Prints the largest themes with the ID of their central question.
    """
    theme_sizes = np.bincount(labels[labels != NOISE_LABEL])

    print(f"\nlargest themes (size | central question ID | {SERVICE_COLUMN}):")
    for label in np.argsort(theme_sizes)[::-1][:TOP_THEMES_SHOWN]:
        central_row = central_rows[int(label)]
        print(f"  {theme_sizes[label]:3d} | {questions.index[central_row]} | {questions[SERVICE_COLUMN].iloc[central_row]}")


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx"):
    """
    Embeds the questions, clusters them all together and prints the result.
    """
    questions = extract_questions(questions_path)
    embeddings = SentenceTransformer(MODEL_NAME).encode(questions["text"].tolist(), normalize_embeddings=True)

    labels = cluster_questions(embeddings)
    central_rows = central_question_per_cluster(embeddings, labels)

    print_summary(questions, labels)
    print_overlap(themes_per_question(embeddings, labels))
    print_largest_themes(questions, labels, central_rows)


if __name__ == "__main__":
    main()
