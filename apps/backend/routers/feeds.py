from fastapi import APIRouter, HTTPException, FastAPI, Depends
from feeds.rss_feed import RssFeed
from sentence_transformers import SentenceTransformer
from contextlib import asynccontextmanager
import torch
import yaml
from database.session import get_db, context_db
from database.models import Articles
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import desc

with open("feeds.yaml", 'r') as file:
    rss_feeds = yaml.safe_load(file)

sbert = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Check if a GPU is available
if torch.cuda.is_available():
    device = torch.device("cuda")  # Use GPU
    print("Using GPU:", torch.cuda.get_device_name(0))
else:
    device = torch.device("cpu")  # Use CPU
    print("GPU not available, using CPU.")

# Move the model to the GPU
sbert.to(device)

# Create RssFeed Object to store Articles
articles = RssFeed()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup Triggered")
    await articles.refresh_articles(rss_feeds, sbert, device)
    articles_list = articles.get_articles()
    with context_db() as db:
        for item in articles_list:
            article = Articles(
                title=item["title"],
                link=item["link"],
                published_date=item["published"],
                image=item["image"],
                source=item["source"],
                topic=item["topic"]
            )
            try:
                db.add(article)
                db.commit()
            except IntegrityError:
                db.rollback()  # Rollback the transaction in case of a duplicate
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
