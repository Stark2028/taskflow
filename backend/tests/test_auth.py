from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings
from tests.conftest import PASSWORD


def register(client, email="new@example.com", password="Secret123", full_name="New User", **extra):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": full_name, **extra},
    )


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_register_success(client):
    response = register(client, email="New@Example.com")
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@example.com"  # normalized to lowercase
    assert body["role"] == "USER"
    assert "password" not in body and "password_hash" not in body


def test_register_cannot_choose_admin_role(client):
    response = register(client, role="ADMIN")
    assert response.status_code == 201
    assert response.json()["role"] == "USER"


def test_register_duplicate_email_returns_409(client):
    assert register(client).status_code == 201
    response = register(client, email="NEW@example.com")
    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered"


def test_register_rejects_invalid_input(client):
    assert register(client, password="short").status_code == 422
    assert register(client, email="not-an-email").status_code == 422
    assert register(client, full_name="   ").status_code == 422


def test_login_success_returns_usable_token(client):
    register(client)
    response = client.post("/api/auth/login", json={"email": "new@example.com", "password": "Secret123"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == settings.access_token_expire_minutes * 60

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "new@example.com"


def test_login_invalid_credentials_return_same_401(client):
    register(client)
    wrong_password = client.post("/api/auth/login", json={"email": "new@example.com", "password": "Wrong1234"})
    unknown_email = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "Secret123"})
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json() == {"detail": "Invalid email or password"}


def test_protected_endpoint_requires_valid_token(client):
    missing = client.get("/api/auth/me")
    assert missing.status_code == 401
    assert missing.headers["www-authenticate"] == "Bearer"

    garbage = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert garbage.status_code == 401


def test_expired_and_forged_tokens_are_rejected(client, user_headers):
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    forged = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        "a-different-secret-key-that-is-long-enough",
        algorithm="HS256",
    )
    for token in (expired, forged):
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


def test_update_profile_name(client, user_headers):
    response = client.patch("/api/auth/me", json={"full_name": "Alice Cooper"}, headers=user_headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Alice Cooper"


def test_change_password_requires_current_password(client, user_headers):
    bad = client.patch(
        "/api/auth/me",
        json={"current_password": "wrong-password", "new_password": "NewSecret123"},
        headers=user_headers,
    )
    assert bad.status_code == 400

    ok = client.patch(
        "/api/auth/me",
        json={"current_password": PASSWORD, "new_password": "NewSecret123"},
        headers=user_headers,
    )
    assert ok.status_code == 200
    login = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "NewSecret123"})
    assert login.status_code == 200
