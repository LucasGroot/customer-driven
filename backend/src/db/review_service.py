from psycopg2.extras import RealDictCursor, execute_values
from src.db.db import get_conn

STATUS_TO_DB = {"new": "new", "updating": "under consideration", "done": "processed"}
STATUS_FROM_DB = {db: front for front, db in STATUS_TO_DB.items()}
UNASSIGNED = "Ikke tildelt"


def load_review():
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            select r.routine_id, r.routine_status, l.name, l.surname
            from routine r
            left join leader l on l.leader_id = r.routine_responsible
        """)
        statuses, owners = {}, {}
        for row in cur.fetchall():
            if row["routine_status"]:
                statuses[row["routine_id"]] = STATUS_FROM_DB[row["routine_status"]]
            if row["name"]:
                owner = f"{row['name']} {row['surname']}"
                if owner != UNASSIGNED:
                    owners[row["routine_id"]] = owner

        cur.execute("select question_id, kind, routine_id from question_decision")
        decisions = {
            row["question_id"]: (
                {"kind": "discarded"}
                if row["kind"] == "discarded"
                else {"kind": "mapped", "routineCode": row["routine_id"]}
            )
            for row in cur.fetchall()
        }
    return {"statuses": statuses, "owners": owners, "decisions": decisions}


def set_status(routine_code, status):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "update routine set routine_status = %s::status where routine_id = %s",
            (STATUS_TO_DB[status], routine_code),
        )
        if cur.rowcount == 0:
            raise LookupError(f"Ukjent rutine: {routine_code}")


def set_owner(routine_code, owner):
    with get_conn() as conn, conn.cursor() as cur:
        leader_id = None
        if owner != UNASSIGNED:
            cur.execute("select leader_id from leader where name || ' ' || surname = %s", (owner,))
            row = cur.fetchone()
            if row is None:
                raise LookupError(f"Ukjent ansvarlig: {owner}")
            leader_id = row[0]
        cur.execute(
            "update routine set routine_responsible = %s where routine_id = %s",
            (leader_id, routine_code),
        )
        if cur.rowcount == 0:
            raise LookupError(f"Ukjent rutine: {routine_code}")


def decide(question_ids, kind, routine_code):
    with get_conn() as conn, conn.cursor() as cur:
        execute_values(cur, """
            insert into question_decision (question_id, kind, routine_id)
            values %s
            on conflict (question_id) do update
              set kind = excluded.kind,
                  routine_id = excluded.routine_id,
                  decided_at = now()
        """, [(q, kind, routine_code) for q in question_ids])


def undo(question_ids):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("delete from question_decision where question_id = any(%s)", (question_ids,))