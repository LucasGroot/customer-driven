import psycopg2

#TODO : put this into an .env...
conn = psycopg2.connect(dbname="mockup2", user="postgres", password="postgres", host="localhost")
conn.autocommit = True

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

def create_leader(conn):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table leader (
        leader_id int primary key,                  
        name varchar(50),
        surname varchar(50),
        rights rights);""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_routine():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table routine (
        routine_id varchar(6) primary key, -- XXXX-X
        routine_title text,
        routine_status status,
        routine_date    date,
        routine_responsible int references leader
        );""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_question():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table question (                                                
        question_id varchar(10) primary key, --INCXXXXXXX ?
        question_title text,
        question_summary text,
        question_text text,
        question_date date
        );""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_settings():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table settings (
        leader_id int primary key references leader,
        setting_low int,
        setting_medium int,
        setting_good int);""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def create_question_theme():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""create table question_theme (
        question_id varchar(10) references routine,
        question_tags text,
        primary key (question_id, question_tags)
        );""")
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



if __name__ == "__main__":
    #add_type()
    #create_leader(conn)
    #create_routine()
    #create_question()
    create_settings()
    #create_question_theme()
    #create_routine_theme()
    #create_routine_answer_question()