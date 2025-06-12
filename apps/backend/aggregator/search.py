"""
search.py
This module contains the search functionality for the aggregator.
"""

from sqlalchemy import or_, case
import logging
from database.models import Articles
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.queries import get_article_query, paginate_and_format
from typing import List, Any
from datetime import datetime
import re
import string


logger = logging.getLogger(__name__)


def count_words(text: str) -> int:
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra spaces (including tabs/newlines) and strip leading/trailing spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Split by space and count words
    words = text.split()
    return len(words)


def determine_factors(query):
    words = count_words(query)
    if words <= 3:
        return 0.7, 0.3, 0.5
        # return 1, 0, 0.9
    else:
        return 0.3, 0.7, 0.5


def search(current_user_id: int, query: str, model: Any, device: str, db: Session, skip: int, limit: int) -> List[dict]:
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
        # To perform OR keyword search
        words = query.strip().split()
        or_query = " OR ".join(words)
        ts_vector = func.to_tsvector('english', Articles.title)
        ts_query = func.websearch_to_tsquery('english', or_query)
        ts_rank = func.coalesce(
            func.ts_rank(ts_vector, ts_query, 32), 
            0.0  # Ensure non-null values
        ).label("ts_rank")

        # Add explicit word match counting
        word_match_count = 0
        for word in words:
            word_match_count += case(
                (func.lower(Articles.title).ilike(f'%{word.lower()}%'), 1),
                else_=0
            )
        
        # Normalize word matches
        word_match_ratio = (word_match_count / len(words)).label("word_match_ratio")
        
        # Enhanced keyword score combining both approaches
        enhanced_ts_rank = (
            (ts_rank * 0.4) + (word_match_ratio * 0.6)
        ).label("enhanced_ts_rank")


        embedding = model.encode(query, device=device)
        current_time = datetime.now()

        recency_factor = 0.35
        kw_factor, cos_factor, eliminate_factor = determine_factors(query)

        # Keyword Rank
        inverted_kw_rank = (1 - enhanced_ts_rank).label("inverted_kw_rank")
        # Semantic Rank
        cos_dist = Articles.embeddings.cosine_distance(
            embedding).label("distance")
        normalized_cos_dist = (cos_dist / 2.0).label("normalized_cos_dist")
        # Recency Factor
        RECENCY_DECAY_DAYS = 30
        # Calculate age in days
        article_age_days = (func.extract('epoch', current_time - Articles.published_date) / 86400.0)
        normalized_recency = (
                            func.least(
                                article_age_days / RECENCY_DECAY_DAYS, # Scales from 0 to 1 within the window
                                1.0 # Caps at 1 for anything older than RECENCY_DECAY_DAYS
                            )
                        ).label("normalized_recency")
        
        combined_score = (
            (((inverted_kw_rank * kw_factor) +
            (normalized_cos_dist * cos_factor)) * (1 - recency_factor)) +
            (normalized_recency * recency_factor)
        ).label("combined_score")

        main_score = ((inverted_kw_rank * kw_factor) + (normalized_cos_dist * cos_factor)).label("main_score")

        or_conditions = []
        for word in words:
            word_lower = word.lower()
            or_conditions.extend([
                # Simple text matching
                func.lower(Articles.title).ilike(f'%{word_lower}%'),
                # Full-text search matching  
                func.to_tsvector('english', Articles.title).op('@@')(
                    func.websearch_to_tsquery('english', word)
                )
            ])


        results = get_article_query(
            db, current_user_id, main_score, combined_score).filter(or_(*or_conditions), main_score <= eliminate_factor).order_by(combined_score)
        results = paginate_and_format(results, skip, limit)
        return results
        
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
        return []
