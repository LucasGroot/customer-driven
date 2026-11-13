"""
Who is calling the API: turns the bearer token into a user and checks their
role. Kept apart from main.py so the admin endpoints can ask for the user too.
"""

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
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


def require_admin(request: Request, user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    """
    Let the request through only for admins; everyone else gets 403, and the
    attempt is written to the audit log.
    """
    if user.role != "admin":
        request.app.state.audit_log.record(
            "access.denied", user.email, method=request.method, path=request.url.path
        )
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user
