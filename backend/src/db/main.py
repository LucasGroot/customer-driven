import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI
from psycopg2.extras import RealDictCursor
from psycopg2.extras import execute_values
from db import get_conn
import threading
from fastapi import BackgroundTasks, HTTPException
from analysis_service import save_analysis
from ai_adapter import run_ai

_lock = threading.Lock()
_state = {"status": "idle", "completedSteps": 0, "error": None}


load_dotenv()
app = FastAPI()

MONTHS = ["jan", "feb", "mar", "apr", "mai", "jun",
          "jul", "aug", "sep", "okt", "nov", "des"]

def label(d) -> str:
    return f"{d.day}. {MONTHS[d.month - 1]} {d.year}" if d else ""

@contextmanager
def db():
    conn = psycopg2.connect(
        dbname=os.getenv("DBNAME"), user=os.getenv("DBUSER"),
        password=os.getenv("DBPASSWORD"), host=os.getenv("DBHOST"),
    )
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
    finally:
        conn.close()

@app.get("/api/snapshot")
def snapshot():
    with db() as cur:
        cur.execute("select routine_id, routine_title, routine_date from routine "
                    "order by routine_date")
        routines = cur.fetchall()

        # une ligne par question : la routine avec la meilleure similarité
        cur.execute("""
    select distinct on (q.question_id)
           q.question_id, q.question_title, q.question_date,
           q.question_needs_review,
           a.routine_id, a.similarity,
           coalesce(t.tags, '') as category
    from question q
    join routine_answer_question a using (question_id)
    left join (
        select question_id,
               string_agg(question_tags, ', ' order by question_tags) as tags
        from question_theme
        group by question_id
    ) t using (question_id)
    order by q.question_id, a.similarity desc
""")
        questions = cur.fetchall()

        cur.execute("select name, surname from leader")
        leaders = cur.fetchall()

    return {
        "isExample": False,
        "documentOwners": [f"{l['name']} {l['surname']}" for l in leaders],
        "lastRunLabel": label(max((q["question_date"] for q in questions if q["question_date"]),
                                  default=None)),
        "documents": [
            {"code": r["routine_id"], "name": r["routine_title"],
             "uploadedLabel": label(r["routine_date"])}
            for r in routines
        ],
        "questions": [
            {
                "id": q["question_id"],
                "text": q["question_title"],
                "reference": f"{q['question_id']} · {label(q['question_date'])}",
                "category": q["category"] or "",
                "documentCode": q["routine_id"],
                "coverage": q["similarity"] or 0,
                "needsReview": bool(q["needs_review"]),
            }
            for q in questions
        ],
        "reviewGroups": [],
        "sources": [
            {"name": "ServiceNow", "count": len(questions),
             "unit": "henvendelser", "uploadedLabel": ""},
            {"name": "Kvaliteket", "count": len(routines),
             "unit": "PDF-er", "uploadedLabel": ""},
        ],
    }



def save_analysis(routines, questions, matches):
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

        execute_values(cur, """
            insert into routine_answer_question (routine_id, question_id, similarity)
            values %s
            on conflict (routine_id, question_id) do update
              set similarity = excluded.similarity
        """, matches)



_lock = threading.Lock()
_state = {"status": "idle", "completedSteps": 0, "error": None}

def _set(**changes):
    with _lock:
        _state.update(changes)

def _job():
    try:
        routines, questions, matches = run_ai(lambda n: _set(completedSteps=n))
        save_analysis(routines, questions, matches)   # étape 5 : calcul + écriture
        _set(status="done", completedSteps=5)
    except Exception as e:
        _set(status="error", error=str(e))

@app.post("/api/analysis/run", status_code=202)
def run_analysis(background: BackgroundTasks):
    with _lock:
        if _state["status"] == "running":
            raise HTTPException(409, "Une analyse est déjà en cours")
        _state.update(status="running", completedSteps=0, error=None)
    background.add_task(_job)
    return {"status": "running"}

@app.get("/api/analysis/status")
def analysis_status():
    with _lock:
        return dict(_state)