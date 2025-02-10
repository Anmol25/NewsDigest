import numpy as np
import logging
from scipy.spatial.distance import cosine

logger = logging.getLogger(__name__)


class Deduplicator:
    @staticmethod
    def deduplicate(input: list, model, device: str) -> list:
        """
        Remove Articles with very similiar articles using cosine similiarity
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

                # Save Embeddings in feed
                [input.update({"embeddings": emb})
                 for input, emb in zip(input, embeddings)]

                # Find duplicates using cosine similarity
                to_remove = set()
                for i in range(len(embeddings)):
                    for j in range(i+1, len(embeddings)):
                        similarity = 1 - cosine(embeddings[i], embeddings[j])
                        if similarity > 0.85:
                            to_remove.add(j)

                # Filter out duplicates
                input = [item for idx, item in enumerate(
                    input) if idx not in to_remove]
                len_after = len(input)
                logger.debug(f"Duplicates Removed: {(len_before - len_after)}")
                return input
            else:
                return []
        except Exception as e:
            logger.error(f"Error in Deduplicating Feed: {e}")
