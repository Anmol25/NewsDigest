"""
summarizer.py
This module provides an API endpoint for summarizing articles.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.summarizer.summarizer import Summarizer
from src.database.session import get_db, get_async_db
from src.database.models import Articles, Users
from src.database.operations import update_user_history
from src.users.services import get_current_active_user


logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Summarizer Model
dbart = Summarizer()


class ArticleUrl(BaseModel):
    url: str


@router.get("/summarize")
async def summarize(id: int, update_history: bool = True, db: AsyncSession = Depends(get_async_db), current_user: Users = Depends(get_current_active_user)):
    """Summarize an article by its ID.

    Args:
        id (int): Article ID
        update_history (bool): Flag to update user history
        db (Session): Database session
        current_user (Users): Current active user

    Returns:
        dict: Summary of the article

    Raises:
        HTTPException: If article not found or summarization fails
    """
    try:
        result = await db.execute(select(Articles).where(Articles.id == id))
        article = result.scalar_one_or_none()
        if not article:
            raise HTTPException(
                status_code=404,
                detail="Article not found"
            )
        # If summary already exists, return it
        if article.summary:
            if update_history:
                await update_user_history(db, current_user.id, article.id)
            return {"data": article.summary}
        # Try to generate new summary
        try:
            generated_summary = dbart.infer(article.link)
            article.summary = generated_summary
            await db.commit()
            if update_history:
                await update_user_history(db, current_user.id, article.id)
            return {"data": generated_summary}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate summary: {str(e)}"
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
