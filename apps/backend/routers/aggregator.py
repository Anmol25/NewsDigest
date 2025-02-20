import yaml
import asyncio
import logging
from fastapi import APIRouter, HTTPException, FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import desc
from aggregator.feeds import Feeds
from aggregator.model import SBERT
from aggregator.search import search_similar_items
from database.session import get_db
from database.operations import insert_to_db, get_latest_time
from database.models import Articles, Users
from users.services import get_current_active_user
from users.recommendation import Recommendar

logger = logging.getLogger(__name__)

# Create Sentence Transformer model instance
sbert = SBERT()

# Create Feeds Object to fetch new Articles
articles = Feeds(sbert)


async def refresh_feeds(sleep_time: int = (15*60)):
    """
    Automatically Fetch Feeds and Insert To DataBase after a specified time.
    Args:
        sleep_time (int) = Time in Seconds 
    """
    try:
        while True:
            logger.debug("Refreshing Feeds")
            # Load Feed links
            with open("feeds.yaml", 'r') as file:
                rss_feeds = yaml.safe_load(file)
            # Get Time of most updated article from Database
            last_stored_time = get_latest_time()
            # Get new Articles from Feeds
            await articles.refresh_articles(rss_feeds, last_stored_time)
            articles_list = articles.get_articles()
            # Insert to Database
            if articles_list:
                insert_to_db(articles_list)
            logger.info(
                f"Refreshed Feeds Successfully, Next Refresh in {int(sleep_time/60)} minutes")
            # Sleep for specified time
            await asyncio.sleep(sleep_time)
    except Exception as e:
        logger.error(f"Error in executing refresh feeds task.: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Run refresh_feeds function on startup and clean it on shutting down 
    """
    task = asyncio.create_task(refresh_feeds())
    yield
    task.cancel()

router = APIRouter(lifespan=lifespan)


@router.get("/feed/{topic}")
async def retrieve_feed(topic: str, page: int = 1, limit: int = 20, db: Session = Depends(get_db)) -> list:
    """
    Retrieve Feed of specific topic from Database.
    Args:
        topic (str): Topic of Feed.
        db (Session): Create Database Session.
    Returns:
        articles_list (list): List of articles of requested topic.
    """
    try:
        skip = (page - 1) * limit
        data = (db.query(Articles.title,
                         Articles.link,
                         Articles.published_date,
                         Articles.image,
                         Articles.source,
                         Articles.topic)
                .filter(Articles.topic == topic)
                .order_by(desc(Articles.published_date))
                .offset(skip)
                .limit(limit)
                .all())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not data:
        raise HTTPException(
            status_code=404, detail=f"{topic}'s Feed not found")

    # Convert result into dictionaries for FastAPI serialization
    articles_list = [
        {
            'title': item.title,
            'link': item.link,
            'published_date': item.published_date,
            'image': item.image,
            'source': item.source,
            'topic': item.topic
        }
        for item in data
    ]
    return articles_list


@router.post("/search")
async def search_article(query: str, db: Session = Depends(get_db)):
    """
    Search similar articles in database
    Args:
        query (str): Query for which articles need to be search.
        db (Session): Database session variable.
    Returns:
        similar_items (list): List of similar articles
    """
    try:
        similar_items = search_similar_items(
            query, sbert.model, sbert.device, db)
        if not similar_items:
            raise HTTPException(
                status_code=404, detail=f"Relevant Results not found")
        return similar_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/foryou")
async def personalized_feed(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        feed = Recommendar.get_recommendations(current_user, db)
        print(feed)
        if not feed:
            raise HTTPException(
                status_code=204, detail="User History Empty. Read articles to create personalized feed.")
        return feed
    except Exception as e:
        logger.error(f"Error in generating personalize feed: {e}")
