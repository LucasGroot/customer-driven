import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
dbname = os.getenv('DBNAME')
user = os.getenv('DBUSER')
password = os.getenv('DBPASSWORD')
host = os.getenv('DBHOST')
conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host)
conn.autocommit = True


def add_leader():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into leader values
            (0, 'Ikke', 'tildelt', 'normal'),                                                    
            (1, 'Marit', 'Sandvik', 'admin'),
            (2, 'Lene', 'Fjeld', 'normal')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_settings():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into settings values                                                                 
            (0, 25, 50, 75),
            (1, 30, 60, 80),
            (2, 15, 50, 69)
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_routine():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into routine values 
            ('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', '2026-06-10', 1),
            ('6789-0', 'Overføring av ferie til neste år', 'under consideration', '2026-10-10', 0)

            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_question():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into question values
            ('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', '2026-09-02'),
            ('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', '2026-08-28')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_theme():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into question_theme values
            ('INC1234567', 'bananas'),
            ('INC1234567', 'ferie'),
            ('INC1234568', 'uke')
            ;""")

            cur.execute("""insert into routine_theme values
            ('1234-5', 'ferie'),
            ('6789-0', 'uke')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_answer():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into routine_answer_question values
            ('1234-5', 'INC1234567', 0.7),
            ('6789-0', 'INC1234568', 0.5),
            ('6789-0', 'INC1234567', 0.1)
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)


def add_decision():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into question_decision values
            ('INC1234567', 'mapped', '1234-5', '2026-10-31 16:53:40.28730')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)





if __name__ == "__main__":
    add_leader()
    add_routine()
    add_settings()
    add_question()
    add_theme()
    add_answer()
    add_decision()