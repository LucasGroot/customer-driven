from psycopg2.extras import execute_values

from backend.db.connection import get_conn


def load_review():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select routine_id, owner from routine_review")
        owners = dict(cur.fetchall())
        cur.execute("select question_id, kind, routine_id from question_decision")
        decisions = {
            question_id: {"kind": "discarded"} if kind == "discarded"
            else {"kind": "mapped", "routineCode": routine_id}
            for question_id, kind, routine_id in cur.fetchall()
        }
    return {"owners": owners, "decisions": decisions}


def set_owner(routine_code, owner):
    """owner=None puts the routine back to unprocessed."""
    with get_conn() as conn, conn.cursor() as cur:
        if owner is None:
            cur.execute("delete from routine_review where routine_id = %s", (routine_code,))
        else:
            cur.execute("""
                insert into routine_review (routine_id, owner) values (%s, %s)
                on conflict (routine_id) do update set owner = excluded.owner
            """, (routine_code, owner))


def decide(question_ids, kind, routine_code):
    with get_conn() as conn, conn.cursor() as cur:
        execute_values(cur, """
            insert into question_decision (question_id, kind, routine_id)
            values %s
            on conflict (question_id) do update
              set kind = excluded.kind, routine_id = excluded.routine_id, decided_at = now()
        """, [(q, kind, routine_code) for q in question_ids])


def undo(question_ids):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("delete from question_decision where question_id = any(%s)", (question_ids,))