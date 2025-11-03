"""
deduplicator.py
This module contains the deduplicator for the aggregator.
"""

import logging

from scipy.spatial.distance import pdist, squareform

logger = logging.getLogger(__name__)


class Deduplicator:
    @staticmethod
    def deduplicate(input: list, model=None, device: str = None) -> list:
        """
        Embedding-based deduplication was removed and moved to FeedParser.
        This method is retained as a no-op for backward compatibility and
        simply returns the input list unchanged (or an empty list when
        input is falsy).
        """
        try:
            if not input:
                return []
            return input
        except Exception as e:
            logger.error(f"Error in Deduplicating Feed (no-op): {e}")
            return input
