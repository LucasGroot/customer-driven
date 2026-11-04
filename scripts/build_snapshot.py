"""
Runs the analysis and writes the snapshot the dashboard reads to
data/processed/snapshot.json. The file contains question text, so it is
gitignored like the other processed data. Only counts are printed here.
"""

from backend.snapshot.run_analysis import run_analysis


def main(questions_path="data/raw/serviceNow/serviceNow_questions.xlsx",
         routines_path="data/raw/kvaliteket",
         output_path="data/processed/snapshot.json"):
    """
    Runs the analysis on the files in data/raw and prints what was written.
    """
    snapshot = run_analysis(questions_path, routines_path, output_path)

    flagged = sum(question.needs_review for question in snapshot.questions)
    print(f"Wrote {len(snapshot.questions)} questions ({flagged} for review in "
          f"{len(snapshot.review_groups)} groups) and {len(snapshot.documents)} routines to {output_path}")


if __name__ == "__main__":
    main()
