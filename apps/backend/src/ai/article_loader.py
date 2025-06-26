from typing import AsyncIterator, Iterator, List

from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document

from src.articles.scraper import get_article


class ArticleLoader(BaseLoader):
    def __init__(self, article_list: List[dict]):
        self.articles = article_list

    def lazy_load(self):
        for item in self.articles:
            yield Document(
                page_content=get_article(item['link']),
                metadata={
                    "title": item['title'], "published_date": item['date'], "source": item['source']}
            )

    def load(self):
        items = []
        for item in self.articles:
            items.append(Document(
                page_content=get_article(item['link']),
                metadata={
                    "title": item['title'], "published_date": item['date'], "source": item['source']}
            ))
        return items
