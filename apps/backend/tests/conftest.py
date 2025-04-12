import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import timedelta

from main import app
from database.base import Base
from database.session import get_db
from database.models import Users
from users.services import create_access_token

# Use SQLite test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={
                       "check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def create_user(db_session):
    import random
    suffix = str(random.randint(1000, 9999))
    user = Users(
        username=f"testuser{suffix}",
        fullname="Test User",
        email=f"test{suffix}@example.com",
        # fake hash; not verifying password here
        hashed_password="$2b$12$testfakehash",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def access_token(create_user):
    return create_access_token(
        data={"sub": create_user.username},
        expires_delta=timedelta(minutes=15)
    )


@pytest.fixture
def authorized_headers(access_token):
    return {
        "Authorization": f"Bearer {access_token}"
    }


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)
