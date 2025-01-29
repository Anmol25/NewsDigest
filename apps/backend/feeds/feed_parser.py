import aiohttp
import asyncio
import pytz
import feedparser
from dateutil import parser
from .deduplicator import Deduplicator


class FeedParser:

    @staticmethod
    async def fetch_xml(url: str) -> str:
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

    @staticmethod
    async def fetch_topics_feed(topic: dict) -> dict:
        """
        Function to fetch xml feeds for given topic
        Args:
            topic: Topic of News on which feed to be retrieved
        Return:
            data: XML data with respect to its publisher
        """
        tasks = []
        for publisher, url in topic.items():
            tasks.append(FeedParser.fetch_xml(url))
        result = await asyncio.gather(*tasks)
        data = {}
        for publisher, xml in zip(topic.keys(), result):
            data[publisher] = xml
        return data

    @staticmethod
    def extract_image_links(entry: str) -> str:
        """
        Extract the first image URL found in enclosure or media:content tags.

        Args:
            entry: xml data of rss feed
        Returns:
            str or None: url of image or None
        """
        # Check enclosure tags first (common in RSS)
        for enclosure in entry.get('enclosures', []):
            return enclosure['url']

        # Check media:content tags next (common in Media RSS)
        for media in entry.get('media_content', []):
            if media.get('medium') == 'image' and 'url' in media:
                return media['url']

        # Return None if no images found
        return None

    @staticmethod
    def parse_feed(pub_xml: dict, model, device: str) -> list:
        """
        Parse and Extract metadata from feed.
        Then Perform Deduplication and sort bases on publishing date.
        Args:
            pub_xml: Publisher and XML data in dict form
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU)
        Return:
            list: List of Articles
        """
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
                    'image_links': FeedParser.extract_image_links(entry),
                    'source': publisher
                }
                result.append(metadata)

        print("Length Before: ", len(result))
        # Deduplication using cosine similarity
        result = Deduplicator.deduplicate(result, model, device)
        # Sort by published time (newest first)
        result.sort(key=lambda x: x['published'], reverse=True)
        print("Length After: ", len(result))
        return result
