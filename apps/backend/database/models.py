from sqlalchemy import Column, Integer, String, DateTime, Text
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
