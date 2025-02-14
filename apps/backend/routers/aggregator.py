import yaml
import asyncio
import logging
from fastapi import APIRouter, HTTPException, FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import desc
from aggregator.feeds import Feeds
from aggregator.model import SBERT
from database.session import get_db
from database.operations import insert_to_db, get_latest_time
from database.models import Articles

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
def retrieve_feed(topic: str, db: Session = Depends(get_db)) -> list:
    """
    Retrieve Feed of specific topic from Database.
    Args:
        topic (str): Topic of Feed.
        db (Session): Create Database Session.
    Returns:
        articles_list (list): List of article of requested topic. 
    """
    try:
        data = db.query(Articles.title, Articles.link, Articles.published_date,
                        Articles.image, Articles.source, Articles.topic).filter(Articles.topic == topic).order_by(desc(Articles.published_date)).all()
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_article(query: str):
    pass
