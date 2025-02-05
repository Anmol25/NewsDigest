from fastapi import APIRouter, Depends, HTTPException
from summarizer.summarizer import Summarizer
from pydantic import BaseModel
from database.session import get_db
from database.models import Articles
from sqlalchemy.orm import Session
from sqlalchemy import select, exists

router = APIRouter()

# Initialize Summarizer Model
dbart = Summarizer()


class ArticleUrl(BaseModel):
    url: str


@router.post("/summarize")
def summarize(request: ArticleUrl, db: Session = Depends(get_db)):
    try:
        # retirieve url
        url = request.url
        # Check Entry of url in db
        stmt = select(exists().where(Articles.link == url))
        if (db.execute(stmt).scalar()):
            # Retrieve Summary if available
            summary = db.query(Articles.summary).filter(
                Articles.link == url).first()
            # if summary available return
            if summary[0]:
                return {"data": summary[0]}
            else:
                # Generate summary and then add to db then return
                generated_summary = dbart.infer(url)
                db.query(Articles).filter(Articles.link ==
                                          url).update({"summary": generated_summary})
                db.commit()
                return {"data": generated_summary}
        # Else generate summary and return summary
        summary = dbart.infer(url)
        return {"data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
