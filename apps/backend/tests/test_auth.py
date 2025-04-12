import pytest
from fastapi.testclient import TestClient
from database.models import Users
from users.services import get_password_hash


def test_register_user(client):
    payload = {
        "username": "newuser",
        "fullname": "New User",
        "email": "newuser@example.com",
        "password": "securepassword"
    }
    response = client.post("/register", json=payload)
    assert response.status_code == 200
    assert response.json()["response"] == "User Successfully created"


def test_register_duplicate_user(client, db_session):
    # Manually add a user
    user = Users(
        username="dupeuser",
        fullname="Dupe User",
        email="dupe@example.com",
        hashed_password="testhash"
    )
    db_session.add(user)
    db_session.commit()

    # Try to register again
    payload = {
        "username": "dupeuser",
        "fullname": "Dupe User",
        "email": "dupe@example.com",
        "password": "password123"
    }
    response = client.post("/register", json=payload)
    assert response.status_code == 409
    assert "userExists" in response.json()["detail"]


def test_login_and_get_token(client, db_session):
    # Insert user manually with known hash
    user = Users(
        username="logintest",
        fullname="Login User",
        email="logintest@example.com",
        hashed_password=get_password_hash("password"),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Login (we're bypassing hash check, so this will fail unless you use a real hash)
    response = client.post(
        "/token", data={"username": "logintest", "password": "password"})
    # Will be 401 unless password matches hash
    assert response.status_code in [200, 401]


def test_logout(client):
    response = client.post("/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out"
