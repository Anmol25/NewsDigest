import aiohttp
import asyncio
import pytz
import feedparser
from dateutil import parser
from .deduplicator import Deduplicator
import re


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
        async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
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
    def extract_image_link(entry: str) -> str:
        """
        Extract the image URL found in enclosure or media:content tags.

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
    def correct_time_components(s: str) -> str:
        """
        Correct invalid time components (hours >=24, minutes >=60, seconds >=60) in a datetime string.
        Each invalid component is reset to '00' without affecting other parts.
        """
        time_pattern = re.compile(
            r'(\d{1,2}):(\d{1,2}):(\d{1,2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?'
        )
        match = time_pattern.search(s)
        if not match:
            return s

        hours, minutes, seconds, fractional, tz = match.groups()
        fractional = fractional or ''
        tz = tz or ''

        # Correct hours
        try:
            hours_int = int(hours)
            corrected_hours = '00' if hours_int >= 24 else f"{hours_int:02d}"
        except ValueError:
            corrected_hours = '00'

        # Correct minutes
        try:
            minutes_int = int(minutes)
            corrected_minutes = '00' if minutes_int >= 60 else f"{
                minutes_int:02d}"
        except ValueError:
            corrected_minutes = '00'

        # Correct seconds
        try:
            seconds_int = int(seconds)
            corrected_seconds = '00' if seconds_int >= 60 else f"{
                seconds_int:02d}"
        except ValueError:
            corrected_seconds = '00'

        corrected_time = f"{corrected_hours}:{corrected_minutes}:{
            corrected_seconds}{fractional}{tz}"
        corrected_s = s[:match.start()] + corrected_time + s[match.end():]
        return corrected_s

    @staticmethod
    def parse_feed(topic: str, pub_xml: dict, model, device: str) -> list:
        """
        Parse and Extract metadata from feed.
        Then Perform Deduplication and sort based on publishing date.
        Args:
            topic; Topic of article
            pub_xml: Publisher and XML data in dict form
            model: Embedding creation model to be used to remove duplicate headlines
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
                # Process published time
                published_str = entry.get('published')
                corrected_str = FeedParser.correct_time_components(
                    published_str)
                try:
                    published_time = parser.parse(corrected_str)
                except ValueError:
                    print(f"Skipping entry due to invalid date: {
                          corrected_str}")
                    continue

                # Convert to IST
                if published_time.tzinfo is None:  # Handle naive datetime
                    published_time = pytz.utc.localize(published_time)
                published_time = published_time.astimezone(ist)

                metadata = {
                    'title': entry.get('title'),
                    'link': entry.get('link'),
                    'published': published_time,
                    'image': FeedParser.extract_image_link(entry),
                    'source': publisher,
                    'topic': topic
                }
                result.append(metadata)

        print("Length Before: ", len(result))
        # Deduplication using cosine similarity
        result = Deduplicator.deduplicate(result, model, device)
        # Sort by published time (newest first)
        result.sort(key=lambda x: x['published'], reverse=True)
        print("Length After: ", len(result))
        return result
