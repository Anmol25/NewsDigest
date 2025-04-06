"""
session.py
This module contains the session for the database.
"""

from contextlib import contextmanager
from .base import SessionLocal


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
