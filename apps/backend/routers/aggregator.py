"""
aggregator.py
This module provides endpoints for fetching articles, searching, and managing user subscriptions.
It includes functionality for refreshing feeds, checking user subscriptions, and retrieving personalized feeds.
"""

import asyncio
import logging
import threading
import time
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

import yaml
from fastapi import APIRouter, HTTPException, FastAPI, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.sql import ColumnElement
from typing import Optional

from aggregator.feeds import Feeds
from aggregator.model import SBERT
from aggregator.search import search_db, context_search
from database.session import get_db
from database.operations import insert_to_db
from database.models import Articles, Users, Sources, UserSubscriptions, UserHistory
from database.queries import (
    like_alias,
    bookmark_alias,
    get_article_query,
    paginate_and_format,
)
from users.services import get_current_active_user
from users.recommendation import Recommendar

logger = logging.getLogger(__name__)

# Initialize sbert for context search
sbert_search = SBERT()
# Initialize separate sbert for fetching articles (for thread safety)
sbert_feeds = SBERT()
articles = Feeds(sbert_feeds)
REFRESH_INTERVAL = 60 * 10  # 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the feed refresh task lifecycle.

    Args:
        app (FastAPI): FastAPI application instance."""
    executor = ThreadPoolExecutor(max_workers=1)

    def refresh_worker():
        while True:
            try:
                logger.info("Refreshing Feeds")
                with open("feeds.yaml", 'r') as file:
                    rss_feeds = yaml.safe_load(file)
                # Run the async code in a separate event loop in this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(
                    articles.refresh_articles(rss_feeds))
                articles_list = articles.get_articles()
                logger.info(f"Fetched {len(articles_list)} articles")
                if articles_list:
                    insert_to_db(articles_list)
                logger.info(
                    f"Refreshed Feeds Successfully, Next Refresh in {REFRESH_INTERVAL//60} minutes")
            except Exception as e:
                logger.error(f"Error refreshing feeds: {e}")
            time.sleep(REFRESH_INTERVAL)
    # Start the worker thread
    thread = threading.Thread(target=refresh_worker, daemon=True)
    thread.start()
    yield
    executor.shutdown(wait=False)

router = APIRouter(lifespan=lifespan)


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
    if request.type == "liked":
        return fetch_article(db, current_user_id, page, page_size, like_alias.article_id.isnot(None), Articles.published_date.desc())
    elif request.type == "bookmarked":
        return fetch_article(db, current_user_id, page, page_size, bookmark_alias.article_id.isnot(None), Articles.published_date.desc())
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
async def search_article(query: str, context: Optional[bool] = False, page: int = Query(1, description="Page number"), limit: int = Query(20, description="Results per page"),
                         db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)) -> list:
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
        if context:
            search_results = context_search(
                current_user.id, query, sbert_search.model, sbert_search.get_device(), db, skip, limit)
        else:
            search_results = search_db(current_user.id, query, db, skip, limit)
        if not search_results:
            raise HTTPException(
                status_code=404, detail="Relevant Results not found")
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
        feed = Recommendar.get_recommendations(
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
            source_names), Articles.published_date)
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
            .order_by(desc(UserHistory.watched_at))
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
                'liked': item.liked,
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
