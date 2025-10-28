"""
content.py
This module provides endpoints for fetching articles, searching, and managing user subscriptions.
It includes functionality for refreshing feeds, checking user subscriptions, and retrieving personalized feeds.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import ColumnElement
from typing import Optional

from src.aggregator.model import SBERT
from src.aggregator.search import search
from src.database.session import get_async_db
from src.database.models import Articles, Users, Sources, UserSubscriptions, UserHistory
from src.database.queries import (
    bookmark_alias,
    build_article_select,
    paginate_and_format_async,
)
from src.users.services import get_current_active_user
from src.users.recommendation import Recommender

logger = logging.getLogger(__name__)
router = APIRouter()


# Dependency to access SBERT created in main and stored on app.state
def get_sbert(request: Request) -> SBERT:
    s = getattr(request.app.state, "sbert", None)
    if s is None:
        raise HTTPException(status_code=500, detail="SBERT not initialized")
    return s


async def fetch_article(db: AsyncSession, current_user_id: int, page: int, page_size: int, filter_by: ColumnElement, order_by: ColumnElement) -> list:
    """Fetch articles based on user preferences and filters."""
    try:
        skip = (page - 1) * page_size
        stmt = build_article_select(current_user_id)
        stmt = stmt.where(filter_by).order_by(order_by)
        results = await paginate_and_format_async(db, stmt, skip, page_size)
        return results
    except Exception as e:
        logger.error(f"Error in fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


class ArticleRequest(BaseModel):
    type: str
    source: Optional[str] = None
    topic: Optional[str] = None


async def handle_article_request(request: ArticleRequest, page: int, page_size: int, db: AsyncSession, current_user_id: int) -> list:
    """Handle article request based on type."""
    if request.type == "bookmarked":
        return await fetch_article(db, current_user_id, page, page_size, bookmark_alias.article_id.isnot(None), bookmark_alias.bookmarked_at.desc())
    elif request.type == "source":
        return await fetch_article(db, current_user_id, page, page_size, Articles.source == request.source, Articles.published_date.desc())
    elif request.type == "topic":
        return await fetch_article(db, current_user_id, page, page_size, Articles.topic == request.topic, Articles.published_date.desc())
    else:
        raise HTTPException(status_code=400, detail="Invalid article type")


@router.post("/articles")
async def get_articles(request: ArticleRequest, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                       db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)) -> list:
    """Get articles based on user preferences and filters."""
    try:
        results = await handle_article_request(
            request, page, page_size, db, current_user.id)
        if not results:
            raise HTTPException(status_code=404, detail="No articles found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving articles: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_article(query: str, page: int = Query(1, description="Page number"),
                         limit: int = Query(20, description="Results per page"), db: AsyncSession = Depends(get_async_db),
                         current_user: Users = Depends(
                             get_current_active_user),
                         sbert: SBERT = Depends(get_sbert)) -> list:
    """Search for articles in DataBase."""
    try:
        skip = (page - 1) * limit
        search_results = await search(
            current_user.id, query, sbert.model, sbert.get_device(), db, skip, limit)
        if not search_results:
            return []
        return search_results
    except Exception as e:
        logger.error(f"Error in searching articles: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/foryou")
async def personalized_feed(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                            current_user: Users = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_db)) -> list:
    """Get personalized article recommendations."""
    try:
        feed = await Recommender.get_recommendations(
            current_user, db, page, page_size)
        if not feed:
            raise HTTPException(
                status_code=404,
                detail="User History Empty."
            )
        return feed
    except Exception as e:
        logger.error(f"Error in generating personalized feed: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/isSubscribed")
async def is_subscribed(source: str, current_user: Users = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_db)) -> dict:
    """Check if the user is subscribed to a specific source."""
    try:
        result = await db.execute(select(Sources.id).where(Sources.source == source))
        row = result.first()
        source_id = row[0] if row else None
        is_subscribed = False
        if source_id:
            result = await db.execute(
                select(UserSubscriptions).where(
                    UserSubscriptions.user_id == current_user.id,
                    UserSubscriptions.source_id == source_id
                )
            )
            is_subscribed = bool(result.scalar_one_or_none())
        return {"isSubscribed": is_subscribed}
    except Exception as e:
        logger.error(f"Error in checking subscription status: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/getSubscriptions")
async def get_user_subscriptions(current_user: Users = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_db)) -> list:
    """Get all sources the user is subscribed to."""
    try:
        result = await db.execute(
            select(Sources.source)
            .join(UserSubscriptions, Sources.id == UserSubscriptions.source_id)
            .where(UserSubscriptions.user_id == current_user.id)
        )
        subscriptions = result.all()
        if not subscriptions:
            raise HTTPException(
                status_code=404, detail="No subscriptions found")
        return [sub[0] for sub in subscriptions]
    except Exception as e:
        logger.error(f"Error in retrieving user subscriptions: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/subscribed-articles")
async def get_subscribed_articles(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                                  current_user: Users = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_db)) -> list:
    """Get articles from all sources the user has subscribed to."""
    try:
        # Get all sources the user is subscribed to
        result = await db.execute(
            select(Sources.source)
            .join(UserSubscriptions, Sources.id == UserSubscriptions.source_id)
            .where(UserSubscriptions.user_id == current_user.id)
        )
        subscribed_sources = result.all()
        # Extract source names from query result
        source_names = [source[0] for source in subscribed_sources]
        if not source_names:
            raise HTTPException(
                status_code=404, detail="No news source subscribed")
        # Get articles from subscribed sources
        results = await fetch_article(db, current_user.id, page, page_size, Articles.source.in_(
            source_names), Articles.published_date.desc())
        if not results:
            raise HTTPException(
                status_code=404, detail="No subscribed articles found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving subscribed articles: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/user-history")
async def get_history(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                      current_user: Users = Depends(get_current_active_user), db: AsyncSession = Depends(get_async_db)) -> list:
    """Get User History."""
    try:
        offset = (page - 1) * page_size
        stmt = (
            build_article_select(
                current_user.id, Articles.summary, UserHistory.watched_at)
            .join(UserHistory, UserHistory.article_id == Articles.id)
            .where(UserHistory.user_id == current_user.id)
            .order_by(UserHistory.watched_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        results = result.fetchall()
        if not results:
            raise HTTPException(status_code=404, detail="No history found")

        formatted = []
        for row in results:
            m = row._mapping
            formatted.append({
                'id': m['id'],
                'title': m['title'],
                'link': m['link'],
                'published_date': m['published_date'],
                'image': m['image'],
                'source': m['source'],
                'topic': m['topic'],
                'bookmarked': m['bookmarked'],
                'summary': m['summary'],
                'watched_at': m['watched_at'],
            })
        return formatted
    except Exception as e:
        logger.error(f"Error in retrieving user history: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")
