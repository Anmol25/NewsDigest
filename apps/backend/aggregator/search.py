from sqlalchemy import or_
import logging
from database.models import Articles
from sqlalchemy.orm import Session
from sqlalchemy import select, func

logger = logging.getLogger(__name__)


def search_db(query: str, db: Session, skip: int, limit: int):
    """
    Perform Full Text Search with flexible matching.
    Args:
        query (str): Query to be searched in database.
        db (Session): Database Session to perform queries.
        skip (int): Number of records to skip for pagination.
        limit (int): Number of records to return.
    Returns:
        similar_items (list): List of similar items(dict) for requested query.
    """
    try:
        similar_items = []

        # Convert query to OR-based search (splitting into individual words)
        words = query.split()  # ['Donald', 'Trump']

        ts_vector = func.to_tsvector(Articles.title)
        ts_query = func.plainto_tsquery(query)  # Full phrase search

        # Fix: Use to_tsquery with properly formatted OR syntax
        # Join words with ' | ' and wrap each word in single quotes
        ts_query_or = func.to_tsquery(
            " | ".join(f"'{word}'" for word in words))

        # Higher rank for full match
        rank = func.ts_rank_cd(ts_vector, ts_query)

        stmt = (
            select(Articles, rank.label("distance"))
            .where(or_(
                # Strict match (higher priority)
                ts_vector.op("@@")(ts_query),
                # OR-based match (lower priority)
                ts_vector.op("@@")(ts_query_or)
            ))
            # Rank full match higher
            .order_by(Articles.published_date.desc(), rank.desc())
            .limit(limit)
            .offset(skip)
        )

        results = db.execute(stmt).all()

        for item, _ in results:
            result_item = {
                "title": item.title,
                "link": item.link,
                "published_date": item.published_date,
                "image": item.image,
                "source": item.source
            }
            similar_items.append(result_item)

        return similar_items
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
        return []
