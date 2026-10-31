"""
Turns the similarity scores into the snapshot the dashboard reads: for every
question the routine that matched best, and whether it matched well enough or
has to be placed by HR. Fields the pipeline cannot produce yet (document
owners, revision dates) get neutral placeholders, so the dashboard still works.
"""

import re
from pathlib import Path

from backend.ai.similarity_metrics.shared_logic import SERVICE_COLUMN
from backend.snapshot.models import AnalysisSnapshot, AskedQuestion, DataSource, ReviewGroup, RoutineDocument


ROUTINE_FILENAME_PATTERN = re.compile(r"^(\d{4}-\d+)-(.+)$")
MAX_QUESTION_CHARACTERS = 500
NO_OWNER = "Ikke tildelt"
UNKNOWN_CATEGORY = "Ukjent"
NORWEGIAN_MONTHS = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
]
NORWEGIAN_MONTHS_SHORT = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"]

# Cosine scores between HR texts never get near 0: with the current embedding model
# every question lands between 0.4 and 0.8, so a threshold like 5 % would send nothing
# to HR. On the ground truth 0.55 is the only level that catches questions without a
# routine (2 of 8) without sending any that have one, at about a quarter of all
# questions. It is a stand-in until an AI model judges each question, because the best
# score barely tells a question without a routine from one with a routine (gap_auc 0.65).
# Set again whenever the embedding model changes.
MIN_RELEVANCE = 0.55


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


def format_short_norwegian_date(day):
    """
    Writes a date the short way a ticket is shown, e.g. "3. sep 2026".
    """

    return f"{day.day}. {NORWEGIAN_MONTHS_SHORT[day.month - 1]} {day.year}"


def one_line(text):
    """
    Puts a question on one line and cuts it short, so a few very long tickets
    cannot make the snapshot huge.
    """

    return " ".join(text.split())[:MAX_QUESTION_CHARACTERS]


def questions_needing_review(scores):
    """
    Returns the IDs of the questions whose best score is under MIN_RELEVANCE.
    scores is the questions x routines table.
    """

    best_score = scores.max(axis=1)

    return best_score.index[best_score < MIN_RELEVANCE]


def build_snapshot(questions, scores, last_run, questions_uploaded, routines_uploaded, review_groups=()):
    """
    Builds the snapshot for one analysis run.
    questions is indexed by question ID with the columns Tjenestetilbud and text,
    and scores is the questions x routines table with the same rows in the same
    order. last_run and questions_uploaded are datetime.date values, and
    routines_uploaded maps the PDF filename of each routine to its date.
    review_groups is a list of groups of question IDs from the questions that need
    review, each with the question that stands for the group first. Questions in
    no group stand alone.
    """

    scores = scores.dropna(axis=1, how="all")
    best_score = scores.max(axis=1)
    best_filename = scores.idxmax(axis=1)
    question_need_review = best_score < MIN_RELEVANCE
    categories = questions[SERVICE_COLUMN].fillna(UNKNOWN_CATEGORY)
    # The export has no creation date for a ticket, so every ticket gets the day it was uploaded
    uploaded = format_short_norwegian_date(questions_uploaded)
    groups = [
        ReviewGroup(id=f"r{number}", heading_question_id=str(member_ids[0]))
        for number, member_ids in enumerate(review_groups)
    ]
    group_of_question = {
        str(question_id): group.id
        for group, member_ids in zip(groups, review_groups)
        for question_id in member_ids
    }

    asked_questions = [
        AskedQuestion(
            id=str(question_id),
            text=one_line(text),
            reference=f"{question_id} · {uploaded}",
            category=category,
            document_code=split_routine_filename(filename)[0],
            coverage=round(float(coverage), 3),
            question_need_review=bool(flagged),
            group_id=group_of_question.get(str(question_id)),
        )
        for question_id, text, category, filename, coverage, flagged in zip(
            questions.index, questions["text"], categories, best_filename, best_score, question_need_review
        )
    ]
    documents = []
    for filename in scores.columns:
        code, name = split_routine_filename(filename)
        uploaded_label = format_short_norwegian_date(routines_uploaded[filename])
        documents.append(RoutineDocument(code=code, name=name, uploaded_label=uploaded_label))

    return AnalysisSnapshot(
        is_example=False,
        document_owners=[NO_OWNER],
        last_run_label=format_norwegian_date(last_run),
        questions=asked_questions,
        review_groups=groups,
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
                uploaded_label=format_norwegian_date(max(routines_uploaded[filename] for filename in scores.columns)),
            ),
        ],
    )
