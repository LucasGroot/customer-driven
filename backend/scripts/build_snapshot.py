"""
Runs the analysis and stores the snapshot the dashboard reads in the database.
The snapshot contains question text, so it is encrypted there. Only counts are
printed here.
The cluster titles are written by the language model behind the LiteLLM proxy
in .env, which is sent the text of a few questions per cluster.
"""

from src.snapshot.run_analysis import run_analysis


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx", routines_path="data/raw/kvaliteket"):
    """
    Runs the analysis on the files in data/raw and prints what was written.
    """
    snapshot = run_analysis(questions_path, routines_path)

    flagged = sum(question.needs_review for question in snapshot.questions)
    print(
        f"Wrote {len(snapshot.questions)} questions ({flagged} for review in {len(snapshot.review_groups)} groups, "
        f"{len(snapshot.routine_clusters)} clusters within the routines) and {len(snapshot.documents)} routines "
        "to the database"
    )


if __name__ == "__main__":
    main()
