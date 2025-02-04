from contextlib import contextmanager
from .base import SessionLocal


@contextmanager
def get_db():
    """
    Yields Database session and ensures proper cleaning
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
