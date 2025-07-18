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
from sqlalchemy import func

from src.database.models import Articles
from src.database.queries import format_article_results, get_article_query, paginate_and_format

logger = logging.getLogger(__name__)

# Define weights
BM25_WEIGHT = 0.6
VECTOR_WEIGHT = 0.4
HYBRID_WEIGHT = 0.35
RECENCY_WEIGHT = 0.65


def search(current_user_id: int, query: str, model: Any, device: str, db: Session, skip: int, limit: int, min_score: float = 0.18) -> List[dict]:
    """Perform hybrid search combining BM25 and vector similarity with pagination.

    Args:
        current_user_id (int): ID of the current user.
        query (str): Query string to search in the database.
        model (Any): Model used to create embeddings for the query.
        device (str): Device (e.g., 'cuda' or 'cpu') to store the embeddings on.
        db (Session): SQLAlchemy database session.
        skip (int): Number of records to skip for pagination.
        limit (int): Maximum number of records to return.
        min_score (float): Minimum hybrid score threshold.

    Returns:
        List[dict]: A list of dictionaries representing similar articles.
    """

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

    # Build query using the existing query structure
    base_query = get_article_query(
        db,
        current_user_id,
        bm25_score.label('bm25_score'),
        vector_score.label('vector_score'),
        hybrid_score.label('hybrid_score'),
        recency_score.label('recency_score'),
        combined_score.label('combined_score')
    )

    # Apply hybrid score filter (elimination) and combined score ordering
    filtered_query = base_query.filter(
        hybrid_score >= min_score  # Eliminate based on relevance only
    ).order_by(
        combined_score.desc()      # Order by relevance + recency
    )

    # Apply pagination and format results
    return paginate_and_format(filtered_query, skip, limit)


def search_with_scores(current_user_id: int, query: str, model: Any, device: str,
                       db: Session, skip: int, limit: int, min_score: float = 0.1) -> List[dict]:
    """Perform hybrid search and include relevance scores in response."""

    # Generate query embedding
    query_embedding = model.encode(
        [query], convert_to_tensor=True, device=device)
    query_embedding = query_embedding.cpu().numpy().flatten().tolist()

    # Define weights
    BM25_WEIGHT = 0.6
    VECTOR_WEIGHT = 0.4
    HYBRID_WEIGHT = 0.8
    RECENCY_WEIGHT = 0.2

    # Score calculations
    bm25_score = func.coalesce(
        func.ts_rank_cd(Articles.tsv, func.plainto_tsquery('english', query)),
        0
    )
    vector_score = 1 - Articles.embeddings.cosine_distance(query_embedding)

    # Hybrid score (BM25 + Vector only) - for elimination
    hybrid_score = (bm25_score * BM25_WEIGHT) + (vector_score * VECTOR_WEIGHT)

    # Recency score
    days_since_published = func.extract(
        'epoch', func.now() - Articles.published_date) / 86400.0
    recency_score = func.greatest(
        0.0,
        func.exp(-days_since_published / 30.0)
    )

    # Combined score (Hybrid + Recency) - for ordering
    combined_score = (hybrid_score * HYBRID_WEIGHT) + \
        (recency_score * RECENCY_WEIGHT)

    # Build and execute query
    base_query = get_article_query(
        db,
        current_user_id,
        bm25_score.label('bm25_score'),
        vector_score.label('vector_score'),
        hybrid_score.label('hybrid_score'),
        recency_score.label('recency_score'),
        combined_score.label('combined_score')
    )

    results = base_query.filter(
        hybrid_score >= min_score      # Eliminate based on relevance only
    ).order_by(
        combined_score.desc()          # Order by relevance + recency
    ).offset(skip).limit(limit).all()

    # Format results with scores
    if not results:
        return []

    return [
        {
            'id': item.id,
            'title': item.title,
            'link': item.link,
            'published_date': item.published_date,
            'image': item.image,
            'source': item.source,
            'topic': item.topic,
            'liked': item.liked,
            'bookmarked': item.bookmarked,
            'bm25_score': float(item.bm25_score),
            'hybrid_score': float(item.hybrid_score),
            'recency_score': float(item.recency_score),
            'combined_score': float(item.combined_score)
        }
        for item in results
    ]
