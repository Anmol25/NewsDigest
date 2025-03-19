import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database.session import get_db
from database.operations import get_user_history
from database.models import Users, UserLikes, UserBookmarks
from users.services import get_current_active_user
from pydantic import BaseModel
from datetime import datetime
from zoneinfo import ZoneInfo


logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/userhistory")
async def get_current_user_history(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Returns the History of current history."""
    try:
        if current_user:
            history = get_user_history(current_user.id, db)
            return history
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not logged in.")
    except Exception as e:
        logger.error(f"Error in retrieving current user history: {e}")


class ArticleRequest(BaseModel):
    article_id: int


@router.post("/like")
async def like_article(request: ArticleRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Like an article for a specific user"""
    article_id = request.article_id
    if current_user:
        like = db.query(UserLikes).filter(
            UserLikes.user_id == current_user.id, UserLikes.article_id == article_id).first()
        if like:
            db.delete(like)
        else:  # Like article
            like = UserLikes(user_id=current_user.id, article_id=article_id,
                             liked_at=datetime.now(ZoneInfo("UTC")))
            db.add(like)
        db.commit()
        return True
    return False


@router.post("/bookmark")
async def bookmark_article(request: ArticleRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Bookmark an article for a specific user"""
    article_id = request.article_id
    if current_user:
        bookmark = db.query(UserBookmarks).filter(
            UserBookmarks.user_id == current_user.id, UserBookmarks.article_id == article_id).first()
        if bookmark:
            db.delete(bookmark)
        else:
            bookmark = UserBookmarks(user_id=current_user.id, article_id=article_id,
                                     bookmarked_at=datetime.now(ZoneInfo("UTC")))
            db.add(bookmark)
        db.commit()
        return True
    return False
