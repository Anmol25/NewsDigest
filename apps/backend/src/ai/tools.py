from langchain.tools import tool, ToolRuntime
from langgraph.runtime import get_runtime
from pydantic import BaseModel, Field
from dataclasses import dataclass
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from src.aggregator.search import search_db
from sqlalchemy.sql import ColumnElement
from src.database.models import Articles
import json
from src.ai.article_loader import ArticleLoader


def retrieve_articles_db(db: Session, offset, limit, hybrid_score, combined_score, recent, *columns: ColumnElement, min_score: float = 0.18):
    QUERY_STRUCTURE = (
        Articles.id,
        Articles.title,
        Articles.link,
        Articles.published_date,
        Articles.source,
    )
    base_query = db.query(*QUERY_STRUCTURE, *
                          columns)

    # Apply hybrid score filter (elimination) and combined score ordering
    filtered_query = base_query.filter(hybrid_score >= min_score)

    if recent:
        filtered_query = filtered_query.order_by(combined_score.desc())

    articles = filtered_query.offset(offset).limit(limit).all()

    return [
        {
            'id': item.id,
            'title': item.title,
            'link': item.link,
            'datetime': item.published_date,
            'source': item.source
        }
        for item in articles
    ]


@dataclass
class DBContext:
    model: Any
    device: str
    db: Session


class SearchDBInput(BaseModel):
    query: str = Field(description="The search query string.")
    recent: bool = Field(True, description="Whether to prioritize recent articles. "
                         "Recommended to be True if you want the most up-to-date relevant information. "
                         "Else, set to False to get the most relevant articles regardless of recency.")
    skip: int = Field(
        0, description="Number of results to skip for pagination.")
    limit: int = Field(25, description="Maximum number of results to return.")


@tool("search_db", args_schema=SearchDBInput)
def search_db_tool(query: str, recent: bool, skip: int = 0, limit: int = 10) -> str:
    """Search Internal Database of NewsDigest for similar articles based on query (str)."""
    runtime = get_runtime(DBContext)
    model = runtime.context.model
    device = runtime.context.device
    db = runtime.context.db

    bm25_score, vector_score, hybrid_score, recency_score, combined_score = search_db(
        query, model, device)

    articles = retrieve_articles_db(
        db,
        skip,
        limit,
        hybrid_score,
        combined_score,
        recent,
        bm25_score.label('bm25_score'),
        vector_score.label('vector_score'),
        hybrid_score.label('hybrid_score'),
        recency_score.label('recency_score'),
        combined_score.label('combined_score')
    )

    return f"Found {len(articles)} articles:\n" + json.dumps(articles, default=str, separators=(',', ':'))


class ArticleSchema(BaseModel):
    link: str = Field(...,
                      description="Link to the article, (Mandatory for scraping)")
    title: Optional[str] = Field(..., description="Title of the article")
    datetime: Optional[str] = Field(...,
                                    description="Publication date of the article")
    source: Optional[str] = Field(..., description="Source of the article")


class ScrapeInput(BaseModel):
    articles: List[ArticleSchema] = Field(
        description="List of articles to scrape with keys: link, title, datetime, source.")


@tool("scrape_articles", args_schema=ScrapeInput)
def scrape_articles_tool(articles: List[dict]) -> str:
    """Scrape articles from provided links and return their content and metadata as JSON."""
    loader = ArticleLoader(articles)
    documents = loader.load()

    result = []
    for doc in documents:
        result.append({
            "page_content": doc.page_content,
            "metadata": doc.metadata
        })

    return f"Scraped {len(result)} articles:\n" + json.dumps(result, ensure_ascii=False, separators=(',', ':'))
