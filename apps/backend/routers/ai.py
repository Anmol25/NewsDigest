import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import delete

from src.aggregator.model import SBERT
from src.database.session import get_async_db, get_db
from src.database.models import Users, ChatSession
from src.users.services import get_current_active_user
from routers.content import search_article
from src.ai.highlights import SearchHighlights
from src.ai.utils.db_queries import create_session, log_chat_message, get_chat_messages, get_chat_sessions
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
    session_id: str
    newSession: Optional[bool] = False


@router.post("/agent_test")
async def test_agent(request: ChatbotRequest, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user), sbert: SBERT = Depends(get_sbert)):
    user_query = request.user_query
    session_id = request.session_id
    new_session = request.newSession
    user_id = current_user.id

    if new_session:
        # Create a new Session in database
        await create_session(db, session_id, user_id)
    print("Session ID:", session_id)
    # Log User message in DB
    await log_chat_message(db, session_id, 'user', user_query, {})

    agent = NewsDigestAgent(sbert, db, user_id,
                            session_id, new_session)
    return StreamingResponse(agent.call_agent(user_query), media_type="application/x-ndjson")


@router.get("/chat_messages")
async def load_chat(sessionId: str, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)):
    messages = await get_chat_messages(
        db, sessionId, page, limit, current_user.id)
    return messages


@router.get("/chat_history")
async def chat_history(page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)):
    sessions = await get_chat_sessions(db=db, page=page, limit=limit, user_id=current_user.id)
    return sessions


@router.delete("/chat_session")
async def delete_chat_session(sessionId: str, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)):
    """Delete a single chat session for the current user."""
    try:
        # Verify session exists and belongs to current user
        session_obj = await db.get(ChatSession, sessionId)
        if not session_obj or session_obj.user_id != current_user.id:
            # Hide existence details for non-owners
            raise HTTPException(status_code=404, detail="Session not found")

        # Delete the session (messages will cascade)
        res_sess = await db.execute(
            delete(ChatSession).where(
                ChatSession.id == sessionId, ChatSession.user_id == current_user.id
            )
        )
        await db.commit()

        return {
            "deleted": True,
            "deleted_sessions": getattr(res_sess, "rowcount", None),
        }
    except HTTPException:
        # Pass through explicit HTTP errors
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting chat session {sessionId}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")


@router.delete("/chat_history")
async def clear_chat_history(db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)):
    """Delete all chat sessions for the current user."""
    try:
        # Delete the sessions for current user (messages will cascade)
        res_sess = await db.execute(
            delete(ChatSession).where(ChatSession.user_id == current_user.id)
        )
        await db.commit()

        return {
            "deleted": True,
            "deleted_sessions": getattr(res_sess, "rowcount", None),
        }
    except Exception as e:
        await db.rollback()
        logger.error(
            f"Error clearing chat history for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to clear chat history")
