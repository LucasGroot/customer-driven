"""
The dashboard's API. Every endpoint requires a valid Microsoft token, and
admin endpoints also require the admin role.
Run with: uvicorn backend.api.main:create_app --factory --env-file .env
"""

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.api.auth import (
    CurrentUser,
    InvalidTokenError,
    SigningKeyResolver,
    microsoft_key_resolver,
    validate_token,
)
from backend.api.config import Settings, load_settings

bearer = HTTPBearer(auto_error=False)


@lru_cache
def get_settings() -> Settings:
    """Load the settings once, the first time they are needed."""
    return load_settings()


@lru_cache
def resolver_for_tenant(tenant_id: str) -> SigningKeyResolver:
    """Create one Microsoft key resolver per tenant, so its key cache is shared."""
    return microsoft_key_resolver(tenant_id)


def get_key_resolver(settings: Annotated[Settings, Depends(get_settings)]) -> SigningKeyResolver:
    """The key resolver for the tenant the API is configured for."""
    return resolver_for_tenant(settings.tenant_id)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
    resolve_key: Annotated[SigningKeyResolver, Depends(get_key_resolver)],
) -> CurrentUser:
    """
    Turn the request's bearer token into a user, or reject with 401.

    The reason a token failed is not sent back, so it cannot be probed.
    """
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    try:
        return validate_token(credentials.credentials, settings, resolve_key)
    except InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token") from None


def require_admin(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    """Let the request through only for admins; everyone else gets 403."""
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user


def create_app(settings: Settings | None = None) -> FastAPI:
    """
    Build the app with CORS limited to the dashboard's own origin (S5).

    Settings are read here, so a missing variable stops the server at startup.
    """
    settings = settings or get_settings()
    app = FastAPI(title="Kunnskapsgap API")
    app.dependency_overrides[get_settings] = lambda: settings
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

    @app.get("/api/admin/ping")
    def admin_ping(user: Annotated[CurrentUser, Depends(require_admin)]) -> dict[str, str]:
        """Example admin-only endpoint, until the admin features exist."""
        return {"status": "ok", "admin": user.email}

    return app
