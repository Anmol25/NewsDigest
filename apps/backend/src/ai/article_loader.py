from typing import List
from concurrent.futures import ThreadPoolExecutor

from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document
from pydantic import BaseModel, Field
from typing import Any, List, Optional

from src.articles.scraper import get_article


class ArticleSchema(BaseModel):
    link: str = Field(...,
                      description="Link to the article, (Mandatory for scraping)")
    title: Optional[str] = Field(..., description="Title of the article")
    datetime: Optional[str] = Field(...,
                                    description="Publication date of the article")
    source: Optional[str] = Field(..., description="Source of the article")


class ArticleLoader(BaseLoader):
    def __init__(self, links_list: List[dict]):
        self.links = links_list

    def _fetch_and_create_document(self, item: ArticleSchema) -> Document:
        """Helper function to fetch content and create a Document object for a single article."""
        page_content = get_article(item)
        metadata = {
            "link": item
        }
        return Document(
            page_content=page_content if page_content else "",  # Ensure content is not None
            metadata=metadata
        )

    def lazy_load(self):
        """Note: This lazy loader remains sequential as it's an iterator."""
        for item in self.links:
            yield self._fetch_and_create_document(item)

    def load(self) -> List[Document]:
        """
        Fetches all articles in parallel using a thread pool and returns a list of Documents.
        """
        with ThreadPoolExecutor() as executor:
            results = list(executor.map(
                self._fetch_and_create_document, self.links))

        return results
