"""
Turns the similarity scores into the snapshot the dashboard reads: for every
question the routine that matched best, and whether it matched well enough or
has to be placed by HR. Fields the pipeline cannot produce yet (document
owners, revision dates) get neutral placeholders, so the dashboard still works.
"""

import re
from pathlib import Path

from backend.ai.similarity_metrics.shared_logic import SERVICE_COLUMN
from backend.snapshot.models import AnalysisSnapshot, AskedQuestion, DataSource, RoutineDocument


ROUTINE_FILENAME_PATTERN = re.compile(r"^(\d{4}-\d+)-(.+)$")
MAX_QUESTION_CHARACTERS = 500
NO_OWNER = "Ikke tildelt"
UNKNOWN_CATEGORY = "Ukjent"
NORWEGIAN_MONTHS = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
]

# Cosine scores between HR texts never get near 0: every question lands between
# 0.3 and 0.85, so a threshold like 5 % would send nothing to HR. This one sits at
# the low end of that range. It is a stand-in until an AI model judges each question,
# because the best score barely tells a question without a routine from one with
# a routine (gap_auc 0.6-0.7 on the ground truth).
MIN_RELEVANCE = 0.5


def split_routine_filename(filename):
    """
    Splits "1760-1-Vernerunde.pdf" into the document code "1760-1" and the
    name "Vernerunde". Only the first two dashes split, because names can
    contain dashes themselves. A file that does not follow the pattern keeps
    its whole name as both code and name.
    """

    stem = Path(filename).stem
    match = ROUTINE_FILENAME_PATTERN.match(stem)
    if match is None:
        return stem, stem

    return match.group(1), match.group(2)


def format_norwegian_date(day):
    """
    Writes a date the way the dashboard shows it, e.g. "3. september 2026".
    """

    return f"{day.day}. {NORWEGIAN_MONTHS[day.month - 1]} {day.year}"


def one_line(text):
    """
    Puts a question on one line and cuts it short, so a few very long tickets
    cannot make the snapshot huge.
    """

    return " ".join(text.split())[:MAX_QUESTION_CHARACTERS]


def build_snapshot(questions, scores, last_run, questions_uploaded, routines_uploaded):
    """
    Builds the snapshot for one analysis run.
    questions is indexed by question ID with the columns Tjenestetilbud and text,
    and scores is the questions x routines table with the same rows in the same
    order. The three dates are datetime.date values.
    """

    scores = scores.dropna(axis=1, how="all")
    best_score = scores.max(axis=1)
    best_filename = scores.idxmax(axis=1)
    needs_review = best_score < MIN_RELEVANCE
    categories = questions[SERVICE_COLUMN].fillna(UNKNOWN_CATEGORY)

    asked_questions = [
        AskedQuestion(
            id=str(question_id),
            text=one_line(text),
            reference=str(question_id),
            category=category,
            document_code=split_routine_filename(filename)[0],
            coverage=round(float(coverage), 3),
            needs_review=bool(flagged),
        )
        for question_id, text, category, filename, coverage, flagged in zip(
            questions.index, questions["text"], categories, best_filename, best_score, needs_review
        )
    ]
    documents = [
        RoutineDocument(code=code, name=name, revised_label="")
        for code, name in map(split_routine_filename, scores.columns)
    ]

    return AnalysisSnapshot(
        is_example=False,
        document_owners=[NO_OWNER],
        last_run_label=format_norwegian_date(last_run),
        questions=asked_questions,
        documents=documents,
        sources=[
            DataSource(
                name="ServiceNow-henvendelser",
                count=len(questions),
                unit="henvendelser",
                uploaded_label=format_norwegian_date(questions_uploaded),
            ),
            DataSource(
                name="Kvaliteket-rutiner",
                count=len(documents),
                unit="PDF-er",
                uploaded_label=format_norwegian_date(routines_uploaded),
            ),
        ],
    )
