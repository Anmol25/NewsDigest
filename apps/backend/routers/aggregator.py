import yaml
import asyncio
import logging
from fastapi import APIRouter, HTTPException, FastAPI, Depends, Query
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session, aliased
from sqlalchemy import desc
from sqlalchemy.sql import case, ColumnElement
from aggregator.feeds import Feeds
from aggregator.model import SBERT
from aggregator.search import search_db
from database.session import get_db
from database.operations import insert_to_db
from database.models import Articles, Users, UserLikes, UserBookmarks, Sources, UserSubscriptions, UserHistory
from users.services import get_current_active_user
from users.recommendation import Recommendar

logger = logging.getLogger(__name__)

# Initialize model and article fetcher
sbert = SBERT()
articles = Feeds(sbert)
# Define aliases for user interactions
like_alias = aliased(UserLikes)
bookmark_alias = aliased(UserBookmarks)
# Define the basic query structure for articles
QUERY_STRUCTURE = (Articles.id,
        Articles.title,
        Articles.link,
        Articles.published_date,
        Articles.image,
        Articles.source,
        Articles.topic,
        case((like_alias.article_id.isnot(None), True),
             else_=False).label("liked"),
        case((bookmark_alias.article_id.isnot(None), True),
             else_=False).label("bookmarked"))

async def refresh_feeds(sleep_time: int = 15 * 60):
    """Automatically fetch feeds and update database periodically
    
    Args:
        sleep_time (int): Time interval in seconds for refreshing feeds.
    """
    try:
        while True:
            logger.debug("Refreshing Feeds")
            # Load feed links and refresh articles
            with open("feeds.yaml", 'r') as file:
                rss_feeds = yaml.safe_load(file)
            await articles.refresh_articles(rss_feeds)
            articles_list = articles.get_articles()
            logger.info(f"Fetched {len(articles_list)} articles")
            # Insert to database
            logger.info("Inserting articles to database")
            if articles_list:
                insert_to_db(articles_list)
            logger.info(
                f"Refreshed Feeds Successfully, Next Refresh in {int(sleep_time/60)} minutes")
            await asyncio.sleep(sleep_time)
    except Exception as e:
        logger.error(f"Error in executing refresh feeds task: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the feed refresh task lifecycle"""
    task = asyncio.create_task(refresh_feeds())
    yield
    task.cancel()


router = APIRouter(lifespan=lifespan)


def format_article_results(results: list):
    """Format query results into a consistent response structure
    
    Args:
        results (list): List of articles from the database.
    
    Returns:
        list: Formatted list of articles with user interaction data.
    """
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


def get_article_query(db:Session, current_user_id: int) -> list:
    """Create base query for articles with user interaction data
    
    Args:
        db (Session): Database session.
        current_user_id (int): ID of the current user.
    Returns:
        list: SQLAlchemy query object.
    """
    return (db.query(*QUERY_STRUCTURE)
        .outerjoin(like_alias, (Articles.id == like_alias.article_id) &
                   (like_alias.user_id == current_user_id))
        .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) &
                   (bookmark_alias.user_id == current_user_id)))


def paginate_and_format(query: Query, order_by_col: ColumnElement, offset: int, limit: int) -> list:
    """
    Paginate the query results and format them
    
    Args:
        query (Query): SQLAlchemy query object.
        order_by_col (ColumnElement): Column to order by.
        offset (int): Offset for pagination.
        limit (int): Limit for pagination.
    
    Returns:
        list: Formatted list of articles.
    """
    results = (
        query
        .order_by(desc(order_by_col))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return format_article_results(results)

@router.get("/feed/{topic}")
async def retrieve_feed(
    topic: str,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user)
) -> list:
    """Retrieve feed articles for a specific topic.
    
    Args:
        topic (str): Topic of the feed.
        page (int): Page number for pagination.
        limit (int): Number of results per page.
        db (Session): Database session.
        current_user (Users): Current logged-in user.
    Returns:
        list: List of articles for the specified topic.
    """
    try:
        skip = (page - 1) * limit
        query = get_article_query(db, current_user.id)
        query = query.filter(Articles.topic == topic)
        results = paginate_and_format(query, Articles.published_date, skip, limit)
        if not results:
            raise HTTPException(
                status_code=404, detail=f"{topic}'s Feed not found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving feed for topic {topic}: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/liked-articles")
async def get_liked_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> list:
    """Get articles liked by the current user.

    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.

    Returns:
        list: List of articles liked by the user.
    """
    try:
        offset = (page - 1) * page_size
        query = get_article_query(db, current_user.id).filter(like_alias.article_id.isnot(None))
        results = paginate_and_format(query, like_alias.liked_at, offset, page_size)
        if not results:
            raise HTTPException(status_code=404, detail="No liked articles found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving liked articles: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/bookmarked-articles")
async def get_bookmarked_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> list:
    """Get articles bookmarked by the current user.
    
    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.
    
    Returns:
        list: List of articles bookmarked by the user.
    """
    try:
        offset = (page - 1) * page_size
        query = get_article_query(db, current_user.id).filter(bookmark_alias.article_id.isnot(None))
        results = paginate_and_format(query, bookmark_alias.bookmarked_at, offset, page_size)
        if not results:
            raise HTTPException(status_code=404, detail="No bookmarked articles found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving bookmarked articles: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/source")
async def get_source_articles(
    source: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get articles from a specific source
    
    Args:
        source (str): Source name.
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.
        
    Returns:
        list: List of articles from the specified source.
    """
    try:
        offset = (page - 1) * page_size
        query = get_article_query(db, current_user.id).filter(Articles.source == source)
        results = paginate_and_format(query, Articles.published_date, offset, page_size)
        if not results:
            raise HTTPException(status_code=404, detail=f"No articles found for source {source}")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving articles from source {source}: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/search")
async def search_article(
    query: str,
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user)
) -> list:
    """Search for articles in DataBase.
    
    Args:
        query (str): Search query string.
        page (int): Page number for pagination.
        limit (int): Number of results per page.
        db (Session): Database session.
        current_user (Users): Current logged-in user.
    
    Returns:
        list: List of articles matching the search query.
    """
    try:
        skip = (page - 1) * limit
        similar_items = search_db(current_user.id, query, db, skip, limit)
        if not similar_items:
            raise HTTPException(
                status_code=404, detail="Relevant Results not found")
        return similar_items
    except Exception as e: 
        logger.error(f"Error in searching articles: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/foryou")
async def personalized_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> list:
    """Get personalized article recommendations.
    
    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.
    
    Returns:
        list: List of personalized article recommendations.
    """
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
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")



@router.get("/isSubscribed")
def is_subscribed(source: str, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
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
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/getSubscriptions")
def get_user_subscriptions(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        subscriptions = db.query(Sources.source).\
            join(UserSubscriptions, Sources.id == UserSubscriptions.source_id).\
            filter(UserSubscriptions.user_id == current_user.id).all()
        if not subscriptions:
            raise HTTPException(status_code=404, detail="No subscriptions found")
        return [sub[0] for sub in subscriptions]
    except Exception as e:
        logger.error(f"Error in retrieving user subscriptions: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/subscribed-articles")
async def get_subscribed_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get articles from all sources the user has subscribed to"""
    try:
        offset = (page - 1) * page_size
        # Get all sources the user is subscribed to
        subscribed_sources = db.query(Sources.source).\
            join(UserSubscriptions, Sources.id == UserSubscriptions.source_id).\
            filter(UserSubscriptions.user_id == current_user.id).all()
        # Extract source names from query result
        source_names = [source[0] for source in subscribed_sources]
        if not source_names:
            raise HTTPException(status_code=404, detail="No news source subscribed")
        # Get articles from subscribed sources
        query = get_article_query(db, current_user.id).filter(Articles.source.in_(source_names))
        results = paginate_and_format(query, Articles.published_date, offset, page_size)
        if not results:
            raise HTTPException(status_code=404, detail="No subscribed articles found")
        return results
    except Exception as e:
        logger.error(f"Error in retrieving subscribed articles: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/user-history")
async def get_history(
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=50),
        current_user: Users = Depends(get_current_active_user),
        db: Session = Depends(get_db)):
    """Get User History
    
    Args:
        page (int): Page number for pagination.
        page_size (int): Number of results per page.
        current_user (Users): Current logged-in user.
        db (Session): Database session.
        
    Returns:
        List[Dict]: List of articles with user history details.
    """
    try:
        offset = (page - 1) * page_size

        results = (
            db.query(
                *QUERY_STRUCTURE,
                Articles.summary,
                UserHistory.watched_at
            )
            .outerjoin(like_alias, (Articles.id == like_alias.article_id) & (like_alias.user_id == current_user.id))
            .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) & (bookmark_alias.user_id == current_user.id))
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
                'liked' : item.liked,
                'bookmarked': item.bookmarked,
                'summary': item.summary,
                'watched_at': item.watched_at
            }
            for item in results
        ]
    except Exception as e:
        logger.error(f"Error in retrieving user history: {e}")
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail="Internal Server Error")