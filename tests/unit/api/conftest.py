"""
Shared test setup for the API: settings for a made-up tenant, and a key
pair made in the test so tokens can be signed without Microsoft.
"""

import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from backend.api.config import Settings, parse_admin_emails

TENANT = "11111111-1111-1111-1111-111111111111"
CLIENT = "33333333-3333-3333-3333-333333333333"

SIGNING_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def settings():
    return Settings(
        tenant_id=TENANT,
        client_id=CLIENT,
        admin_emails=parse_admin_emails("admin@test.no"),
        allowed_origin="http://localhost:5173",
    )


@pytest.fixture
def resolve_key():
    """Stand-in for Microsoft's key list: always our test public key."""
    return lambda token: SIGNING_KEY.public_key()


@pytest.fixture
def make_token():
    """
    Return a function that signs a token passing every check.

    Pass a claim to override it, or None to leave it out.
    """

    def sign(key=SIGNING_KEY, **overrides):
        claims = {
            "iss": f"https://login.microsoftonline.com/{TENANT}/v2.0",
            "aud": CLIENT,
            "tid": TENANT,
            "exp": int(time.time()) + 3600,
            "name": "Kari Nordmann",
            "preferred_username": "kari@test.no",
        }
        claims.update(overrides)
        claims = {name: value for name, value in claims.items() if value is not None}
        return jwt.encode(claims, key, algorithm="RS256")

    return sign
