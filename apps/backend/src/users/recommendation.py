"""
recommendation.py
Packages to provide recommendation to users.
"""

from datetime import datetime

import numpy as np
from sqlalchemy import desc, func
from sqlalchemy.sql import exists

from src.database.models import Articles, UserHistory
from src.database.queries import get_article_query, paginate_and_format


class Recommender:
    @staticmethod
    def check_history(user, db):
        """
        Check if the user has any history in the UserHistory table.
        Args:
            user: The user object to check history for.
            db: The database session to use for the query.
        Returns:
            bool: True if the user has history, False otherwise.
        """
        hist_exist = db.query(exists().where(
            UserHistory.user_id == user.id)).scalar()
        return hist_exist

    @staticmethod
    def get_weighted_embedding_and_ids(user, db, hist_len=10, decay_strength=1.0):
        """
        Fetches a time-weighted embedding of the user's viewed articles and their IDs.
        More recent articles have higher weights in the calculation.

        Args:
            user: The user object to fetch history for.
            db: The database session to use for the query.
            hist_len: The number of articles to consider for weighted embedding.
            decay_strength: Controls how steep the exponential decay is (higher values = steeper)
        Returns:
            tuple: A tuple containing the weighted embedding and a list of article IDs.
        """
        # Fetch history with timestamps
        results = db.query(
            Articles.id,
            Articles.embeddings,
            UserHistory.watched_at
        ).join(
            UserHistory,
            UserHistory.article_id == Articles.id
        ).filter(
            UserHistory.user_id == user.id
        ).order_by(
            desc(UserHistory.watched_at)
        ).limit(hist_len).all()
        if not results:
            return None, []

        articles_id = [result[0] for result in results]
        embeddings = np.array([result[1] for result in results])
        timestamps = np.array([result[2].timestamp() for result in results])
        # Normalize timestamps to get recency values
        max_timestamp = np.max(timestamps)
        min_timestamp = np.min(timestamps)
        time_range = max(max_timestamp - min_timestamp,
                         1)  # Avoid division by zero
        # Calculate normalized recency values (0 to 1)
        recency = (timestamps - min_timestamp) / time_range
        # Apply strength parameter to control steepness
        scaled_recency = recency * decay_strength
        # Exponential decay to give more weight to recent articles (softmax)
        weights = np.exp(scaled_recency) / np.sum(np.exp(scaled_recency))
        # Apply weights to embeddings
        weighted_embeddings = embeddings * weights[:, np.newaxis]
        weighted_embedding = np.sum(weighted_embeddings, axis=0)

        return weighted_embedding, articles_id

    @staticmethod
    def personalized_feed(user_id, weighted_embedding, article_ids, db, page=1, page_size=10, recency_factor=0.3):
        """
        Fetches a personalized feed of articles based on cosine similarity to the user's weighted embedding,
        with additional weighting for recent articles.

        Args:
            user_id: The ID of the user to fetch the feed for.
            weighted_embedding: The weighted embedding of the user's viewed articles.
            article_ids: A list of article IDs to exclude from the feed.
            db: The database session to use for the query.
            page: The page number for pagination.
            page_size: The number of articles per page.
            recency_factor: Factor determining how much to weight article recency vs. similarity.
        Returns:
            list: A list of dictionaries containing article details and user interactions.
        """
        offset = (page - 1) * page_size
        # Calculate days since publishing as a recency score
        current_time = datetime.now()
        # cosine similarity score calculation
        combined_score = (Articles.embeddings.cosine_distance(weighted_embedding) * (1 - recency_factor) +
                          func.extract('epoch', current_time -
                                       Articles.published_date) / 86400.0 * recency_factor
                          ).label("combined_score")
        query = get_article_query(db, user_id, combined_score)
        # exclude already viewed articles and order by combined score (lower is better)
        query = query.filter(~Articles.id.in_(article_ids)
                             ).order_by(combined_score)
        results = paginate_and_format(query, offset, page_size)
        return results

    @staticmethod
    def get_recommendations(user, db, page=1, page_size=20, recency_factor=0.3, decay_strength=1.0):
        """
        Fetches enhanced personalized recommendations for a user based on their history.

        Args:
            user: The user object to fetch recommendations for.
            db: The database session to use for the query.
            page: The page number for pagination.
            page_size: The number of articles per page.
            recency_factor: Factor determining how much to weight article recency.
            decay_strength: Controls how steep the exponential decay is (higher values = steeper)
        Returns:
            list: A list of dictionaries containing article details and user interactions.
        """
        # Check if User history exists
        hist_exist = Recommender.check_history(user, db)
        if not hist_exist:
            return []

        weighted_embedding, article_ids = Recommender.get_weighted_embedding_and_ids(
            user, db, hist_len=10, decay_strength=decay_strength)

        feed = Recommender.personalized_feed(
            user.id, weighted_embedding, article_ids, db, page, page_size, recency_factor)

        return feed
