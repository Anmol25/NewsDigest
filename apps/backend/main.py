from pathlib import Path
from contextlib import asynccontextmanager
import asyncio
import threading
import time
import yaml
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from langgraph.checkpoint.postgres import PostgresSaver
from dotenv import load_dotenv
import os

import utils.logger as logger
from routers.auth import router as auth_router
from routers.content import router as feed_router
from routers.summarizer import router as summarize_router
from routers.userops import router as user_router
from routers.ai import router as ai_router
from src.database.base import Base, engine
from utils.initial_data import seed_data
from src.aggregator.model import SBERT
from src.aggregator.feeds import Feeds
from src.database.operations import insert_articles

load_dotenv()

DATABASE_URL_KEY = os.getenv("DATABASE_URL")

logger = logging.getLogger(__name__)
REFRESH_INTERVAL = 60 * 5


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enable pgvector extension if not exists
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    # Create tables if they dont exist
    Base.metadata.create_all(bind=engine)

    # Create Agent Checkpoint Table (PostgresSaver)
    with PostgresSaver.from_conn_string(DATABASE_URL_KEY) as checkpointer:
        checkpointer.setup()

    # Execute the SQL file with trigger + function
    with engine.connect() as conn:
        with open("utils/init_triggers.sql", "r") as file:
            sql_script = file.read()
            conn.execute(text(sql_script))
            conn.commit()

    # Seed initial data
    session = Session(bind=engine)
    seed_data(session)
    session.commit()
    # Initialize SBERT and Feeds and attach to app.state so routers can access them
    app.state.sbert = SBERT()
    app.state.articles = Feeds(app.state.sbert)

    # Start background refresh worker (runs in a daemon thread)
    def refresh_worker():
        while True:
            try:
                logger.info("Refreshing Feeds")
                with open("utils/feeds.yaml", "r") as file:
                    rss_feeds = yaml.safe_load(file)
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(
                    app.state.articles.refresh_articles(rss_feeds))
                articles_list = app.state.articles.get_articles()
                logger.info(f"Fetched {len(articles_list)} articles")
                if articles_list:
                    insert_articles(articles_list)
                logger.info(
                    f"Refreshed Feeds Successfully, Next Refresh in {REFRESH_INTERVAL//60} minutes")
            except Exception as e:
                logger.error(f"Error refreshing feeds: {e}")
            time.sleep(REFRESH_INTERVAL)

    thread = threading.Thread(target=refresh_worker, daemon=True)
    thread.start()

    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(feed_router)
app.include_router(summarize_router)
app.include_router(user_router)
app.include_router(ai_router)

origins = ["http://localhost:5173", "http://127.0.0.1:5173",
           "http://localhost:3000", "http://127.0.0.1:3000"]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows requests from specified origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.get('/')
def index():
    return {"Welcome To News Aggregator Summarizer api"}
