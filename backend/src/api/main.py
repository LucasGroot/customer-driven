"""
The dashboard's API. Every endpoint requires a valid Microsoft token, and
admin endpoints also require the admin role.
Run with: uvicorn src.api.main:create_app --factory --env-file .env
"""

from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.admin.analysis_run import AnalysisRunner
from src.admin.router import router as admin_router
from src.admin.upload_limit import UploadSizeLimit
from src.api.audit_log import AuditLog
from src.api.auth import CurrentUser
from src.api.config import Settings
from src.api.dependencies import get_current_user, get_key_resolver, get_settings, require_admin
from src.review.router import router as review_router
from src.snapshot.router import router as snapshot_router

# Tests override the key resolver through this module
__all__ = ["create_app", "get_key_resolver"]


def create_app(settings: Settings | None = None) -> FastAPI:
    """
    Build the app with CORS limited to the dashboard's own origin (S5).

    Settings are read here, so a missing variable stops the server at startup.
    """
    settings = settings or get_settings()
    app = FastAPI(title="Kunnskapsgap API")
    app.dependency_overrides[get_settings] = lambda: settings
    # Added before CORS, so CORS wraps it and the dashboard can read its refusals
    app.add_middleware(UploadSizeLimit)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.allowed_origin],
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/api/me")
    def me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        """Who the signed-in user is and which role they have."""
        return user

    app.state.audit_log = AuditLog()
    app.state.analysis_runner = AnalysisRunner(audit_log=app.state.audit_log)
    app.include_router(admin_router, dependencies=[Depends(require_admin)])

    # The snapshot used to be served without login by src.snapshot.dev_app;
    # here every snapshot route requires a valid Microsoft token.
    app.include_router(snapshot_router, dependencies=[Depends(get_current_user)])

    # HR's decisions: any signed-in user, like the snapshot
    app.include_router(review_router, dependencies=[Depends(get_current_user)])

    return app
