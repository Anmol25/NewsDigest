from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from feeds import rss_feed
import asyncio
from sentence_transformers import SentenceTransformer
import torch

rss_feeds = {
    "Top Stories": {
        "Times Of India": "http://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "India TV": "https://www.indiatvnews.com/rssnews/topstory.xml"
    },
    "Latest": {
        "Times of India": "http://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
        "Economic Times": "https://economictimes.indiatimes.com/news/latest-news/rssfeeds/20989204.cms",
        "NDTV": "https://feeds.feedburner.com/ndtvnews-latest",
        "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml"
    }
}

feedtest = rss_feed.RssFeed(rss_feeds)

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Check if a GPU is available
if torch.cuda.is_available():
    device = torch.device("cuda")  # Use GPU
    print("Using GPU:", torch.cuda.get_device_name(0))
else:
    device = torch.device("cpu")  # Use CPU
    print("GPU not available, using CPU.")

# Move the model to the GPU
model.to(device)

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
    return asyncio.run(feedtest.fetch_articles(model, device))
