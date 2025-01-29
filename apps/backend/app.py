from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from feeds.rss_feed import RssFeed
from sentence_transformers import SentenceTransformer
import torch
import yaml


with open("feeds.yaml", 'r') as file:
    rss_feeds = yaml.safe_load(file)

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

# Create RssFeed Object to store Articles
articles = RssFeed()


@app.on_event("startup")
async def startup_event():
    await articles.refresh_articles(rss_feeds, model, device)


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
    return articles.get_articles()


@app.get("/feed/")
def retrieve_feed(topic: str):
    if topic == "Top Stories":
        return articles.get_articles()["Top Stories"]
    elif topic == "Latest":
        return articles.get_articles()["Latest"]
    else:
        return []
