import asyncio
from .feed_parser import FeedParser
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Feeds:
    def __init__(self, sbert):
        self._articles = None
        self._model = sbert.model
        self._device = sbert.device

    def get_articles(self):
        """
        Get Articles
        Returns:
            articles: articles stored in current object
        """
        return self._articles

    def set_articles(self, articles: dict):
        """
        Update Articles
        Args:
            articles: dict of articles topic wise
        """
        self._articles = articles

    async def fetch_articles(self, feeds: dict, last_stored_time: datetime) -> dict:
        """
        Fetch and Parse RSS Feeds

        Args:
            feeds: Rss Feeds in form of a dictionary
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU)
        Returns:
            data: Articles Topicwise in a dict format
        """
        try:
            rss_feeds = feeds
            results = []
            for topic in rss_feeds:
                results.append(FeedParser.fetch_topics_feed(rss_feeds[topic]))
            # Get XML Data For Each Topic in list
            responses = await asyncio.gather(*results)
            # Parse Feeds and append them all in list
            articles = []
            for topic, xml_data in zip(rss_feeds, responses):
                articles.extend(FeedParser.parse_feed(
                    topic, xml_data, self._model, self._device, last_stored_time))
            return articles
        except Exception as e:
            logger.error(f"Error in Fetching Feeds: {e}")

    async def refresh_articles(self, feeds: dict,  last_stored_time: datetime) -> dict:
        """
        Refreshes and Updates Articles

        Args:
            feeds: Rss Feeds in form of a dictionary
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU) 
        """
        try:
            articles = await self.fetch_articles(feeds, last_stored_time)
            self._articles = articles
            logger.debug("Saved New Articles")
        except Exception as e:
            logger.error(f"Error in Refreshing Articles: {e}")
