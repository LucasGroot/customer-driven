[Project README](../../../README.md) › [Backend](../../README.md) › api

# api

Creates the FastAPI app ([`main.py`](main.py), `create_app`) and decides who may call it.

| File | What it does |
|---|---|
| [`main.py`](main.py) | Builds the app: CORS, the upload size limit, and every router. Run it with `uvicorn src.api.main:create_app --factory --env-file .env` |
| [`config.py`](config.py) | Reads the settings from the environment (`ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ALLOWED_ORIGIN`) and stops the server at startup if one is missing |
| [`auth.py`](auth.py) | Validates Microsoft Entra access tokens and turns them into a user |
| [`roles.py`](roles.py) | Decides the role (`admin` or `user`) from the app roles in the token |
| [`dependencies.py`](dependencies.py) | `get_current_user` and `require_admin`, which the routers depend on |
| [`audit_log.py`](audit_log.py) | Records who changed the data and when, as one JSON line per event in `logs/audit.jsonl`. Only metadata, never file content |

The Entra app registration these files rely on is described in [docs/entra-app-registration.md](../../../docs/entra-app-registration.md).

The routers it includes: [`admin/`](../admin/README.md) (admin only), [`snapshot/`](../snapshot/README.md) and [`review/`](../review/README.md) (any signed-in user). Tests: [`backend/tests/unit/api`](../../tests/unit/api).
