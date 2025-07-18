"""
feed_parser.py
This module contains the feed parser for the aggregator.
"""

import asyncio
import re
import logging
from urllib.parse import urlparse
from datetime import datetime

import aiohttp
import pytz
import feedparser
from dateutil import parser
from dateutil import tz

logger = logging.getLogger(__name__)


class FeedParser:

    @staticmethod
    async def fetch_xml(url: str) -> str:
        """Function to fetch xml data from the given url."""
        try:
            async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
                async with session.get(url) as response:
                    return await response.text()
        except Exception as e:
            logger.error(f"Error in Fetching xml of url:{url}, error: {e}")

    @staticmethod
    async def fetch_topics_feed(topic: dict) -> dict:
        """Function to fetch xml feeds for given topic."""
        try:
            tasks = []
            for publisher, url in topic.items():
                tasks.append(FeedParser.fetch_xml(url))
            result = await asyncio.gather(*tasks)
            data = {}
            for publisher, xml in zip(topic.keys(), result):
                # Only include feeds that were successfully fetched
                if xml is not None:
                    data[publisher] = xml
                else:
                    logger.warning(
                        f"Skipping {publisher} feed due to fetch failure")
            return data
        except Exception as e:
            logger.error(f"Error in Fetching XML Feed of {topic}: {e}")
            return {}  # Return empty dict instead of None on error

    @staticmethod
    def extract_image_link(entry: str) -> str:
        """Extract the image URL found in enclosure, media:content tags, or description img tags."""
        try:
            # Check enclosure tags first (common in RSS)
            for enclosure in entry.get('enclosures', []):
                return enclosure['url']

            # Check media:content tags next (common in Media RSS)
            for media in entry.get('media_content', []):
                if 'url' in media:
                    return media['url']

            # Check description for img tags
            description = entry.get('description', '')
            if description:
                # Look for src attribute in img tags
                img_pattern = re.compile(r'<img[^>]+src=["\'](.*?)["\']')
                match = img_pattern.search(description)
                if match:
                    return match.group(1)

            # Return None if no images found
            return None
        except Exception as e:
            logger.error(f"Error in Extracting image: {e}")
            return None

    @staticmethod
    def correct_time_components(s: str) -> str:
        """
        Correct invalid time components (hours >=24, minutes >=60, seconds >=60) in a datetime string.
        Each invalid component is reset to '00' without affecting other parts.
        """
        try:
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
        except Exception as e:
            logger.error("Error Occur While Correcting date")

    @staticmethod
    def handle_time_str(dt_str):
        try:
            if "GMT +5:30" in dt_str:
                dt_str = parser.parse(dt_str).replace(
                    tzinfo=tz.gettz("Asia/Kolkata"))
                return dt_str
            else:
                dt_str = parser.parse(dt_str)
                return dt_str
        except:
            logger.error(f"Skipping entry due to invalid date: {
                dt_str}")
            return None

    @staticmethod
    def normalize_url(url):
        """Remove #fragment from URL."""
        try:
            # Remove URL fragment using urlparse
            parsed = urlparse(url)
            return parsed._replace(fragment="").geturl()
        except Exception as e:
            logger.error(f"Error in Normalizing URL: {e}")
            return None

    @staticmethod
    def filter_video_links(url: str) -> str | None:
        """Filter out URLs that point to video content."""
        # Pattern to match `.com/videos` or `.com/short-videos` right after the domain
        pattern = r'\.com/(videos|short-videos)(/|$)'

        if re.search(pattern, url):
            return None
        return url

    @staticmethod
    def parse_feed(topic: str, pub_xml: dict) -> list:
        """
        Parse and Extract metadata from feed.
        Then Perform Deduplication and sort based on publishing date.
        Args:
            topic: Topic of article
            pub_xml: Publisher and XML data in dict form
        Return:
            list: List of Articles
        """
        try:
            result = []
            ist = pytz.timezone('Asia/Kolkata')

            # Parse and collect metadata with time conversion
            for publisher, xml in pub_xml.items():
                if xml is None:  # Skip if XML is None
                    logger.warning(f"Skipping {publisher} feed - XML is None")
                    continue

                feed = feedparser.parse(xml)
                for entry in feed.entries:
                    try:
                        # Process published time
                        published_str = entry.get('published')
                        if not published_str:
                            logger.debug(
                                f"Skipping entry from {publisher} - no publish date")
                            continue

                        corrected_str = FeedParser.correct_time_components(
                            published_str)
                        published_time = FeedParser.handle_time_str(
                            corrected_str)

                        # If published date is None skip entry
                        if published_time is None:
                            continue
                        elif published_time > datetime.now(pytz.utc):
                            logger.debug(
                                f"Skipping entry from {publisher} - future publish date")
                            continue

                        # Convert to IST
                        if published_time.tzinfo is None:  # Handle naive datetime
                            published_time = pytz.utc.localize(published_time)
                        published_time = published_time.astimezone(ist)

                        # Check for title and link
                        title = entry.get('title')
                        url = entry.get('link')
                        if not title or not url:
                            logger.debug(
                                f"Skipping entry from {publisher} - missing title or link")
                            continue

                        url = FeedParser.normalize_url(url)
                        url = FeedParser.filter_video_links(url)
                        if not url:
                            logger.debug(
                                f"Skipping entry from {publisher} - filtered video link")
                            continue

                        # Check if URL is valid
                        if not url:
                            continue

                        metadata = {
                            'title': title,
                            'link': url,
                            'published': published_time,
                            'image': FeedParser.extract_image_link(entry),
                            'source': publisher,
                            'topic': topic
                        }
                        result.append(metadata)
                    except Exception as e:
                        logger.warning(
                            f"Error processing entry from {publisher}: {e}")
                        continue  # Skip problematic entries

            logger.debug(
                f"{topic}'s Feed Parsed Successfully!, Total Articles:{len(result)}")
            return result
        except Exception as e:
            logger.error(f"Error in Parsing Feed: {e}")
            return []  # Return empty list instead of None on error
