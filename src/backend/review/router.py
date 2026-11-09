from typing import Literal

from fastapi import APIRouter
from pydantic import Field, model_validator

from backend.review import service
from backend.snapshot.models import CamelCaseModel

router = APIRouter(prefix="/api", tags=["review"])

QuestionIds = list[Field(min_length=1, max_length=50)] if False else list[str]


class OwnerBody(CamelCaseModel):
    owner: str | None = Field(default=None, min_length=1, max_length=200)


class DecisionBody(CamelCaseModel):
    question_ids: list[str] = Field(min_length=1, max_length=1000)
    kind: Literal["discarded", "mapped"]
    routine_code: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def mapped_needs_a_routine(self):
        if (self.kind == "mapped") != (self.routine_code is not None):
            raise ValueError("routineCode is required for 'mapped' and forbidden otherwise")
        return self


class UndoBody(CamelCaseModel):
    question_ids: list[str] = Field(min_length=1, max_length=1000)


@router.get("/review")
def get_review():
    return service.load_review()


@router.put("/routines/{routine_code}/owner", status_code=204)
def put_owner(routine_code: str, body: OwnerBody):
    service.set_owner(routine_code, body.owner)


@router.put("/questions/decisions", status_code=204)
def put_decisions(body: DecisionBody):
    service.decide(body.question_ids, body.kind, body.routine_code)


@router.post("/questions/decisions/undo", status_code=204)
def post_undo(body: UndoBody):
    service.undo(body.question_ids)