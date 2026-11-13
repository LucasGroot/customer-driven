[Project README](../../../README.md) › [Backend](../../README.md) › admin

# admin

What an administrator can do from the dashboard's "Importer data" and "Kjør analyse" pages. [`api/main.py`](../api/main.py) puts `require_admin` on every route here, so the API refuses anyone without the admin role.

| File | What it does |
|---|---|
| [`router.py`](router.py) | The endpoints: `POST /api/admin/import`, `POST /api/admin/analysis` and `GET /api/admin/analysis` for the progress |
| [`uploads.py`](uploads.py) | Checks and saves uploaded files in [`data/raw`](../../../data/raw/README.md). A new ServiceNow export replaces the old one; routines are added, and one that already exists (same document code) is skipped. Nothing is saved if a file fails its checks |
| [`upload_limit.py`](upload_limit.py) | Turns an upload that is too large away before it is read |
| [`analysis_run.py`](analysis_run.py) | Runs the analysis in a background thread, one run at a time, and remembers how far it has come. A restart of the API forgets a run in progress |

A run calls [`snapshot/run_analysis.py`](../snapshot/README.md). Every change to the data, and every refused upload, is written to the audit log in [`api/`](../api/README.md). Tests: [`backend/tests/unit/admin`](../../tests/unit/admin).
