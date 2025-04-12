import pytest
from fastapi.testclient import TestClient
from database.models import Users, Articles
from datetime import datetime
from sqlalchemy.orm import Session
from pgvector.sqlalchemy import Vector
import random


@pytest.fixture
def create_user(db_session: Session):
    suffix = str(random.randint(1000, 9999))
    user = Users(
        username=f"testuser{suffix}",
        fullname="Test User",
        email=f"test{suffix}@example.com",
        hashed_password="$2b$12$abcdefghijklmnopqrstuv"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def token_headers(create_user):
    return {
        "Authorization": "Bearer faketoken"  # You'll mock `get_current_active_user`
    }


def test_get_articles_invalid_type(client, authorized_headers):
    response = client.post(
        "/articles",
        json={"type": "invalid_type"},
        headers=authorized_headers
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid article type"


def test_search_article_not_found(client, authorized_headers):
    response = client.get(
        "/search", params={"query": "nonexistent"}, headers=authorized_headers
    )
    assert response.status_code in [404, 500]


def test_personalized_feed_empty(client, authorized_headers):
    response = client.get("/foryou", headers=authorized_headers)
    assert response.status_code in [404, 500]


def test_get_subscriptions_empty(client, authorized_headers):
    response = client.get("/getSubscriptions", headers=authorized_headers)
    assert response.status_code in [404, 500]


def test_is_subscribed_false(client, authorized_headers):
    response = client.get(
        "/isSubscribed", params={"source": "nonexistent"}, headers=authorized_headers
    )
    assert response.status_code == 200
    assert response.json() == {"isSubscribed": False}
