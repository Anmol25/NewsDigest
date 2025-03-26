import logging
from fastapi import APIRouter, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session
from database.session import get_db
from database.operations import get_user_history
from database.models import Users, UserLikes, UserBookmarks, Sources, UserSubscriptions, UserHistory
from users.services import get_current_active_user, verify_password, get_password_hash
from pydantic import BaseModel
from datetime import datetime, timezone


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
                             liked_at=datetime.now(timezone.utc))  # Use timezone.utc
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
                                     bookmarked_at=datetime.now(timezone.utc))  # Use timezone.utc
            db.add(bookmark)
        db.commit()
        return True
    return False


class SubscriptionsRequest(BaseModel):
    source: str


@router.post("/subscribe")
async def add_subscriptions(request: SubscriptionsRequest, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    source = request.source
    source_id = db.query(Sources.id).filter(
        Sources.source == source).first()
    # If Source exists extract id else None
    source_id = source_id[0] if source_id else None
    if source_id:
        subscription = db.query(UserSubscriptions).filter(UserSubscriptions.user_id == current_user.id,
                                                          UserSubscriptions.source_id == source_id).first()
        if subscription:  # Unsubscribe
            db.delete(subscription)
            db.commit()
            return {"data": "unsubscribed"}
        else:
            subscription = UserSubscriptions(
                user_id=current_user.id, source_id=source_id)
            db.add(subscription)
            db.commit()
            return {"data": "subscribed"}
    return {"data": "Some error occured"}


@router.get("/getuser")
async def get_user(current_user: Users = Depends(get_current_active_user)):
    if current_user:
        return {"username": current_user.username, "fullname": current_user.fullname, "email": current_user.email}
    return None


class UpdateProfile(BaseModel):
    fullname: str
    email: str


@router.post("/updateprofile")
async def update_profile(request: UpdateProfile, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update User Profile"""
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
        db.rollback()  # Rollback changes in case of failure
        raise HTTPException(
            status_code=500, detail=f"Error updating profile: {str(e)}")


@router.get("/deleteaccount")
async def delete_user(response: Response, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == current_user.id).first()
    db.delete(user)
    db.commit()
    response.delete_cookie("refresh_token")
    return {"message": "User Deleted"}


class UpdatePassword(BaseModel):
    oldPassword: str
    newPassword: str


@router.post("/updatepassword")
async def update_password(request: UpdatePassword, current_user: Users = Depends(get_current_active_user), db: Session = Depends(get_db)):
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
    """Clear User History"""
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
    """Delete single history item"""
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
