import yaml
import asyncio
import logging
from fastapi import APIRouter, HTTPException, FastAPI, Depends, Query
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session, aliased
from sqlalchemy import desc
from sqlalchemy.sql import case
from aggregator.feeds import Feeds
from aggregator.model import SBERT
from aggregator.search import search_db
from database.session import get_db
from database.operations import insert_to_db
from database.models import Articles, Users, UserLikes, UserBookmarks, Sources, UserSubscriptions
from users.services import get_current_active_user
from users.recommendation import Recommendar
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Initialize core components
sbert = SBERT()
articles = Feeds(sbert)


async def refresh_feeds(sleep_time: int = 15 * 60):
    """Automatically fetch feeds and update database periodically"""
    try:
        while True:
            logger.debug("Refreshing Feeds")
            # Load feed links and refresh articles
            with open("feeds.yaml", 'r') as file:
                rss_feeds = yaml.safe_load(file)

            await articles.refresh_articles(rss_feeds)
            articles_list = articles.get_articles()

            # Insert to database if new articles found
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


def format_article_results(results):
    """Format query results into a consistent response structure"""
    return [
        {
            'id': item.id,
            'title': item.title,
            'link': item.link,
            'published_date': item.published_date,
            'image': item.image,
            'source': item.source,
            'topic': getattr(item, 'topic', None),
            'liked': item.liked,
            'bookmarked': item.bookmarked
        }
        for item in results
    ]


def get_article_query(db, current_user_id):
    """Create base query for articles with user interaction data"""
    like_alias = aliased(UserLikes)
    bookmark_alias = aliased(UserBookmarks)

    return (db.query(
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
        .outerjoin(like_alias, (Articles.id == like_alias.article_id) &
                   (like_alias.user_id == current_user_id))
        .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) &
                   (bookmark_alias.user_id == current_user_id)))


@router.get("/feed/{topic}")
async def retrieve_feed(
    topic: str,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user)
):
    """Retrieve feed articles for a specific topic"""
    try:
        skip = (page - 1) * limit
        query = get_article_query(db, current_user.id)

        results = (query
                   .filter(Articles.topic == topic)
                   .order_by(desc(Articles.published_date))
                   .offset(skip)
                   .limit(limit)
                   .all())

        if not results:
            raise HTTPException(
                status_code=404, detail=f"{topic}'s Feed not found")

        return format_article_results(results)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_article(
    query: str,
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user)
):
    """Search for articles using semantic search"""
    skip = (page - 1) * limit
    similar_items = search_db(current_user.id, query, db, skip, limit)

    if not similar_items:
        raise HTTPException(
            status_code=404, detail="Relevant Results not found")

    return similar_items


@router.get("/foryou")
async def personalized_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get personalized article recommendations"""
    try:
        feed = Recommendar.get_recommendations(
            current_user, db, page, page_size)

        if not feed:
            raise HTTPException(
                status_code=204,
                detail="User History Empty. Read articles to create a personalized feed."
            )

        return feed
    except Exception as e:
        logger.error(f"Error in generating personalized feed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/liked-articles")
async def get_liked_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get articles liked by the current user"""
    offset = (page - 1) * page_size
    like_alias = aliased(UserLikes)
    bookmark_alias = aliased(UserBookmarks)

    results = (
        db.query(
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
        .outerjoin(like_alias, (Articles.id == like_alias.article_id) & (like_alias.user_id == current_user.id))
        .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) & (bookmark_alias.user_id == current_user.id))
        .filter(like_alias.article_id.isnot(None))
        .order_by(desc(like_alias.liked_at))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return format_article_results(results)


@router.get("/bookmarked-articles")
async def get_bookmarked_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get articles bookmarked by the current user"""
    offset = (page - 1) * page_size
    like_alias = aliased(UserLikes)
    bookmark_alias = aliased(UserBookmarks)

    results = (
        db.query(
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
        .outerjoin(like_alias, (Articles.id == like_alias.article_id) & (like_alias.user_id == current_user.id))
        .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) & (bookmark_alias.user_id == current_user.id))
        .filter(bookmark_alias.article_id.isnot(None))
        .order_by(desc(bookmark_alias.bookmarked_at))
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return format_article_results(results)


@router.get("/source/")
async def get_source_articles(
    source: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Users = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get articles from a specific source"""
    offset = (page - 1) * page_size
    query = get_article_query(db, current_user.id)

    results = (query
               .filter(Articles.source == source)
               .order_by(desc(Articles.published_date))
               .offset(offset)
               .limit(page_size)
               .all())

    return format_article_results(results)


class SubscriptionsRequest(BaseModel):
    source: str


@router.post("/isSubscribed")
def is_subscribed(request: SubscriptionsRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    source = request.source
    source_id = db.query(Sources.id).filter(
        Sources.source == source).first()
    # If Source exists extract id else None
    source_id = source_id[0] if source_id else None
    if source_id:
        subscription = db.query(UserSubscriptions).filter(UserSubscriptions.user_id == current_user.id,
                                                          UserSubscriptions.source_id == source_id).first()
        if subscription:
            return True
        else:
            return False
    return False


@router.get("/getSubscriptions")
def get_user_subscriptions(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user:
        subscriptions = db.query(Sources.source).\
            join(UserSubscriptions, Sources.id == UserSubscriptions.source_id).\
            filter(UserSubscriptions.user_id == current_user.id).all()
        return [sub[0] for sub in subscriptions]
    return []
