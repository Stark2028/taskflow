"""Database engine and per-request session management."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# One engine per process. It owns a pool of reusable connections to PostgreSQL.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # check a pooled connection is alive before handing it out
    echo=settings.sql_echo,  # log every SQL statement when SQL_ECHO=true
    # Fail fast if PostgreSQL is unreachable; without this a connect attempt can block forever.
    connect_args={"connect_timeout": 5},
)

# Factory that creates Session objects bound to the engine.
SessionLocal = sessionmaker(bind=engine)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: open one session per request and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
