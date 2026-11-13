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

create table if not exists snapshot (
    id         bigserial primary key,
    created_at timestamptz not null default now(),
    payload    bytea not null            -- JSON encrypted
);

create or replace function forbid_snapshot_change() returns trigger as $$
begin
    raise exception 'snapshot is append-only';
end;
$$ language plpgsql;

drop trigger if exists snapshot_append_only on snapshot;
create trigger snapshot_append_only
    before update or delete on snapshot
    for each row execute function forbid_snapshot_change();

drop trigger if exists snapshot_no_truncate on snapshot;
create trigger snapshot_no_truncate
    before truncate on snapshot
    for each statement execute function forbid_snapshot_change();


-- MIGRATION : IF THE OWNER HAS ANOTHER ROLE THAN THE API
-- revoke all on snapshot from app_role;
-- grant select, insert on snapshot to app_role;
-- grant usage on sequence snapshot_id_seq to app_role;
"""


def create_tables():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA)


if __name__ == "__main__":
    create_tables()