"""
userops.py
This module contains the user operations routes for liking, bookmarking, subscribing to sources, updating profile, and managing user history.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import Users, UserLikes, UserBookmarks, Sources, UserSubscriptions, UserHistory
from users.services import get_current_active_user, verify_password, get_password_hash
from pydantic import BaseModel
from datetime import datetime, timezone


logger = logging.getLogger(__name__)

router = APIRouter()

class ArticleRequest(BaseModel):
    article_id: int


@router.post("/like")
async def like_article(request: ArticleRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Like an article for a specific user.

    Args:
        request (ArticleRequest): Article ID.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        bool: True if liked, False otherwise."""
    article_id = request.article_id
    if current_user:
        like = db.query(UserLikes).filter(
            UserLikes.user_id == current_user.id, UserLikes.article_id == article_id).first()
        if like:
            db.delete(like)
        else:  # Like article
            like = UserLikes(user_id=current_user.id, article_id=article_id,
                             # Use timezone.utc
                             liked_at=datetime.now(timezone.utc))
            db.add(like)
        db.commit()
        return True
    return False


@router.post("/bookmark")
async def bookmark_article(request: ArticleRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Bookmark an article for a specific user.

    Args:
        request (ArticleRequest): Article ID.
        current_user (Users): Current active user.
        db (Session): Database session.
    Returns:
        bool: True if bookmarked, False otherwise."""
    article_id = request.article_id
    if current_user:
        bookmark = db.query(UserBookmarks).filter(
            UserBookmarks.user_id == current_user.id, UserBookmarks.article_id == article_id).first()
        if bookmark:
            db.delete(bookmark)
        else:
            bookmark = UserBookmarks(user_id=current_user.id, article_id=article_id,
                                     # Use timezone.utc
                                     bookmarked_at=datetime.now(timezone.utc))
            db.add(bookmark)
        db.commit()
        return True
    return False


class SubscriptionsRequest(BaseModel):
    source: str


@router.post("/subscribe")
async def add_subscriptions(request: SubscriptionsRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Subscribe or unsubscribe to a source.

    Args:
        request (SubscriptionsRequest): Source name.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: Subscription status."""
    try:
        source = request.source
        source_id = db.query(Sources.id).filter(
            Sources.source == source).first()

        # If Source exists extract id else None
        source_id = source_id[0] if source_id else None
        if not source_id:
            raise HTTPException(status_code=404, detail="Source not found")

        subscription = db.query(UserSubscriptions).filter(
            UserSubscriptions.user_id == current_user.id,
            UserSubscriptions.source_id == source_id
        ).first()

        if subscription:  # Unsubscribe
            db.delete(subscription)
            db.commit()
            return {"data": "unsubscribed", "status": "success"}
        else:
            subscription = UserSubscriptions(
                user_id=current_user.id, source_id=source_id
            )
            db.add(subscription)
            db.commit()
            return {"data": "subscribed", "status": "success"}
    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions
    except Exception as e:
        db.rollback()  # Rollback in case of any error
        logger.error(f"Error in subscribing to source: {e}")
        raise HTTPException(
            status_code=500, detail=f"An error occurred: {str(e)}"
        )


@router.get("/getuser")
async def get_user(current_user: Users = Depends(get_current_active_user)):
    """Get current user details.

    Args:
        current_user (Users): Current active user.

    Returns:
        dict: Current user details."""
    if current_user:
        return {"username": current_user.username, "fullname": current_user.fullname, "email": current_user.email}
    logger.error("User not logged in")
    raise HTTPException(
        status_code=401, detail="User not logged in.")


class UpdateProfile(BaseModel):
    fullname: str
    email: str


@router.post("/updateprofile")
async def update_profile(request: UpdateProfile, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update User Profile.

    Args:
        request (UpdateProfile): User profile details.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: Profile update status."""
    user = db.query(Users).filter(Users.id == current_user.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.fullname = request.fullname
        user.email = request.email
        db.commit()
        db.refresh(user)  # Refresh user instance with updated values
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error in updating profile: {e}")
        db.rollback()  # Rollback changes in case of failure
        raise HTTPException(
            status_code=500, detail=f"Error updating profile: {str(e)}")


@router.get("/deleteaccount")
async def delete_user(response: Response, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Delete User Account.

    Args:
        response (Response): Response object.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: Account deletion status."""
    try:
        user = db.query(Users).filter(Users.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        response.delete_cookie("refresh_token")
        return {"message": "User Deleted"}
    except Exception as e:
        logger.error(f"Error in deleting user: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error deleting user: {str(e)}")


class UpdatePassword(BaseModel):
    oldPassword: str
    newPassword: str


@router.post("/updatepassword")
async def update_password(request: UpdatePassword, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update User Password.

    Args:
        request (UpdatePassword): Password details.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: Password update status."""
    user = db.query(Users).filter(Users.id == current_user.id).first()
    if verify_password(request.oldPassword, user.hashed_password):
        try:
            newPasswordhash = get_password_hash(request.newPassword)
            user.hashed_password = newPasswordhash
            db.commit()
        except:
            db.rollback()
            raise HTTPException(
                status_code=500, detail="Some Error occurred in updating password")
        return {"data": "Password Updated Successfully"}
    raise HTTPException(
        status_code=400, detail="Current Password is incorrect")


@router.get("/clearhistory")
async def clear_history(current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Clear User History.

    Args:
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: History clearance status."""
    try:
        db.query(UserHistory).filter(
            UserHistory.user_id == current_user.id).delete()
        db.commit()
        return {"message": "User history cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error clearing user history: {str(e)}")


@router.get("/delete-history-item")
async def delete_history_item(id: int, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Delete single history item.

    Args:
        id (int): Article ID.
        current_user (Users): Current active user.
        db (Session): Database session.

    Returns:
        dict: Deletion status."""
    try:
        item = db.query(UserHistory).filter(UserHistory.user_id ==
                                            current_user.id, UserHistory.article_id == id).first()
        db.delete(item)
        db.commit()
        return {"data": "Deleted Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error in deleting history item: {str(e)}")
