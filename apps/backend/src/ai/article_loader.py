from typing import List
from concurrent.futures import ThreadPoolExecutor

from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document

from src.articles.scraper import get_article


class ArticleLoader(BaseLoader):
    def __init__(self, article_list: List[dict]):
        self.articles = article_list

    def _fetch_and_create_document(self, item: dict) -> Document:
        """Helper function to fetch content and create a Document object for a single article."""
        page_content = get_article(item['link'])
        return Document(
            page_content=page_content if page_content else "",  # Ensure content is not None
            metadata={
                "title": item['title'],
                "published_date": item['date'],
                "source": item['source']
            }
        )

    def lazy_load(self):
        """Note: This lazy loader remains sequential as it's an iterator."""
        for item in self.articles:
            yield self._fetch_and_create_document(item)

    def load(self) -> List[Document]:
        """
        Fetches all articles in parallel using a thread pool and returns a list of Documents.
        """
        with ThreadPoolExecutor() as executor:
            results = list(executor.map(
                self._fetch_and_create_document, self.articles))

        return results
