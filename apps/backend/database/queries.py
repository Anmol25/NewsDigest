from fastapi import Query
from database.models import Articles, UserLikes, UserBookmarks
from sqlalchemy import desc
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import case, ColumnElement

# Define aliases for user interactions
like_alias = aliased(UserLikes)
bookmark_alias = aliased(UserBookmarks)
# Define the basic query structure for articles
QUERY_STRUCTURE = (
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
         else_=False).label("bookmarked")
)


def get_article_query(db: Session, current_user_id: int, *add_columns: ColumnElement) -> Query:
    """Create base query for articles with user interaction data.

    Args:
        db (Session): Database session.
        current_user_id (int): ID of the current user.
        *add_columns (ColumnElement): Additional columns to include in the query.
    Returns:
        Query: SQLAlchemy query object."""
    return (db.query(*QUERY_STRUCTURE, *add_columns)
            .outerjoin(like_alias, (Articles.id == like_alias.article_id) &
                       (like_alias.user_id == current_user_id))
            .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) &
                       (bookmark_alias.user_id == current_user_id)))


def format_article_results(results: list) -> list:
    """Format query results into a consistent response structure.

    Args:
        results (list): List of articles from the database.

    Returns:
        list: Formatted list of articles with user interaction data."""
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
            'bookmarked': item.bookmarked
        }
        for item in results
    ]


def paginate_and_format(query: Query, offset: int, limit: int) -> list:
    """Paginate the query results and format them.

    Args:
        query (Query): SQLAlchemy query object.
        offset (int): Offset for pagination.
        limit (int): Limit for pagination.

    Returns:
        list: Formatted list of articles."""
    results = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )
    return format_article_results(results)
