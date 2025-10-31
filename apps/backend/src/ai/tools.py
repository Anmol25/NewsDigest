from dataclasses import dataclass
from typing import Any, List, Optional, Annotated
import json
import asyncio

from langchain.tools import tool, ToolRuntime
from langchain_core.tools import InjectedToolCallId
from langgraph.config import get_stream_writer
from langgraph.runtime import get_runtime
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import ColumnElement

from src.aggregator.search import search_db
from src.ai.article_loader import ArticleLoader
from src.database.models import Articles


# BUG: Not using pydantic model for tool inputs due to langchain issue:
# See https://github.com/langchain-ai/langchain/issues/33646


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
    query: str = Field(
        description="The search query string. Should be a natural language query as search engine do hybrid search.")
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


# @tool("search_db", args_schema=SearchDBInput)
@tool("search_db")
async def search_db_tool(runtime: ToolRuntime[DBContext], query: str, recent: bool, skip: int = 0, limit: int = 10) -> str:
    """
    Search the internal NewsDigest database for articles similar to the given query.

    This tool performs a **hybrid search** that combines both **BM25 keyword matching** and 
    **vector similarity (semantic search)** using contextual embeddings. It can optionally 
    prioritize more recent articles when `recent` is set to True.

    Args:
        tool_call_id (str): 
            Unique identifier for the tool call, used for runtime tracking.
        query (str): 
            The search query string, written in natural language. The system interprets it 
            using both lexical and semantic methods for best relevance.
        recent (bool): 
            Whether to prioritize recent articles. Recommended `True` for up-to-date 
            information; set to `False` to emphasize overall relevance regardless of recency.
        skip (int, optional): 
            Number of results to skip for pagination. Defaults to `0`.
        limit (int, optional): 
            Maximum number of search results to return. Defaults to `10`.

    Returns:
        str: 
            A JSON-formatted string containing the list of retrieved articles and their 
            associated scores (BM25, vector, hybrid, recency, and combined).

    Notes:
        - The function does not perform any database writes; it only retrieves results.
        - The hybrid scoring system blends multiple ranking signals for improved accuracy.
    """
    model = runtime.context.model
    device = runtime.context.device
    db = runtime.context.db
    tool_call_id = runtime.tool_call_id

    writer = get_stream_writer()
    writer({"type": "tool", "tool_call_id": tool_call_id, "message": f"Searching Database for: {query}",
           "tool_status": "started"})

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
    writer({"type": "tool", "tool_call_id": tool_call_id, "tool_status": "ended"})
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


# @tool("scrape_articles", args_schema=ScrapeInput)
@tool("scrape_articles")
async def scrape_articles_tool(articles: List[ArticleSchema], runtime: ToolRuntime[DBContext]) -> str:
    # """Scrape articles from provided links and return their content and metadata as JSON."""
    """
    Scrape the content and metadata of the provided article links.

    This tool fetches full article text and related metadata (e.g., title, publication date, 
    and source) for a given list of article links. It is primarily used to extract and 
    standardize article data for further processing within the NewsDigest system.

    Args:
        articles (List[ArticleSchema]): 
            A list of article objects to scrape, each containing:
            - **link** (str): URL of the article (mandatory)
            - **title** (Optional[str]): Title of the article
            - **datetime** (Optional[str]): Publication date/time
            - **source** (Optional[str]): Source or publisher name

    Returns:
        str:
            A JSON-formatted string containing a list of scraped articles, where each entry 
            includes:
            - **page_content**: The extracted text content of the article.
            - **metadata**: The article’s metadata (title, link, source, datetime, etc.).

    Notes:
        - The `link` field is mandatory, as it is required for fetching the article content.
        - The tool uses `ArticleLoader` internally to handle fetching and parsing logic.
        - No database writes occur; results are returned directly as JSON for downstream use.
    """
    tool_call_id = runtime.tool_call_id
    writer = get_stream_writer()
    writer({"type": "tool", "tool_call_id": tool_call_id, "message": f"Scraping {len(articles)} articles...",
           "tool_status": "started"})
    loader = ArticleLoader(articles)
    # documents = loader.load()
    documents = await asyncio.to_thread(loader.load)

    result = [{"page_content": doc.page_content, "metadata": doc.metadata}
              for doc in documents]
    writer({"type": "tool", "tool_call_id": tool_call_id, "tool_status": "ended"})
    return f"Scraped {len(result)} articles:\n" + json.dumps(result, ensure_ascii=False, separators=(",", ":"))
