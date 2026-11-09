from backend.db.connection import get_conn

SCHEMA = """
create table if not exists routine_review (
    routine_id text primary key,
    owner      text not null          -- no row = unprocessed
);
create table if not exists question_decision (
    question_id text primary key,
    kind        text not null check (kind in ('discarded', 'mapped')),
    routine_id  text,
    decided_at  timestamp not null default now(),
    check ((kind = 'mapped') = (routine_id is not null))
);
"""


def create_tables():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA)


if __name__ == "__main__":
    create_tables()