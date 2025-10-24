"""
queries.py
Stores specific format to retrieve articles from database and apply pagination
"""

from fastapi import Query

from sqlalchemy import select, and_
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql import case, ColumnElement
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import Articles, UserBookmarks

# Define aliases for user interactions
bookmark_alias = aliased(UserBookmarks)
# Define the basic query structure for articles (sync use)
QUERY_STRUCTURE = (
    Articles.id,
    Articles.title,
    Articles.link,
    Articles.published_date,
    Articles.image,
    Articles.source,
    Articles.topic,
    case((bookmark_alias.article_id.isnot(None), True),
         else_=False).label("bookmarked")
)


def get_article_query(db: Session, current_user_id: int, *add_columns: ColumnElement):
    """Create base query for articles with user interaction data (sync variant)."""
    return (db.query(*QUERY_STRUCTURE, *add_columns)
            .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) &
                       (bookmark_alias.user_id == current_user_id)))


def format_article_results(results: list) -> list:
    """Format query results (sync result rows) into a consistent response structure."""
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
            'bookmarked': item.bookmarked
        }
        for item in results
    ]


def paginate_and_format(query, offset: int, limit: int) -> list:
    """Paginate the query results and format them (sync variant)."""
    results = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )
    return format_article_results(results)


# ==========================
# Async variants
# ==========================

def build_article_select(current_user_id: int, *add_columns: ColumnElement):
    """Build a SQLAlchemy Select for articles with user interaction data (async-friendly).

    Returns a Select that can be executed with an AsyncSession.
    """
    select_columns = (
        Articles.id,
        Articles.title,
        Articles.link,
        Articles.published_date,
        Articles.image,
        Articles.source,
        Articles.topic,
        case((bookmark_alias.article_id.isnot(None), True), else_=False).label("bookmarked"),
        *add_columns,
    )

    stmt = (
        select(*select_columns)
        .outerjoin(
            bookmark_alias,
            and_(Articles.id == bookmark_alias.article_id,
                 bookmark_alias.user_id == current_user_id)
        )
    )
    return stmt


def _format_async_rows(rows: list) -> list:
    """Format rows returned from AsyncSession.execute into the standard article dict list."""
    if not rows:
        return []
    formatted = []
    for row in rows:
        # Row may support attribute access by column name
        mapping = getattr(row, "_mapping", None)
        if mapping is not None:
            item = {
                'id': mapping.get('id'),
                'title': mapping.get('title'),
                'link': mapping.get('link'),
                'published_date': mapping.get('published_date'),
                'image': mapping.get('image'),
                'source': mapping.get('source'),
                'topic': mapping.get('topic'),
                'bookmarked': mapping.get('bookmarked', False)
            }
        else:
            # Fallback to attribute access
            item = {
                'id': getattr(row, 'id', None),
                'title': getattr(row, 'title', None),
                'link': getattr(row, 'link', None),
                'published_date': getattr(row, 'published_date', None),
                'image': getattr(row, 'image', None),
                'source': getattr(row, 'source', None),
                'topic': getattr(row, 'topic', None),
                'bookmarked': getattr(row, 'bookmarked', False)
            }
        formatted.append(item)
    return formatted


async def paginate_and_format_async(db: AsyncSession, stmt, offset: int, limit: int) -> list:
    """Execute a Select with pagination using AsyncSession and format the results."""
    stmt_paged = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt_paged)
    rows = result.fetchall()
    return _format_async_rows(rows)
