from psycopg2.extras import execute_values
from src.db.db import get_conn


def save_analysis(routines, questions, matches, themes):
    with get_conn() as conn, conn.cursor() as cur:
        execute_values(cur, """
            insert into routine (routine_id, routine_title, routine_date)
            values %s
            on conflict (routine_id) do update
              set routine_title = excluded.routine_title,
                  routine_date  = excluded.routine_date
        """, routines)

        execute_values(cur, """
            insert into question (question_id, question_title, question_date, needs_review)
            values %s
            on conflict (question_id) do update
              set question_title = excluded.question_title,
                  needs_review   = excluded.needs_review
        """, questions)

        question_ids = [q[0] for q in questions]
        cur.execute("delete from routine_answer_question where question_id = any(%s)", (question_ids,))
        cur.execute("delete from question_theme where question_id = any(%s)", (question_ids,))

        execute_values(cur, """
            insert into routine_answer_question (routine_id, question_id, similarity)
            values %s
        """, matches)

        execute_values(cur, """
            insert into question_theme (question_id, question_tags)
            values %s
            on conflict do nothing
        """, themes)