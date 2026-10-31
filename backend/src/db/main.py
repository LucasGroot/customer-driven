import os
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
import threading


from fastapi import BackgroundTasks, HTTPException
from src.db.analysis_service import save_analysis
from src.db.ai_adapter import run_ai
from src.db import review_service


_lock = threading.Lock()
_state = {"status": "idle", "completedSteps": 0, "error": None}

load_dotenv()
app = FastAPI()

MONTHS = ["jan", "feb", "mar", "apr", "mai", "jun",
          "jul", "aug", "sep", "okt", "nov", "des"]


class StatusBody(BaseModel):
    status: Literal["new", "updating", "done"]

class OwnerBody(BaseModel):
    owner: str

class DecisionBody(BaseModel):
    questionIds: list[str]
    kind: Literal["discarded", "mapped"]
    routineCode: str | None = None

class UndoBody(BaseModel):
    questionIds: list[str]


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
           q.question_need_review,
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
                "needsReview": bool(q["question_need_review"]),
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

def _set(**changes):
    with _lock:
        _state.update(changes)

def _job():
    try:
        routines, questions, matches, themes = run_ai(lambda n: _set(completedSteps=n))
        save_analysis(routines, questions, matches, themes)
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


@app.get("/api/review")
def get_review():
    return review_service.load_review()


@app.put("/api/routines/{routine_code}/status", status_code=204)
def put_status(routine_code: str, body: StatusBody):
    try:
        review_service.set_status(routine_code, body.status)
    except LookupError as e:
        raise HTTPException(404, str(e))


@app.put("/api/routines/{routine_code}/owner", status_code=204)
def put_owner(routine_code: str, body: OwnerBody):
    try:
        review_service.set_owner(routine_code, body.owner)
    except LookupError as e:
        raise HTTPException(404, str(e))


@app.put("/api/questions/decisions", status_code=204)
def put_decisions(body: DecisionBody):
    if (body.kind == "mapped") != (body.routineCode is not None):
        raise HTTPException(422, "routineCode kreves for 'mapped', og er forbudt ellers.")
    try:
        review_service.decide(body.questionIds, body.kind, body.routineCode)
    except psycopg2.errors.ForeignKeyViolation:
        raise HTTPException(400, "Ukjent spørsmål eller rutine.")


@app.post("/api/questions/decisions/undo", status_code=204)
def post_undo(body: UndoBody):
    review_service.undo(body.questionIds)