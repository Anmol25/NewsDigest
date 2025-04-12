from datetime import datetime, timezone


def test_like_article_toggle(client, db_session, create_user, authorized_headers):
    from database.models import Articles
    article = Articles(
        title="Sample",
        link="http://example.com",
        published_date=datetime(2024, 1, 1, tzinfo=timezone.utc),
        image="http://image.jpg",
        source="example",
        topic="news",
        embeddings=[0.0] * 384
    )
    db_session.add(article)
    db_session.commit()

    response = client.post(
        "/like", json={"article_id": article.id}, headers=authorized_headers)
    assert response.status_code == 200
    assert response.json() is True


def test_subscribe_unsubscribe(client, db_session, authorized_headers):
    from database.models import Sources
    source = Sources(source="Test Source")
    db_session.add(source)
    db_session.commit()

    # Subscribe
    response = client.post(
        "/subscribe", json={"source": "Test Source"}, headers=authorized_headers)
    assert response.status_code == 200
    assert response.json()["data"] == "subscribed"

    # Unsubscribe
    response = client.post(
        "/subscribe", json={"source": "Test Source"}, headers=authorized_headers)
    assert response.status_code == 200
    assert response.json()["data"] == "unsubscribed"
