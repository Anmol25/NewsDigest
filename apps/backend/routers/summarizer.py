from fastapi import APIRouter
from summarizer.summarizer import Summarizer
from pydantic import BaseModel

router = APIRouter()

# Initialize Summarizer Model
dbart = Summarizer()


class ArticleUrl(BaseModel):
    url: str


@router.post("/summarize")
def summarize(request: ArticleUrl):
    url = request.url
    summary = dbart.infer(url)
    return {"data": summary}
