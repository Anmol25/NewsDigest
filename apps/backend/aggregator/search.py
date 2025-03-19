from sqlalchemy import or_
import logging
from database.models import Articles, UserLikes, UserBookmarks
from sqlalchemy.orm import Session, aliased
from sqlalchemy import select, func
from sqlalchemy.sql import case

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
        words = query.split()  # ['Donald', 'Trump']

        ts_vector = func.to_tsvector(Articles.title)
        ts_query = func.plainto_tsquery(query)  # Full phrase search

        # Fix: Use to_tsquery with properly formatted OR syntax
        # Join words with ' | ' and wrap each word in single quotes
        ts_query_or = func.to_tsquery(
            " | ".join(f"'{word}'" for word in words))

        # Higher rank for full match
        rank = func.ts_rank_cd(ts_vector, ts_query)

        like_alias = aliased(UserLikes)
        bookmark_alias = aliased(UserBookmarks)

        stmt = (
            select(
                Articles.id,
                Articles.title,
                Articles.link,
                Articles.published_date,
                Articles.image,
                Articles.source,
                Articles.topic,
                case((like_alias.article_id.isnot(None), True),
                     else_=False).label("liked"),
                case((bookmark_alias.article_id.isnot(None), True),
                     else_=False).label("bookmarked"),
                rank.label("distance")
            )
            .outerjoin(like_alias, (Articles.id == like_alias.article_id) & (like_alias.user_id == user_id))
            .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) & (bookmark_alias.user_id == user_id))
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

        # Transform query results into a structured list
        return [
            {
                "id": item.id,
                "title": item.title,
                "link": item.link,
                "published_date": item.published_date,
                "image": item.image,
                "source": item.source,
                "liked": item.liked,
                "bookmarked": item.bookmarked
            }
            for item in results
        ]
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
        return []
