import yaml
from fastapi import APIRouter, HTTPException, FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import desc
from aggregator.feeds import Feeds
from database.session import get_db
from database.operations import insert_to_db, get_latest_time
from database.models import Articles

with open("feeds.yaml", 'r') as file:
    rss_feeds = yaml.safe_load(file)

# Create Feeds Object to fetch new Articles
articles = Feeds()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup Triggered")
    last_stored_time = get_latest_time()
    print(last_stored_time)
    await articles.refresh_articles(rss_feeds, last_stored_time)
    articles_list = articles.get_articles()
    # Insert to Database
    # Check if list is not empty then update DB
    if articles_list:
        insert_to_db(articles_list)
    yield

router = APIRouter(lifespan=lifespan)


@router.get("/feed")
def ret_feed():
    data = articles.get_articles()
    return data


@router.get("/feed/{topic}")
def retrieve_feed(topic: str, db: Session = Depends(get_db)):
    try:
        data = db.query(Articles.title, Articles.link, Articles.published_date,
                        Articles.image, Articles.source, Articles.topic).filter(Articles.topic == topic).order_by(desc(Articles.published_date)).all()
        if not data:
            raise HTTPException(status_code=404, detail="Topic not found")
        # Convert result into dictionaries for FastAPI serialization
        data_dict = [
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
        return data_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
