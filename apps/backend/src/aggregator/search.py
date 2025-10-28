"""
search.py
This module contains the search functionality for the aggregator.
"""

import re
import string
import logging
from datetime import datetime
from typing import List, Any

from sqlalchemy import or_, case, text
from sqlalchemy import select, func, cast, desc
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from src.database.models import Articles
from src.database.queries import (
    format_article_results,
    get_article_query,
    paginate_and_format,
    build_article_select,
    paginate_and_format_async,
)

logger = logging.getLogger(__name__)

# Define weights
BM25_WEIGHT = 0.6
VECTOR_WEIGHT = 0.4
HYBRID_WEIGHT = 0.35
RECENCY_WEIGHT = 0.65


def search_db(query: str, model: Any, device: str) -> List[dict]:
    # Generate query embedding
    query_embedding = model.encode(
        [query], convert_to_tensor=True, device=device)
    query_embedding = query_embedding.cpu().numpy().flatten().tolist()

    # BM25 full-text search score (0 if no match)
    bm25_score = func.coalesce(
        func.ts_rank_cd(Articles.tsv, func.plainto_tsquery('english', query)),
        0
    )

    # Vector similarity score
    vector_score = 1 - Articles.embeddings.cosine_distance(query_embedding)

    # Hybrid score (BM25 + Vector only) - used for elimination
    hybrid_score = (bm25_score * BM25_WEIGHT) + (vector_score * VECTOR_WEIGHT)

    # Recency score (boost for newer articles)
    days_since_published = func.extract(
        'epoch', func.now() - Articles.published_date) / 86400.0
    recency_score = func.greatest(
        0.0,
        func.exp(-days_since_published / 30.0)
    )

    # Combined score (Hybrid + Recency) - used for ordering
    combined_score = (hybrid_score * HYBRID_WEIGHT) + \
        (recency_score * RECENCY_WEIGHT)

    return bm25_score, vector_score, hybrid_score, recency_score, combined_score


async def search(current_user_id: int, query: str, model: Any, device: str, db: AsyncSession, skip: int, limit: int, min_score: float = 0.18) -> List[dict]:
    """Async variant of hybrid search combining BM25 and vector similarity with pagination."""
    bm25_score, vector_score, hybrid_score, recency_score, combined_score = search_db(
        query, model, device)

    # Build select using async-friendly helpers
    stmt = build_article_select(
        current_user_id,
        bm25_score.label('bm25_score'),
        vector_score.label('vector_score'),
        hybrid_score.label('hybrid_score'),
        recency_score.label('recency_score'),
        combined_score.label('combined_score')
    )

    # Apply filters and ordering
    stmt = stmt.where(hybrid_score >= min_score).order_by(
        combined_score.desc())

    # Paginate and format
    return await paginate_and_format_async(db, stmt, skip, limit)
