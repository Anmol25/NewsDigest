import numpy as np
from scipy.spatial.distance import cosine


class Deduplicator:
    @staticmethod
    def deduplicate(input: list, model, device):
        if len(input) > 0:
            # Generate embeddings
            titles = [item['title'] for item in input]

            embeddings = model.encode(titles, device=device)

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

            return input
        else:
            return []
