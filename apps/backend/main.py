from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import utils.logger as logger
from routers.auth import router as auth_router
from routers.aggregator import router as feed_router
from routers.summarizer import router as summarize_router
from routers.userops import router as user_router
from routers.ai import router as ai_router
from src.database.base import Base, engine
from utils.initial_data import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enable pgvector extension if not exists
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    # Create tables if they dont exist
    Base.metadata.create_all(bind=engine)

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
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(feed_router)
app.include_router(summarize_router)
app.include_router(user_router)
app.include_router(ai_router)

origins = ["http://localhost:5173", "http://localhost:3000"]

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
