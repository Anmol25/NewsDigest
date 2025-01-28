import asyncio
import aiohttp
import feedparser
from datetime import datetime
import pytz
from dateutil import parser
import numpy as np
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer


rss_feeds = {
    "Top Stories": {
        # "Times Of India": "http://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        # "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "India TV": "https://www.indiatvnews.com/rssnews/topstory.xml"
    },
    "Latest": {
        "Times of India": "http://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
        "Economic Times": "https://economictimes.indiatimes.com/news/latest-news/rssfeeds/20989204.cms",
        # "NDTV": "https://feeds.feedburner.com/ndtvnews-latest",
        # "Hindustan Times": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml"
    }
}


# ## Load Sentence Transformer Model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


async def fetch_xml(url):
    """
    Function to fetch xml data from the given url
    Args:
        url: str: url of the xml data
    Returns:
        str: xml data
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()


async def fetch_topics_feed(topic: dict):
    """
    Function to fetch xml feeds for given topic
    Args:
        topic: Topic of News on which feed to be retrieved
    Return:
        data: XML data with respect to its publisher
    """
    tasks = []
    for publisher, url in topic.items():
        tasks.append(fetch_xml(url))
    result = await asyncio.gather(*tasks)
    data = {}
    for publisher, xml in zip(topic.keys(), result):
        data[publisher] = xml
    return data


def extract_image_links(entry):
    """Extract the first image URL found in enclosure or media:content tags."""
    # Check enclosure tags first (common in RSS)
    for enclosure in entry.get('enclosures', []):
        if enclosure.get('type', '').startswith('image/'):
            return enclosure['url']

    # Check media:content tags next (common in Media RSS)
    for media in entry.get('media_content', []):
        if media.get('medium') == 'image' and 'url' in media:
            return media['url']

    # Return None if no images found
    return None


def perform_deduplication(pub_xml: dict, model, device):
    result = []
    ist = pytz.timezone('Asia/Kolkata')

    # Parse and collect metadata with time conversion
    for publisher, xml in pub_xml.items():
        feed = feedparser.parse(xml)
        for entry in feed.entries:
            # Convert published time to IST
            published_time = parser.parse(entry.get('published'))
            if published_time.tzinfo is None:  # Handle naive datetime
                published_time = pytz.utc.localize(published_time)
            published_time = published_time.astimezone(ist)

            metadata = {
                'title': entry.get('title'),
                'link': entry.get('link'),
                'published': published_time,
                'image_links': extract_image_links(entry),
                'source': publisher
            }
            result.append(metadata)
    print("Length Before: ", len(result))
    # Deduplication using cosine similarity
    if len(result) > 0:
        # Generate embeddings
        titles = [item['title'] for item in result]

        embeddings = model.encode(titles, device=device)

        # Find duplicates using cosine similarity
        to_remove = set()
        for i in range(len(embeddings)):
            for j in range(i+1, len(embeddings)):
                similarity = 1 - cosine(embeddings[i], embeddings[j])
                if similarity > 0.85:
                    to_remove.add(j)

        # Filter out duplicates
        result = [item for idx, item in enumerate(
            result) if idx not in to_remove]

    # Sort by published time (newest first)
    result.sort(key=lambda x: x['published'], reverse=True)
    print("Length After: ", len(result))
    return result


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

    async def fetch_articles(self, model, device):
        rss_feeds = self.get_feeds()
        results = []
        for topic in rss_feeds:
            results.append(fetch_topics_feed(rss_feeds[topic]))

        responses = await asyncio.gather(*results)

        data = {}
        for topic, xml_data in zip(rss_feeds, responses):
            data[topic] = perform_deduplication(xml_data, model, device)
        return data


if __name__ == "__main__":
    test = RssFeed(rss_feeds)
    articles = test.get_articles()

    ok = asyncio.run(test.fetch_articles())
