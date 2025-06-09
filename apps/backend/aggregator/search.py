"""
search.py
This module contains the search functionality for the aggregator.
"""

from sqlalchemy import or_
import logging
from database.models import Articles
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.queries import get_article_query, paginate_and_format
from typing import List, Any
from datetime import datetime

logger = logging.getLogger(__name__)


def search_db(user_id: int, query: str, db: Session, skip: int, limit: int) -> List[dict]:
    """Perform Full Text Search with flexible matching.

    Args:
        user_id (int): ID of the current user.
        query (str): Query string to search in the database.
        db (Session): SQLAlchemy database session.
        skip (int): Number of records to skip for pagination.
        limit (int): Maximum number of records to return.

    Returns:
        List[dict]: A list of dictionaries representing similar articles."""
    try:
        # Convert query to OR-based search (splitting into individual words)
        words = query.split()
        ts_vector = func.to_tsvector(Articles.title)
        ts_query = func.plainto_tsquery(query)  # Full match
        # OR-based match for flexible search
        ts_query_or = func.to_tsquery(
            " | ".join(f"'{word}'" for word in words))
        # Higher rank for full match
        rank = func.ts_rank_cd(ts_vector, ts_query)
        # Fetch Articles
        extra_cols = [rank.label("distance")]
        query = get_article_query(db, user_id, *extra_cols)
        query = query.where(
            or_(
                # Strict match (higher priority)
                ts_vector.op("@@")(ts_query),
                # OR-based match (lower priority)
                ts_vector.op("@@")(ts_query_or)
            )).order_by(Articles.published_date.desc(), rank.desc())
        results = paginate_and_format(query, skip, limit)
        return results
    except Exception as e:
        logger.error(f"Error in performing keyword search: {e}")
        return []


def context_search(current_user_id: int, query: str, model: Any, device: str, db: Session, skip: int, limit: int) -> List[dict]:
    """Perform Cosine Similarity Search and find the most relevant articles with pagination.

    Args:
        current_user_id (int): ID of the current user.
        query (str): Query string to search in the database.
        model (Any): Model used to create embeddings for the query.
        device (str): Device (e.g., 'cuda' or 'cpu') to store the embeddings on.
        db (Session): SQLAlchemy database session.
        skip (int): Number of records to skip for pagination.
        limit (int): Maximum number of records to return.

    Returns:
        List[dict]: A list of dictionaries representing similar articles."""
    try:
        embedding = model.encode(query, device=device)

        current_time = datetime.now()
        recency_factor = 0.25  # Factor to weight recency vs. similarity
        dist_col = Articles.embeddings.cosine_distance(
            embedding).label("distance")
        combined_score = (dist_col * (1 - recency_factor) +
                          func.extract('epoch', current_time -
                                       Articles.published_date) / 86400.0 * recency_factor
                          ).label("combined_score")

        max_distance = 0.6  # Define a threshold for maximum distance
        query = get_article_query(
            db, current_user_id, dist_col, combined_score).filter(dist_col <= max_distance).order_by(combined_score)

        results = paginate_and_format(query, skip, limit)
        return results
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
        return []
