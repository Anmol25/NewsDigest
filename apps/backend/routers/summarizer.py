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


@router.post("/summarize")
def summarize(request: ArticleUrl, db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)):
    try:
        # Retrieve url
        url = request.url
        # Check Entry of url in DB
        article = db.query(Articles).filter(Articles.link == url).first()
        if article:
            # Update user history:
            update_user_history(db, current_user.id, article.id)
            # Retrieve Summary if available
            if article.summary:
                return {"data": article.summary}
            else:
                # Generate summary and then add to DB
                generated_summary = dbart.infer(url)
                article.summary = generated_summary
                db.commit()
                # Return New generated summary
                return {"data": generated_summary}
        # If no entry then generate summary and return summary
        summary = dbart.infer(url)
        if summary:
            return {"data": summary}
        else:
            return {"data": "Error in Generating Summary. Please refer to original article"}
    except Exception as e:
        logger.error(f"Error in sending summary request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
