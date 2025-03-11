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
def summarize(id: int, db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)):
    try:
        articleid = id
        # Check article in db
        article = db.query(Articles).filter(
            Articles.id == articleid).first()
        if article:
            update_user_history(db, current_user.id, article.id)
            # Retrieve Summary if available
            if article.summary:
                return {"data": article.summary}
            else:
                generated_summary = dbart.infer(article.link)
                article.summary = generated_summary
                db.commit()
                return {"data": generated_summary}
    except Exception as e:
        raise HTTPException(status_code=404, detail={
                            "Article Summary Not Found"})
