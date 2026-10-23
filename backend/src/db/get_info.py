import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
dbname = os.getenv('DBNAME')
user = os.getenv('DBUSER')
password = os.getenv('DBPASSWORD')
host = os.getenv('DBHOST')
conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host)


#####
# question
# routine
# other
####


#########################################################################################################
#                                                                                                       #
#                                            QUESTION                                                   #
#                                                                                                       #
#########################################################################################################

def select_question(question_id):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            where question_id = %s
        ;""", (question_id,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []



def select_question_on_theme(question_theme):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            where question_theme = %s
        ;""", (question_theme,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_question_before_date(date):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            where question_date < %s
        ;""", (date,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_question_after_date(date):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            where question_date > %s
        ;""", (date,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_question_in_date_order():
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            order by question_date
        ;""")
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_question_in_last_date_order():
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from question
            order by question_date desc
        ;""")
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


#########################################################################################################
#                                                                                                       #
#                                             ROUTINE                                                   #
#                                                                                                       #
#########################################################################################################

def select_routine(routine_id):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where routine_id = %s
        ;""", (routine_id,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_on_theme(routine_theme):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where routine_theme = %s
        ;""", (routine_theme,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_on_status(routine_status):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where routine_status = %s
        ;""", (routine_status,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_before_date(date):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where routine_date < %s
        ;""", (date,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_after_date(date):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where routine_date > %s
        ;""", (date,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []



def select_routine_in_date_order():
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            order by routine_date
        ;""")
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_in_last_date_order():
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            order by routine_date desc
        ;""")
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []




def select_routine_under_x(x):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where XX < %s
        ;""", (x,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_over_x(x):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where XX > %s
        ;""", (x,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def select_routine_between_x_and_y(x, y):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select * from routine
            where XX > %s and XX < %s
        ;""", (x, y))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def count_routine_status(status):
    try:
        cur = conn.cursor()
        try:
            cur.execute(""" select count(routine_status)
            from routine
            where routine_status = %s
        ;""", (status,))
            return cur.fetchall()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            return []
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return []


def repartion_routine_status():
    new_status = count_routine_status('new')
    uc_statut = count_routine_status('under consideration')
    processed_status = count_routine_status('processed')
    if new_status == [] or uc_statut == [] or processed_status == []:
        return (0,0,0)
    else :
        return (new_status[0][0], uc_statut[0][0], processed_status[0][0])




#########################################################################################################
#                                                                                                       #
#                                             OTHER                                                   #
#                                                                                                       #
#########################################################################################################
