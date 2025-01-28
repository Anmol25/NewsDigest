import asyncio
from .feed_parser import FeedParser  # Relative import


class RssFeed:
    def __init__(self):
        self._articles = None

    def get_articles(self):
        return self._articles

    def set_articles(self, articles):
        self._articles = articles

    @staticmethod
    async def fetch_articles(feeds, model, device):
        rss_feeds = feeds
        results = []
        for topic in rss_feeds:
            results.append(FeedParser.fetch_topics_feed(rss_feeds[topic]))

        responses = await asyncio.gather(*results)

        data = {}
        for topic, xml_data in zip(rss_feeds, responses):
            data[topic] = FeedParser.parse_feed(xml_data, model, device)
        return data

    async def refresh_articles(self, feeds, model, device):
        articles = await RssFeed.fetch_articles(feeds, model, device)
        self._articles = articles
