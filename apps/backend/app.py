from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from feeds import rss_feed
import asyncio

rss_feeds = {
    "Top Stories": {
        "Times Of India": "http://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",
        # "India TV": "https://www.indiatvnews.com/rssnews/topstory.xml"
    },
    "Latest": {
        "Times of India": "http://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
        "Economic Times": "https://economictimes.indiatimes.com/news/latest-news/rssfeeds/20989204.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-latest",
        # "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml"
    }
}

feedtest = rss_feed.RssFeed(rss_feeds)


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # Allows all origins, or specify domains like ["http://example.com"]
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.get('/')
def index():
    return {"Welcome To News Aggregator Summarizar api"}


@app.get("/test")
def test():
    return asyncio.run(feedtest.fetch_articles())
