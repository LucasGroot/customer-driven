import os

import psycopg2.errors
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.db.connection import get_conn
from src.db.create_db import create_tables
from src.review import service
from src.review.router import router


@pytest.fixture(autouse=True)
def clean_tables():
    assert "test" in (os.getenv("DBNAME") or ""), "Tests must run on a test database"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("drop table if exists question_decision, routine_review")
    create_tables()


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_owner_can_be_set_changed_and_cleared():
    service.set_owner("1234-5", "Marit Sandvik")
    assert service.load_review()["owners"] == {"1234-5": "Marit Sandvik"}
    service.set_owner("1234-5", "Lene Fjeld")
    assert service.load_review()["owners"] == {"1234-5": "Lene Fjeld"}
    service.set_owner("1234-5", None)
    assert service.load_review()["owners"] == {}


def test_decisions_are_stored_and_replaced():
    service.decide(["INC1", "INC2"], "discarded", None)
    service.decide(["INC2"], "mapped", "1234-5")
    assert service.load_review()["decisions"] == {
        "INC1": {"kind": "discarded"},
        "INC2": {"kind": "mapped", "routineCode": "1234-5"},
    }


def test_undo_removes_only_the_given_questions():
    service.decide(["INC1", "INC2"], "discarded", None)
    service.undo(["INC1"])
    assert list(service.load_review()["decisions"]) == ["INC2"]


def test_database_refuses_a_mapped_decision_without_routine():
    with pytest.raises(psycopg2.errors.CheckViolation):
        service.decide(["INC1"], "mapped", None)


def test_routes_round_trip(client):
    assert client.put("/api/routines/1234-5/owner", json={"owner": "Marit Sandvik"}).status_code == 204
    body = {"questionIds": ["INC1"], "kind": "mapped", "routineCode": "1234-5"}
    assert client.put("/api/questions/decisions", json=body).status_code == 204
    assert client.get("/api/review").json() == {
        "owners": {"1234-5": "Marit Sandvik"},
        "decisions": {"INC1": {"kind": "mapped", "routineCode": "1234-5"}},
    }
    assert client.post("/api/questions/decisions/undo", json={"questionIds": ["INC1"]}).status_code == 204
    assert client.get("/api/review").json()["decisions"] == {}


def test_routes_reject_bad_input(client):
    mapped_without_routine = {"questionIds": ["INC1"], "kind": "mapped"}
    assert client.put("/api/questions/decisions", json=mapped_without_routine).status_code == 422
    assert client.put("/api/questions/decisions", json={"questionIds": [], "kind": "discarded"}).status_code == 422
    assert client.put("/api/routines/1234-5/owner", json={"owner": ""}).status_code == 422
