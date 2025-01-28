import asyncio
import aiohttp
# from sentence_transformers import SentenceTransformer


rss_feeds = {
    "Top Stories": {
        "Times Of India": "http://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",
        # "India TV": "https://www.indiatvnews.com/rssnews/topstory.xml"
    },
    "Latest": {
        "Times of India": "http://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
        "Economic Times": "https://economictimes.indiatimes.com/news/latest-news/rssfeeds/20989204.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-latest",
        # "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml"
    }
}


# # Load Sentence Transformer Model
# model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


async def fetch_xml(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()


async def fetch_topics_feed(topic: dict):
    tasks = []
    for publisher, url in topic.items():
        tasks.append(fetch_xml(url))
    result = await asyncio.gather(*tasks)
    data = {}
    for publisher, xml in zip(topic.keys(), result):
        data[publisher] = xml
    return data


class RssFeed:
    def __init__(self, feeds):
        # This Will Store artiles under various topics
        self._feeds = feeds
        self._articles = {}
        # Create Separate key value pair under various topics
        for key in feeds:
            self._articles[key] = []

    def get_articles(self):
        return self._articles

    def get_feeds(self):
        return self._feeds

    async def fetch_articles(self):
        rss_feeds = self.get_feeds()
        results = []
        for topic in rss_feeds:
            results.append(fetch_topics_feed(rss_feeds[topic]))

        responses = await asyncio.gather(*results)
        data = {}
        for topic, xml_data in zip(rss_feeds, responses):
            data[topic] = xml_data
        return data


if __name__ == "__main__":
    test = RssFeed(rss_feeds)
    articles = test.get_articles()

    ok = asyncio.run(test.fetch_articles())
