import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.database.models import Articles, Users
from src.users.services import get_current_active_user
from routers.aggregator import search_article
from src.ai.highlights import SearchHighlights
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/highlights")
async def get_hightlights(query: str, db: Session = Depends(get_db), current_user: Users = Depends(get_current_active_user)):
    res = await search_article(query, page=1, limit=5, db=db, current_user=current_user)
    if not res:
        return []
    articles = [
        {
            'title': item['title'],
            'link': item['link'],
            'date': item['published_date'],
            'source': item['source']
        }
        for item in res
    ]
    s_high = SearchHighlights()
    highlights = await s_high.get_highlights(query, articles)
    return StreamingResponse(highlights, media_type="text/plain")
