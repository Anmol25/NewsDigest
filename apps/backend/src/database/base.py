"""
base.py
This module contains the base for the database.
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

load_dotenv()

db_url = os.getenv("DATABASE_URL")

engine = create_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ✅ Async engine (for FastAPI async endpoints)
# Make sure DATABASE_URL ends with '+asyncpg' if using PostgreSQL, e.g.:
# postgresql+asyncpg://user:password@localhost/dbname
if db_url.startswith("postgresql://"):
    async_db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    async_db_url = db_url  # fallback if already async

async_engine = create_async_engine(async_db_url, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ✅ Declarative Base for ORM models
Base = declarative_base()
