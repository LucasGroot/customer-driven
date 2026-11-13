[Project README](../../../README.md) › [Backend](../../README.md) › snapshot

# snapshot

The snapshot is one analysis run in the shape the dashboard reads: every question, the routines, and which routine each question matched best. This package builds it and serves it.

| File | What it does |
|---|---|
| [`run_analysis.py`](run_analysis.py) | Runs the whole analysis and stores the snapshot. Used by [`backend/scripts/build_snapshot.py`](../../scripts/build_snapshot.py) and by "Kjør analyse" |
| [`build_snapshot.py`](build_snapshot.py) | Turns similarity scores into the snapshot. A question whose best score is under `MIN_RELEVANCE` is flagged for HR to place by hand |
| [`question_groups.py`](question_groups.py) | Groups questions that are about the same thing and gives each group a title |
| [`models.py`](models.py) | The shape of a snapshot. It mirrors [`frontend/src/domain/types.ts`](../../../frontend/src/domain/types.ts), so a field added in one has to be added in the other |
| [`router.py`](router.py) | `GET /api/snapshot`: the newest stored snapshot, or the bundled `sample_snapshot.json` of invented data when none exists (the `X-Snapshot-Source` header says which) |

The scores come from [`ai/`](../ai/README.md). The snapshot is stored encrypted by [`db/`](../db/README.md), because it contains question text. Tests: [`backend/tests/unit/snapshot`](../../tests/unit/snapshot).
