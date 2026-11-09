import datetime
import os

import psycopg2
import pytest
from dotenv import load_dotenv

from backend.src.db.create_db import (
    add_type, create_leader, create_routine, create_question, create_settings,
    create_question_theme, create_routine_theme, create_routine_answer_question,
    create_question_decision,
)
from backend.src.db.analysis_service import save_analysis

load_dotenv()
conn = psycopg2.connect(
    dbname=os.getenv("DBNAME"), user=os.getenv("DBUSER"),
    password=os.getenv("DBPASSWORD"), host=os.getenv("DBHOST"),
)
conn.autocommit = True

D = datetime.date

ROUTINES = [
    ("1234-5", "Rutine A", D(2026, 6, 10)),
    ("6789-0", "Rutine B", D(2026, 10, 10)),
]
QUESTIONS = [
    ("INC1", "Spørsmål 1", D(2026, 9, 2), False),
    ("INC2", "Spørsmål 2", D(2026, 9, 3), True),
]
MATCHES = [
    ("1234-5", "INC1", 0.7),
    ("6789-0", "INC1", 0.4),
    ("6789-0", "INC2", 0.3),
]
THEMES = [("INC1", "Ferie"), ("INC2", "Sykefravær")]


def query(sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall() if cur.description else None


@pytest.fixture(autouse=True)
def empty_schema():
    """Every test starts from a freshly created schema. Only run against the test database!"""
    query("drop schema public cascade; create schema public;")
    add_type()
    create_leader()
    create_routine()
    create_question()
    create_settings()
    create_question_theme()
    create_routine_theme()
    create_routine_answer_question()
    create_question_decision()


def count(table):
    return query(f"select count(*) from {table}")[0][0]


def test_writes_everything():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    assert count("routine") == 2
    assert count("question") == 2
    assert count("routine_answer_question") == 3
    assert count("question_theme") == 2
    assert query("select question_need_review from question order by question_id") == [(False,), (True,)]
    assert query(
        "select similarity from routine_answer_question where routine_id='1234-5' and question_id='INC1'"
    ) == [(0.7,)]


def test_running_twice_gives_the_same_result():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    assert count("routine") == 2
    assert count("question") == 2
    assert count("routine_answer_question") == 3
    assert count("question_theme") == 2


def test_new_analysis_keeps_the_work_of_hr():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    # What HR does between two analyses
    query("insert into leader (leader_id, name, surname, rights) values (1, 'Marit', 'Sandvik', 'normal')")
    query("""update routine set routine_status = 'under consideration', routine_responsible = 1
             where routine_id = '1234-5'""")
    query("insert into question_decision (question_id, kind) values ('INC2', 'discarded')")

    renamed = [("1234-5", "Rutine A (ny tittel)", D(2026, 6, 11)), ROUTINES[1]]
    save_analysis(renamed, QUESTIONS, MATCHES, THEMES)

    assert query("select routine_title, routine_date from routine where routine_id = '1234-5'") == [
        ("Rutine A (ny tittel)", D(2026, 6, 11))
    ]
    # The analysis data is updated, the decisions of HR are not touched
    assert query("select routine_status, routine_responsible from routine where routine_id = '1234-5'") == [
        ("under consideration", 1)
    ]
    assert query("select question_id, kind from question_decision") == [("INC2", "discarded")]


def test_old_matches_are_replaced():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    # INC1 is no longer close to Rutine B, and its score for Rutine A has changed
    new_matches = [("1234-5", "INC1", 0.9), ("6789-0", "INC2", 0.3)]
    save_analysis(ROUTINES, QUESTIONS, new_matches, THEMES)

    assert query(
        "select routine_id, question_id, similarity from routine_answer_question order by routine_id, question_id"
    ) == [("1234-5", "INC1", 0.9), ("6789-0", "INC2", 0.3)]


def test_old_themes_are_replaced():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)
    save_analysis(ROUTINES, QUESTIONS, MATCHES, [("INC1", "Permisjon"), ("INC2", "Sykefravær")])

    assert query("select question_tags from question_theme where question_id = 'INC1'") == [("Permisjon",)]


def test_question_keeps_the_date_it_first_appeared():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    later = [(qid, text, D(2026, 12, 1), review) for qid, text, _, review in QUESTIONS]
    save_analysis(ROUTINES, later, MATCHES, THEMES)

    assert query("select question_date from question where question_id = 'INC1'") == [(D(2026, 9, 2),)]


def test_review_flag_follows_the_new_analysis():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    flipped = [("INC1", "Spørsmål 1", D(2026, 9, 2), True), ("INC2", "Spørsmål 2", D(2026, 9, 3), False)]
    save_analysis(ROUTINES, flipped, MATCHES, THEMES)

    assert query("select question_need_review from question order by question_id") == [(True,), (False,)]


def test_failure_leaves_the_database_as_it_was():
    save_analysis(ROUTINES, QUESTIONS, MATCHES, THEMES)

    renamed = [("1234-5", "Skal ikke lagres", D(2026, 6, 10)), ROUTINES[1]]
    bad_matches = [("9999-9", "INC1", 0.5)]  # this routine does not exist -> foreign key violation

    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        save_analysis(renamed, QUESTIONS, bad_matches, THEMES)

    # Nothing from the failed run is visible, including the deletions
    assert query("select routine_title from routine where routine_id = '1234-5'") == [("Rutine A",)]
    assert count("routine_answer_question") == 3
    assert count("question_theme") == 2