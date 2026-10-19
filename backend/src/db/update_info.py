import psycopg2

#TODO : put this into an .env...
conn = psycopg2.connect(dbname="mockup", user="postgres", password="postgres", host="localhost")


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

def delete_question_from_raq(question_to_delete):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""delete from routine_answer_question 
                where question_id = %s ;""",
                (question_to_delete))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)


def delete_question(question_to_delete):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""delete from question 
                where question_id = %s ;""",
                (question_to_delete))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

#########################################################################################################
#                                                                                                       #
#                                             ROUTINE                                                   #
#                                                                                                       #
#########################################################################################################


def update_routine_status(new_status, routine_to_update):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""update routine
                set routine_status = %s
                where id_routine = %s ;""",
                (new_status, routine_to_update))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)


def delete_routine_from_raq(routine_to_delete):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""delete from routine_answer_question 
                where routine_id = %s ;""",
                (routine_to_delete))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)


def delete_routine(routine_to_delete):
    try:
        cur = conn.cursor()
        try:
            cur.execute("""delete from routine 
                where routine_id = %s ;""",
                (routine_to_delete))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
