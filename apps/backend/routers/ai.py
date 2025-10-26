import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from src.aggregator.model import SBERT
from src.database.session import get_async_db, get_db
from src.database.models import Users
from src.users.services import get_current_active_user
from routers.content import search_article
from src.ai.highlights import SearchHighlights
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


@router.get("/agent_test")
async def test_agent(input: str, session_id: str, db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user), sbert: SBERT = Depends(get_sbert)):
    Session_id = session_id
    new_session = False
    agent = NewsDigestAgent(sbert, db, Session_id, new_session, input)
    return StreamingResponse(agent.call_agent(), media_type="application/json")
