[Project README](../../README.md) › Tests

# Tests

The backend tests, with pytest. The frontend tests sit next to the code in [`frontend/src`](../../frontend/src/README.md) and run with vitest.

```bash
cd backend
python -m pytest                     # everything
python -m pytest tests/unit/api      # one folder
DBNAME=kunnskapsgap_test python -m pytest tests/unit/db
```

The database tests empty their tables, so they refuse to run unless `DBNAME` contains `test`, see [`backend/src/db`](../src/db/README.md).

| Folder | Tests |
|---|---|
| `unit/api` | Sign-in, roles, the audit log and the endpoints, see [`api`](../src/api/README.md) |
| `unit/admin` | Uploads and analysis runs, see [`admin`](../src/admin/README.md) |
| `unit/snapshot` | Building and serving the snapshot, see [`snapshot`](../src/snapshot/README.md) |
| `unit/db` | The review tables and the encrypted snapshot store, see [`db`](../src/db/README.md) and [`review`](../src/review/README.md) |
| `unit/similarity_metrics` | The scoring, see [`similarity_metrics`](../src/ai/README.md#similarity_metrics) |
| `unit/clustering` | Clustering and titles, see [`clustering`](../src/ai/README.md#clustering) |
| `unit/evaluation` | The evaluation metrics, see [`evaluation`](../src/ai/README.md#evaluation) |

New functionality comes with tests. CI runs them on every push to `dev` and `main` and on pull requests to `main`, together with the lint and format checks, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
