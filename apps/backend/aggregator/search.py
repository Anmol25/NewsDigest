"""
search.py
This module contains the search functionality for the aggregator.
"""

from sqlalchemy import or_
import logging
from database.models import Articles, UserLikes, UserBookmarks
from sqlalchemy.orm import Session, aliased
from sqlalchemy import select, func
from sqlalchemy.sql import case
from database.queries import like_alias, bookmark_alias, QUERY_STRUCTURE, get_article_query, paginate_and_format

logger = logging.getLogger(__name__)


def search_db(user_id: int, query: str, db: Session, skip: int, limit: int):
    """
    Perform Full Text Search with flexible matching.
    Args:
        current_user (int): User ID of current user
        query (str): Query to be searched in database.
        db (Session): Database Session to perform queries.
        skip (int): Number of records to skip for pagination.
        limit (int): Number of records to return.
    Returns:
        similar_items (list): List of similar items(dict) for requested query.
    """
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


def context_search(current_user_id: int, query: str, model, device: str, db: Session, skip: int, limit: int):
    """
    Perform Cosine Similarity Search and find most relevant articles with pagination.
    Args:
        query (str): Query to be searched in database.
        model : Model to create embeddings of query.
        device (str): Device (cuda/CPU) to store the embeddings on.
        db (Session): Database Session to perform queries.
        skip (int): Number of records to skip for pagination.
        limit (int): Number of records to return.
    Returns:
        similar_items (list): List of similar items(dict) for requested query.
    """
    try:
        embedding = model.encode(query, device=device)
        extra_cols = [Articles.embeddings.cosine_distance(
            embedding).label('distance')]
        query = get_article_query(db, current_user_id, *extra_cols)
        query = query.order_by('distance', Articles.published_date.desc())
        results = paginate_and_format(query, skip, limit)
        return results
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
        return []
