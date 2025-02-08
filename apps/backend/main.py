import logger
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.aggregator import router as feed_router
from routers.summarizer import router as summarize_router


app = FastAPI()
app.include_router(feed_router)
app.include_router(summarize_router)

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
