import asyncio
from .feed_parser import FeedParser  # Relative import
from datetime import datetime


class Feeds:
    def __init__(self):
        self._articles = None

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

    @staticmethod
    async def fetch_articles(feeds: dict, model, device: str, last_stored_time: datetime) -> dict:
        """
        Fetch and Parse RSS Feeds

        Args:
            feeds: Rss Feeds in form of a dictionary
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU)
        Returns:
            data: Articles Topicwise in a dict format
        """
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
                topic, xml_data, model, device, last_stored_time))
        return articles

    async def refresh_articles(self, feeds: dict, model, device: str, last_stored_time: datetime) -> dict:
        """
        Refreshes and Updates Articles

        Args:
            feeds: Rss Feeds in form of a dictionary
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU) 
        """
        articles = await Feeds.fetch_articles(feeds, model, device, last_stored_time)
        self._articles = articles
