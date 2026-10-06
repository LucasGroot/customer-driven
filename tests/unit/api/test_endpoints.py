"""
Tests that the API enforces sign-in and the admin role (security
requirement S3), with Microsoft's keys swapped for a test key.
"""

import pytest
from fastapi.testclient import TestClient

from backend.api import main


@pytest.fixture
def client(settings, resolve_key):
    app = main.create_app(settings)
    app.dependency_overrides[main.get_key_resolver] = lambda: resolve_key
    return TestClient(app)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_me_requires_sign_in(client):
    assert client.get("/api/me").status_code == 401


def test_me_rejects_invalid_token(client):
    assert client.get("/api/me", headers=auth("not-a-token")).status_code == 401


def test_me_returns_user_and_role(client, make_token):
    response = client.get("/api/me", headers=auth(make_token()))

    assert response.status_code == 200
    assert response.json() == {"name": "Kari Nordmann", "email": "kari@test.no", "role": "user"}


def test_admin_endpoint_forbids_normal_user(client, make_token):
    assert client.get("/api/admin/ping", headers=auth(make_token())).status_code == 403


def test_admin_endpoint_allows_admin(client, make_token):
    response = client.get("/api/admin/ping", headers=auth(make_token(preferred_username="admin@test.no")))

    assert response.status_code == 200
