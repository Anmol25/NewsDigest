from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from pgvector.sqlalchemy import Vector
from .base import Base


class Articles(Base):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    link = Column(String(512), nullable=False, unique=True)
    published_date = Column(DateTime(timezone=True), nullable=False)
    image = Column(String(512), nullable=True)
    source = Column(String(50), nullable=False)
    topic = Column(String(50), nullable=False)
    embeddings = Column(Vector(384), nullable=False)
    summary = Column(Text, nullable=True)


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    fullname = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)


class UserHistory(Base):
    __tablename__ = "userhistory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    article_id = Column(Integer, nullable=False)
    link = Column(String(512), nullable=False, unique=True)
    watched_at = Column(DateTime(timezone=True), nullable=False)
