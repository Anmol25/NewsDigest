"""
session.py
This module contains the session for the database.
"""

from contextlib import contextmanager, asynccontextmanager

from .base import SessionLocal, AsyncSessionLocal

# Database Session for FastAPI Path Dependency
def get_db():
    """
    Yields Database session and ensures proper cleaning
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database Session for non FastAPI path function
@contextmanager
def context_db():
    """
    Yields Database session and ensures proper cleaning
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================
# ⚙️ ASYNC SESSION HELPERS
# ==========================

async def get_async_db():
    """
    FastAPI dependency for asynchronous routes.
    Automatically handles session cleanup using 'async with'.
    """
    async with AsyncSessionLocal() as session:
        yield session


@asynccontextmanager
async def async_context_db():
    """
    Async context manager for non-FastAPI usage.
    Example:
        async with async_context_db() as db:
            result = await db.execute(select(User))
    """
    async with AsyncSessionLocal() as session:
        yield session
