"""
Tests for token validation (security requirements S1 and S2) and for how
roles are decided, using test keys instead of a real Microsoft tenant.
"""

import time

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from backend.api.auth import InvalidTokenError, validate_token

OTHER_TENANT = "22222222-2222-2222-2222-222222222222"


def test_valid_token_gives_user(make_token, settings, resolve_key):
    user = validate_token(make_token(), settings, resolve_key)

    assert user.name == "Kari Nordmann"
    assert user.email == "kari@test.no"
    assert user.role == "user"


@pytest.mark.parametrize("roles", [["admin"], ["user", "admin"]], ids=["admin", "both roles"])
def test_admin_role_gives_admin(roles, make_token, settings, resolve_key):
    user = validate_token(make_token(roles=roles), settings, resolve_key)

    assert user.role == "admin"


@pytest.mark.parametrize(
    "overrides",
    [
        pytest.param({"exp": int(time.time()) - 60}, id="expired"),
        pytest.param({"aud": "some-other-app"}, id="wrong audience"),
        pytest.param({"iss": f"https://login.microsoftonline.com/{OTHER_TENANT}/v2.0"}, id="wrong issuer"),
        pytest.param({"tid": OTHER_TENANT}, id="wrong tenant"),
        pytest.param({"tid": None}, id="missing tenant"),
        pytest.param({"scp": None}, id="id token"),
        pytest.param({"scp": "some.other.scope"}, id="wrong scope"),
        pytest.param({"roles": None}, id="no role assigned"),
        pytest.param({"roles": ["reader"]}, id="unknown role"),
        pytest.param({"preferred_username": None}, id="missing email"),
        pytest.param({"preferred_username": None, "email": "kari@test.no"}, id="unverified email only"),
    ],
)
def test_rejects_token_failing_a_check(overrides, make_token, settings, resolve_key):
    with pytest.raises(InvalidTokenError):
        validate_token(make_token(**overrides), settings, resolve_key)


def test_rejects_token_signed_with_another_key(make_token, settings, resolve_key):
    attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    with pytest.raises(InvalidTokenError):
        validate_token(make_token(key=attacker_key), settings, resolve_key)


def test_rejects_garbage(settings, resolve_key):
    with pytest.raises(InvalidTokenError):
        validate_token("not-a-token", settings, resolve_key)
