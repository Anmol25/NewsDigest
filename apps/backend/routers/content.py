"""
aggregator.py
This module provides endpoints for fetching articles, searching, and managing user subscriptions.
It includes functionality for refreshing feeds, checking user subscriptions, and retrieving personalized feeds.
"""

import logging
from fastapi import APIRouter, HTTPException, FastAPI, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import ColumnElement
from typing import Optional

from src.aggregator.model import SBERT
from src.aggregator.search import search
from src.database.session import get_db
from src.database.operations import insert_articles
from src.database.models import Articles, Users, Sources, UserSubscriptions, UserHistory
from src.database.queries import (
    bookmark_alias,
    get_article_query,
    paginate_and_format,
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


def fetch_article(db: Session, current_user_id: int, page: int, page_size: int, filter_by: ColumnElement, order_by: ColumnElement) -> list:
    """Fetch articles based on user preferences and filters.

    Args:
        db (Session): Database session.
        current_user_id (int): ID of the current user.
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        filter_by (ColumnElement): Filter condition for articles.
        order_by (ColumnElement): Column to order by.

    Returns:
        list: List of articles based on the filter and pagination."""
    try:
        skip = (page - 1) * page_size
        query = get_article_query(db, current_user_id)
        query = query.filter(filter_by).order_by(order_by)
        results = paginate_and_format(query, skip, page_size)
        return results
    except Exception as e:
        logger.error(f"Error in fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


class ArticleRequest(BaseModel):
    type: str
    source: Optional[str] = None
    topic: Optional[str] = None


def handle_article_request(request: ArticleRequest, page: int, page_size: int, db: Session, current_user_id: int) -> list:
    """Handle article request based on type.

    Args:
        request (ArticleRequest): Request object containing filter criteria.
        db (Session): Database session.
        current_user (Users): Current logged-in user.

    Returns:
        list: List of articles based on the request type and filters."""
    if request.type == "bookmarked":
        return fetch_article(db, current_user_id, page, page_size, bookmark_alias.article_id.isnot(None), bookmark_alias.bookmarked_at.desc())
    elif request.type == "source":
        return fetch_article(db, current_user_id, page, page_size, Articles.source == request.source, Articles.published_date.desc())
    elif request.type == "topic":
        return fetch_article(db, current_user_id, page, page_size, Articles.topic == request.topic, Articles.published_date.desc())
    else:
        raise HTTPException(status_code=400, detail="Invalid article type")


@router.post("/articles")
async def get_articles(request: ArticleRequest, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
                       db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)) -> list:
    """Get articles based on user preferences and filters.

    Args:
        request (ArticleRequest): Request object containing filter criteria.
        db (Session): Database session.
        current_user (Users): Current logged-in user.

    Returns:
        list: List of articles based on the request type and filters."""
    try:
        results = handle_article_request(
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
                         limit: int = Query(20, description="Results per page"), db: Session = Depends(get_db),
                         current_user: Users = Depends(get_current_active_user),
                         sbert: SBERT = Depends(get_sbert)) -> list:
    """Search for articles in DataBase.

    Args:
        query (str): Search query string.
        page (int): Page number for pagination.
        limit (int): Number of results per page.
        db (Session): Database session.
        current_user (Users): Current logged-in user.

    Returns:
        list: List of articles matching the search query."""
    try:
        skip = (page - 1) * limit
        search_results = None
        search_results = search(
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
                            current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)) -> list:
    """Get personalized article recommendations.

    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        list: List of personalized article recommendations."""
    try:
        feed = Recommender.get_recommendations(
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
def is_subscribed(source: str, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)) -> dict:
    """Check if the user is subscribed to a specific source.

    Args:
        source (str): Source name to check subscription status.
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        dict: Subscription status."""
    try:
        source_id = db.query(Sources.id).filter(
            Sources.source == source).first()
        # If Source exists extract id else None
        source_id = source_id[0] if source_id else None
        is_subscribed = False
        if source_id:
            subscription = db.query(UserSubscriptions).filter(UserSubscriptions.user_id == current_user.id,
                                                              UserSubscriptions.source_id == source_id).first()
            is_subscribed = bool(subscription)
        return {"isSubscribed": is_subscribed}
    except Exception as e:
        logger.error(f"Error in checking subscription status: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/getSubscriptions")
def get_user_subscriptions(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)) -> list:
    """Get all sources the user is subscribed to.

    Args:
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        list: List of subscribed sources."""
    try:
        subscriptions = db.query(Sources.source).\
            join(UserSubscriptions, Sources.id == UserSubscriptions.source_id).\
            filter(UserSubscriptions.user_id == current_user.id).all()
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
                                  current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)) -> list:
    """Get articles from all sources the user has subscribed to.

    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        list: List of articles from subscribed sources."""
    try:
        # Get all sources the user is subscribed to
        subscribed_sources = db.query(Sources.source).\
            join(UserSubscriptions, Sources.id == UserSubscriptions.source_id).\
            filter(UserSubscriptions.user_id == current_user.id).all()
        # Extract source names from query result
        source_names = [source[0] for source in subscribed_sources]
        if not source_names:
            raise HTTPException(
                status_code=404, detail="No news source subscribed")
        # Get articles from subscribed sources
        results = fetch_article(db, current_user.id, page, page_size, Articles.source.in_(
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
                      current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)) -> list:
    """Get User History.

    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        List[Dict]: List of articles with user history details."""
    try:
        offset = (page - 1) * page_size
        extra_cols = [Articles.summary, UserHistory.watched_at]
        query = get_article_query(db, current_user.id, *extra_cols)
        results = (
            query
            .join(UserHistory, UserHistory.article_id == Articles.id)
            .filter(UserHistory.user_id == current_user.id)
            .order_by(UserHistory.watched_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        if not results:
            raise HTTPException(status_code=404, detail="No history found")

        return [
            {
                'id': item.id,
                'title': item.title,
                'link': item.link,
                'published_date': item.published_date,
                'image': item.image,
                'source': item.source,
                'topic': item.topic,
                'bookmarked': item.bookmarked,
                'summary': item.summary,
                'watched_at': item.watched_at
            }
            for item in results
        ]
    except Exception as e:
        logger.error(f"Error in retrieving user history: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="Internal Server Error")
