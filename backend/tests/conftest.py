"""Shared pytest fixtures: an isolated PostgreSQL test database and an HTTP test client.

How it fits together:
- `create_schema` (once per test session) builds the tables in the *test* database.
- `db` gives a test direct database access and wipes all tables after the test.
- `client` is an HTTP client for the app whose `get_db` dependency is overridden,
  so every request talks to the test database instead of the development one.
"""

from collections.abc import Callable, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models import User, UserRole

TEST_DATABASE_URL = settings.test_database_url or (
    make_url(settings.database_url).set(database="taskflow_test").render_as_string(hide_password=False)
)
if make_url(TEST_DATABASE_URL).database == make_url(settings.database_url).database:
    raise RuntimeError("Refusing to run tests against the development database")

engine = create_engine(TEST_DATABASE_URL, connect_args={"connect_timeout": 5})
TestingSessionLocal = sessionmaker(bind=engine)

PASSWORD = "Password123"


@pytest.fixture(scope="session", autouse=True)
def create_schema() -> Iterator[None]:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db() -> Iterator[Session]:
    session = TestingSessionLocal()
    yield session
    session.close()
    # Empty every table after each test so tests cannot affect one another.
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE tasks, users RESTART IDENTITY CASCADE"))


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_user(client: TestClient, db: Session) -> Callable[..., dict[str, str]]:
    """Factory: insert a user directly into the database, log in, and return auth headers."""

    def _create(email: str, role: UserRole = UserRole.USER, full_name: str = "Test User") -> dict[str, str]:
        db.add(User(full_name=full_name, email=email, password_hash=hash_password(PASSWORD), role=role))
        db.commit()
        response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _create


@pytest.fixture
def user_headers(create_user) -> dict[str, str]:
    return create_user("alice@example.com", full_name="Alice")


@pytest.fixture
def other_user_headers(create_user) -> dict[str, str]:
    return create_user("bob@example.com", full_name="Bob")


@pytest.fixture
def admin_headers(create_user) -> dict[str, str]:
    return create_user("admin@example.com", role=UserRole.ADMIN, full_name="Admin")


@pytest.fixture
def make_task(client: TestClient) -> Callable[..., dict]:
    """Factory: create a task through the API and return its JSON."""

    def _make(headers: dict[str, str], **fields) -> dict:
        body = {"title": "Task", **fields}
        response = client.post("/api/tasks", json=body, headers=headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _make
