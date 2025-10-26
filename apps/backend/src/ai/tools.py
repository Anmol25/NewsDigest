from dataclasses import dataclass
from typing import Any, List, Optional

from langchain.tools import tool, ToolRuntime
from langgraph.config import get_stream_writer
from langgraph.runtime import get_runtime
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import ColumnElement

from src.aggregator.search import search_db
from src.ai.article_loader import ArticleLoader
from src.database.models import Articles
import json


async def retrieve_articles_db(
    db: AsyncSession,
    offset: int,
    limit: int,
    hybrid_score: ColumnElement,
    combined_score: ColumnElement,
    recent: bool,
    *columns: ColumnElement,
    min_score: float = 0.18,
) -> List[dict]:
    """
    Async variant that retrieves articles using SQLAlchemy Core with AsyncSession.
    Applies a minimum hybrid score filter and optional recency ordering.
    """
    QUERY_STRUCTURE = (
        Articles.id,
        Articles.title,
        Articles.link,
        Articles.published_date,
        Articles.source,
    )

    stmt = select(*QUERY_STRUCTURE, *columns).where(hybrid_score >= min_score)
    if recent:
        stmt = stmt.order_by(combined_score.desc())

    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    rows = result.mappings().all()  # synchronous consumption of result

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "link": r["link"],
            "datetime": r["published_date"],
            "source": r["source"]
        }
        for r in rows
    ]


@dataclass
class DBContext:
    model: Any
    device: str
    db: AsyncSession


class SearchDBInput(BaseModel):
    query: str = Field(description="The search query string.")
    recent: bool = Field(
        True,
        description=(
            "Whether to prioritize recent articles. Recommended True for up-to-date info; "
            "False for most relevant regardless of recency."
        ),
    )
    skip: int = Field(
        0, description="Number of results to skip for pagination.")
    limit: int = Field(25, description="Maximum number of results to return.")


@tool("search_db", args_schema=SearchDBInput)
async def search_db_tool(query: str, recent: bool, skip: int = 0, limit: int = 10) -> str:
    """Search Internal Database of NewsDigest for similar articles based on query (str)."""
    writer = get_stream_writer()
    writer({"type": "tool", "message": f"Searching Database for: {query}",
           "tool_status": "started"})

    runtime: ToolRuntime[DBContext] = get_runtime(DBContext)
    model = runtime.context.model
    device = runtime.context.device
    db = runtime.context.db

    # Build SQL expressions for scores (no DB call here)
    bm25_score, vector_score, hybrid_score, recency_score, combined_score = search_db(
        query, model, device)

    articles = await retrieve_articles_db(
        db,
        skip,
        limit,
        hybrid_score,
        combined_score,
        recent,
        bm25_score.label("bm25_score"),
        vector_score.label("vector_score"),
        hybrid_score.label("hybrid_score"),
        recency_score.label("recency_score"),
        combined_score.label("combined_score"),
    )
    writer({"type": "tool", "tool_status": "ended"})
    return f"Found {len(articles)} articles:\n" + json.dumps(articles, default=str, separators=(",", ":"))


class ArticleSchema(BaseModel):
    link: str = Field(...,
                      description="Link to the article, (Mandatory for scraping)")
    title: Optional[str] = Field(..., description="Title of the article")
    datetime: Optional[str] = Field(...,
                                    description="Publication date of the article")
    source: Optional[str] = Field(..., description="Source of the article")


class ScrapeInput(BaseModel):
    articles: List[ArticleSchema] = Field(
        description="List of articles to scrape with keys: link, title, datetime, source."
    )


@tool("scrape_articles", args_schema=ScrapeInput)
async def scrape_articles_tool(articles: List[dict]) -> str:
    """Scrape articles from provided links and return their content and metadata as JSON."""
    writer = get_stream_writer()
    writer({"type": "tool", "message": f"Scraping {len(articles)} articles...",
           "tool_status": "started"})

    loader = ArticleLoader(articles)
    documents = loader.load()

    result = [{"page_content": doc.page_content, "metadata": doc.metadata}
              for doc in documents]
    writer({"type": "tool", "tool_status": "ended"})
    return f"Scraped {len(result)} articles:\n" + json.dumps(result, ensure_ascii=False, separators=(",", ":"))
