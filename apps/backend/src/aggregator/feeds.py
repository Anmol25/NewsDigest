"""
feeds.py
This module fetches and parses RSS feeds for the aggregator.
"""

import asyncio
import logging

from .feed_parser import FeedParser

logger = logging.getLogger(__name__)


class Feeds:
    def __init__(self, sbert):
        self._articles = None
        self.model = sbert.model
        self.device = sbert.device

    def get_articles(self):
        return self._articles

    def set_articles(self, articles: dict):
        self._articles = articles

    async def fetch_articles(self, feeds: dict) -> dict:
        """
        Fetch and Parse RSS Feeds

        Args:
            feeds: Rss Feeds in form of a dictionary
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
                    topic, xml_data))
            logger.debug(f"Fetched {len(articles)} Articles")
            # Deduplicate Articles
            logger.debug("Deduplicating Articles")
            # Attach embeddings to articles (mutates list)
            try:
                FeedParser.add_embeddings(articles, self.model, self.device)
            except Exception as e:
                logger.error(f"Error adding embeddings to articles: {e}")

            # Simple deduplication (by link, then by (title, source))
            result = FeedParser.simple_deduplicate(articles)
            return result
        except Exception as e:
            logger.error(f"Error in Fetching Feeds: {e}")

    async def refresh_articles(self, feeds: dict) -> dict:
        """
        Refreshes and Updates Articles

        Args:
            feeds: Rss Feeds in form of a dictionary
            device: Device to run model on (CPU/GPU) 
        """
        try:
            articles = await self.fetch_articles(feeds)
            self.set_articles(articles)
            logger.debug("Saved New Articles")
        except Exception as e:
            logger.error(f"Error in Refreshing Articles: {e}")
