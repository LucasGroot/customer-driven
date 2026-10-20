import pytest
import psycopg2
from dotenv import load_dotenv
import os
import datetime

from backend.src.db.get_info import *

load_dotenv()
dbname = os.getenv('DBNAME')
user = os.getenv('DBUSER')
password = os.getenv('DBPASSWORD')
host = os.getenv('DBHOST')
conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host)

def test_question():
    assert(select_question("INC1234567") == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2))])
    assert(select_question_after_date('2026-08-31') == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2))])
    assert(select_question_before_date('2026-08-31') == [('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28))])
    assert(select_question_in_date_order() == [('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28)), ('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2))])
    assert(select_question_in_last_date_order() == [('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', datetime.date(2026, 9, 2)), ('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', datetime.date(2026, 8, 28))])

def test_routine():
    assert(select_routine("6789-0"))
    assert(select_routine_after_date('2026-09-04') == [('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)])
    assert(select_routine_before_date('2026-09-04') == [('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1)])
    #assert(select_routine_between_x_and_y('2026-10-01', '2026-10-15') == [('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1), ('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)]) # information not available
    assert(select_routine_in_date_order() == [('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1), ('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0)])
    assert(select_routine_in_last_date_order() == [('6789-0', 'Overføring av ferie til neste år', 'under consideration', datetime.date(2026, 10, 10), 0), ('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', datetime.date(2026, 6, 10), 1)])
    assert(repartion_routine_status() == (1, 1, 0))