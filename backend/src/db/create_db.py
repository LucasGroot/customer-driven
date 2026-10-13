import psycopg2

#TODO : put this into an .env...
conn = psycopg2.connect(dbname="mockup", user="postgres", password="postgres", host="localhost")


def add_type():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create type status as enum ('new', 'under consideration', 'processed');""")
            cur.execute("""create type rights as enum ('admin', 'normal');""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_leader():
    try:
        cur = conn.cursor("""create table leader (
        leader_id int primary key,                  
        name varchar(50),
        surname varchar(50),
        rights rights);""")
        try:
            cur.execute()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_routine():
    try:
        cur = conn.cursor("""create table routine (
        id_routine int primary key,
        routine_title text,
        routine_text text,
        nb_references int,
        routine_status status,
        routine_responsible int references leader,
        );""")
        try:
            cur.execute()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_question():
    try:
        cur = conn.cursor("""create table question (                                                
        question_id int primary key,
        question_title text,
        question_date date,
        best_answer int references routine
        );""")
        try:
            cur.execute()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_settings():
    try:
        cur = conn.cursor("""create table settings (
        leader_id int primary key references leader,
        setting_low int,
        setting_medium int,
        setting_good int);""")
        try:
            cur.execute()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_question_theme():
    try:
        cur = conn.cursor("""create table question_theme (
        question_id int references routine,
        question_tags text,
        primary key (question_id, question_tags)
        );""")
        try:
            cur.execute()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_routine_theme():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table routine_theme (
        routine_id int references routine,
        routine_tags text,
        primary key (routine_id, routine_tags)
        );""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
