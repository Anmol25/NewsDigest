"""
deduplicator.py
This module contains the deduplicator for the aggregator.
"""

import logging
from scipy.spatial.distance import pdist, squareform

logger = logging.getLogger(__name__)


class Deduplicator:
    @staticmethod
    def deduplicate(input: list, model, device: str) -> list:
        """
        Remove Articles with very similar articles using cosine similarity (vectorized)
        Args:
            input: list of articles
            model: Embedding creation model to be used remove duplicate headlines
            device: Device to run model on (CPU/GPU)
        Returns:
            list: Articles after removing duplicate articles
        """
        try:
            len_before = len(input)
            if len_before > 0:
                # Generate embeddings
                titles = [item['title'] for item in input]
                embeddings = model.encode(titles, device=device)

                # Save Embeddings in feed (list of dictionaries, so we update in place)
                for i, item in enumerate(input):
                    item['embeddings'] = embeddings[i]

                # Find duplicates using cosine similarity (vectorized)
                num_embeddings = len(embeddings)
                if num_embeddings > 1:
                    # Calculate pairwise cosine distances
                    cosine_distances = pdist(embeddings, metric='cosine')

                    # Convert the condensed distance matrix to a square matrix
                    similarity_matrix = 1 - squareform(cosine_distances)

                    to_remove = set()
                    for i in range(num_embeddings):
                        for j in range(i + 1, num_embeddings):
                            if similarity_matrix[i, j] > 0.9:
                                to_remove.add(j)

                else:
                    to_remove = set()

                # Filter out duplicates
                input_deduplicated = [item for idx, item in enumerate(input) if idx not in to_remove]
                len_after = len(input_deduplicated)
                logger.info(f"Duplicates Removed: {(len_before - len_after)}")
                return input_deduplicated
            else:
                return []
        except Exception as e:
            logger.error(f"Error in Deduplicating Feed: {e}")
            return input