"""
Validates Microsoft Entra ID access tokens and turns them into a user.
"""

from dataclasses import dataclass
from typing import Callable

import jwt

from backend.api.config import Settings
from backend.api.roles import Role, role_for

# Finds the public key a token was signed with. In production this fetches
# Microsoft's published keys; tests pass in their own key instead.
SigningKeyResolver = Callable[[str], object]


class InvalidTokenError(Exception):
    """The token is missing, malformed, or fails one of the checks."""


@dataclass(frozen=True)
class CurrentUser:
    """The signed-in user as the rest of the API sees them."""

    name: str
    email: str
    role: Role


def microsoft_key_resolver(tenant_id: str) -> SigningKeyResolver:
    """
    Return a resolver that looks up signing keys from the tenant's key list.

    PyJWKClient caches the keys, so Microsoft is not called on every request.
    """
    client = jwt.PyJWKClient(f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys")
    return lambda token: client.get_signing_key_from_jwt(token).key


def validate_token(token: str, settings: Settings, resolve_key: SigningKeyResolver) -> CurrentUser:
    """
    Check the token's signature, issuer, tenant, audience and expiry.

    Returns the user it belongs to, or raises InvalidTokenError.
    """
    try:
        claims = jwt.decode(
            token,
            key=resolve_key(token),
            algorithms=["RS256"],
            audience=settings.client_id,
            issuer=f"https://login.microsoftonline.com/{settings.tenant_id}/v2.0",
            options={"require": ["exp", "iss", "aud", "tid"]},
        )
    except jwt.PyJWTError as error:
        raise InvalidTokenError(str(error)) from error
    # The issuer already names the tenant, but checking tid as well guards
    # against a misconfigured issuer ever letting another tenant in (S1)
    if claims["tid"] != settings.tenant_id:
        raise InvalidTokenError("Token is from another tenant")
    email = claims.get("preferred_username") or claims.get("email")
    if not email:
        raise InvalidTokenError("Token has no email")
    return CurrentUser(
        name=claims.get("name", email),
        email=email,
        role=role_for(email, settings.admin_emails),
    )
