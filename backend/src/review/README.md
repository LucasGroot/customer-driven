[Project README](../../../README.md) › [Backend](../../README.md) › review

# review

HR's work on top of the snapshot: who owns a routine, and what was decided about each question. The snapshot itself is never changed; the dashboard applies these decisions on top of it.

| File | What it does |
|---|---|
| [`router.py`](router.py) | `GET /api/review`, `PUT /api/routines/{code}/owner`, `PUT /api/questions/decisions` and `POST /api/questions/decisions/undo`. Open to any signed-in user |
| [`service.py`](service.py) | Reads and writes the `routine_review` and `question_decision` tables |

A question is either discarded, or mapped to a routine; undoing removes the decision. A routine without an owner is unprocessed. The tables are created by [`db/create_db.py`](../db/create_db.py). The dashboard side is [`frontend/src/hooks/useRoutineReview.ts`](../../../frontend/src/hooks/useRoutineReview.ts). Tests: [`backend/tests/unit/db/test_review.py`](../../tests/unit/db/test_review.py).
