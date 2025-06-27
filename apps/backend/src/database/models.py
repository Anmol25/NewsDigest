"""
models.py
This module contains the models for the database.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import TSVECTOR
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
    tsv = Column(TSVECTOR)


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

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    article_id = Column(Integer, ForeignKey(
        "articles.id", ondelete="CASCADE"), nullable=False)
    watched_at = Column(DateTime(timezone=True), nullable=False)


class UserLikes(Base):
    __tablename__ = "userlikes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    article_id = Column(Integer, ForeignKey(
        "articles.id", ondelete="CASCADE"), nullable=False)
    liked_at = Column(DateTime(timezone=True), nullable=False)


class UserBookmarks(Base):
    __tablename__ = "userbookmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    article_id = Column(Integer, ForeignKey(
        "articles.id", ondelete="CASCADE"), nullable=False)
    bookmarked_at = Column(DateTime(timezone=True), nullable=False)


class Sources(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(40), nullable=False, unique=True)


class UserSubscriptions(Base):
    __tablename__ = "usersubscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(Integer, ForeignKey(
        "sources.id", ondelete="CASCADE"), nullable=False)
