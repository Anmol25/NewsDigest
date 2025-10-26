import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from src.aggregator.model import SBERT
from src.database.session import get_async_db, get_db
from src.database.models import Users
from src.users.services import get_current_active_user
from routers.content import search_article
from src.ai.highlights import SearchHighlights
from src.ai.utils.db_queries import create_session, log_chat_message
from fastapi.responses import StreamingResponse
from src.ai.agent import NewsDigestAgent

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency to access SBERT created in main and stored on app.state


def get_sbert(request: Request) -> SBERT:
    s = getattr(request.app.state, "sbert", None)
    if s is None:
        raise HTTPException(status_code=500, detail="SBERT not initialized")
    return s


@router.get("/highlights")
async def get_hightlights(query: str, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user), sbert: SBERT = Depends(get_sbert)):
    res = await search_article(query, page=1, limit=5, db=db, current_user=current_user, sbert=sbert)
    if not res:
        return []
    articles = [
        {
            'title': item['title'],
            'link': item['link'],
            'datetime': item['published_date'],
            'source': item['source']
        }
        for item in res
    ]
    s_high = SearchHighlights()
    highlights = await s_high.get_highlights(query, articles)
    return StreamingResponse(highlights, media_type="text/plain")


class ChatbotRequest(BaseModel):
    user_query: str
    session_id: Optional[str] = None


@router.post("/agent_test")
async def test_agent(request: ChatbotRequest, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user), sbert: SBERT = Depends(get_sbert)):
    user_query = request.user_query
    session_id, new_session = None, False
    user_id = current_user.id
    if request.session_id:
        session_id = request.session_id
        new_session = False
    else:
        session_id = str(uuid.uuid4())
        new_session = True
        # Create a new Session in database
        await create_session(db, session_id, user_id)
    print("Session ID:", session_id)
    # Log User message in DB
    await log_chat_message(db, session_id, 'user', user_query, {})

    agent = NewsDigestAgent(sbert, db, user_id,
                            session_id, new_session)
    return StreamingResponse(agent.call_agent(user_query), media_type="application/json")
