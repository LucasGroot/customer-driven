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
        routine_id varchar(6) primary key, -- XXXX-X
        routine_title text,
        routine_status status,
        routine_date    date,
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
        question_id varchar(10) primary key, --INCXXXXXXX ?
        question_title text,
        uestion_summary text,
        uestion_text text,
        question_date date
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
        question_id varchar(10) references routine,
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
        routine_id varchar(6) references routine,
        routine_tags text,
        primary key (routine_id, routine_tags)
        );""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)


def create_routine_answer_question():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table routine_answer_question (
        routine_id varchar(6) references routine,
        question_id varchar(10) references question,
        primary key (routine_id, question_id)
        );""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)