"""
summarizer.py
This module provides an API endpoint for summarizing articles.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from summarizer.summarizer import Summarizer
from pydantic import BaseModel
from database.session import get_db
from database.models import Articles, Users
from database.operations import update_user_history
from sqlalchemy.orm import Session
from users.services import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Summarizer Model
dbart = Summarizer()


class ArticleUrl(BaseModel):
    url: str


@router.get("/summarize")
def summarize(id: int, update_history: bool = True, db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)):
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
        article = db.query(Articles).filter(Articles.id == id).first()
        if not article:
            raise HTTPException(
                status_code=404,
                detail="Article not found"
            )
        # If summary already exists, return it
        if article.summary:
            if update_history:
                update_user_history(db, current_user.id, article.id)
            return {"data": article.summary}
        # Try to generate new summary
        try:
            generated_summary = dbart.infer(article.link)
            article.summary = generated_summary
            db.commit()
            if update_history:
                update_user_history(db, current_user.id, article.id) 
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
