"""
A bare server for trying the snapshot route without the login. It has no
authentication, so it is for local development only.
Run with: uvicorn backend.snapshot.dev_app:app --port 8000
"""

from fastapi import FastAPI

from backend.snapshot.router import router


app = FastAPI(title="Snapshot dev server")
app.include_router(router)
