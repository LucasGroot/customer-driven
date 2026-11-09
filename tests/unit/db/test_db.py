import pytest
import psycopg2
from dotenv import load_dotenv
import os
import datetime

from src.backend.db.create_db import *
from src.backend.db.mockup import *
from src.backend.db.get_info import *
from src.backend.db.review_service import *

load_dotenv()
dbname = os.getenv('DBNAME')
user = os.getenv('DBUSER')
password = os.getenv('DBPASSWORD')
host = os.getenv('DBHOST')
conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host)
conn.autocommit = True

EXPECTED_TABLES = [
    "leader", "routine", "question", "settings", "question_theme",
    "routine_theme", "routine_answer_question", "question_decision",
]

@pytest.mark.order(1)
def test_creation():
    cur = conn.cursor()
    cur.execute("drop schema public cascade; create schema public;")  # repart de zéro, y compris les types

    add_type()
    create_leader()
    create_routine()
    create_question()
    create_settings()
    create_question_theme()
    create_routine_theme()
    create_routine_answer_question()
    create_question_decision()

    for table in EXPECTED_TABLES:
        cur.execute("select to_regclass(%s)", (f"public.{table}",))
        assert cur.fetchone()[0] is not None, f"Tabellen {table} ble ikke opprettet"

@pytest.mark.order(2)
def test_insertion():
    try:
        add_leader()
        add_routine()
        add_settings()
        add_question()
        add_theme()
        add_answer()
        add_decision()
    except Exception:
        pytest.fail("Unexpected exception")

@pytest.mark.order(3)
def test_question():
    assert(select_question("INC1234567") == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2), False)])
    assert(select_question_after_date('2026-08-31') == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2), False)])
    assert(select_question_before_date('2026-08-31') == [('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28), False)])
    assert(select_question_in_date_order() == [('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28), False), ('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2), False)])
    assert(select_question_in_last_date_order() == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2), False), ('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28), False)])

@pytest.mark.order(4)
def test_routine():
    assert(select_routine('6789-0') == [('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)])
    assert(select_routine_after_date('2026-09-04') == [('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)])
    assert(select_routine_before_date('2026-09-04') == [('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1)])
    assert(select_routine_in_date_order() == [('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1), ('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)])
    assert(select_routine_in_last_date_order() == [('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0), ('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1)])
    assert(repartion_routine_status() == (1, 1, 0))

@pytest.mark.order(5)
def test_theme():
    assert(select_question_on_theme('bananas') == [('INC1234567',)])
    assert(select_question_on_theme('uke') == [('INC1234568',)])
    assert(select_question_on_theme('barna') == [])

@pytest.mark.order(6)
def test_answer():
    assert(select_similarity_under_x(0.5) == [('6789-0', 'INC1234567', 0.1)])
    assert(select_similarity_between_x_and_y(0.4, 0.6) == [('6789-0', 'INC1234568', 0.5)])
    assert(select_similarity_over_x(0.6) == [('1234-5', 'INC1234567', 0.7)])

@pytest.mark.order(7)
def test_set_status():
    with pytest.raises(Exception):
        set_status('6789-0', 'processed')
    set_status('6789-0', 'done')
    assert(select_routine_on_status('processed') == [('6789-0', 'Overføring av ferie til neste år', 'processed', datetime.date(2026, 10, 10), 0)])

@pytest.mark.order(8)
def test_set_owner():
    set_owner('1234-5', 'Marit Sandvik')
    assert(get_routine_owner('1234-5') == [(1,)])

@pytest.mark.order(9)
def test_decide():
    decide(['INC1234568'], 'mapped', '6789-0')
    rows = [r[:3] for r in get_decision()]
    assert ('INC1234568', 'mapped', '6789-0') in rows

@pytest.mark.order(10)
def test_undo():
    undo(['INC1234568'])
    rows = [r[:3] for r in get_decision()]
    assert rows == [('INC1234567', 'mapped', '1234-5')]