import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI
from psycopg2.extras import RealDictCursor

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