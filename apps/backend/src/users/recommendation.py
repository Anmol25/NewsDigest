"""
recommendation.py
Packages to provide recommendation to users.
"""

from datetime import datetime

import numpy as np
from sqlalchemy import desc, func, select
from sqlalchemy.sql import exists
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import Articles, UserHistory
from src.database.queries import (
    build_article_select,
    paginate_and_format_async,
)


class Recommender:
    @staticmethod
    async def check_history(user, db: AsyncSession):
        """Check if user has any history."""
        result = await db.execute(select(exists().where(UserHistory.user_id == user.id)))
        return bool(result.scalar())

    @staticmethod
    async def get_weighted_embedding_and_ids(user, db: AsyncSession, hist_len=10, decay_strength=1.0):
        """Get weighted embedding and article IDs from user history."""
        stmt = (
            select(Articles.id, Articles.embeddings, UserHistory.watched_at)
            .join(UserHistory, UserHistory.article_id == Articles.id)
            .where(UserHistory.user_id == user.id)
            .order_by(desc(UserHistory.watched_at))
            .limit(hist_len)
        )
        result = await db.execute(stmt)
        rows = result.all()
        if not rows:
            return None, []

        articles_id = [r[0] for r in rows]
        embeddings = np.array([r[1] for r in rows])
        timestamps = np.array([r[2].timestamp() for r in rows])

        max_timestamp = np.max(timestamps)
        min_timestamp = np.min(timestamps)
        time_range = max(max_timestamp - min_timestamp, 1)
        recency = (timestamps - min_timestamp) / time_range
        scaled_recency = recency * decay_strength
        weights = np.exp(scaled_recency) / np.sum(np.exp(scaled_recency))
        weighted_embeddings = embeddings * weights[:, np.newaxis]
        weighted_embedding = np.sum(weighted_embeddings, axis=0)

        return weighted_embedding, articles_id

    @staticmethod
    async def personalized_feed(user_id, weighted_embedding, article_ids, db: AsyncSession, page=1, page_size=10, recency_factor=0.3):
        """Get personalized feed based on weighted embedding and article IDs."""
        offset = (page - 1) * page_size
        current_time = datetime.now()
        combined_score = (Articles.embeddings.cosine_distance(weighted_embedding) * (1 - recency_factor) +
                          func.extract(
                              'epoch', current_time - Articles.published_date) / 86400.0 * recency_factor
                          ).label("combined_score")

        stmt = build_article_select(user_id, combined_score)
        stmt = stmt.where(~Articles.id.in_(article_ids)
                          ).order_by(combined_score)
        return await paginate_and_format_async(db, stmt, offset, page_size)

    @staticmethod
    async def get_recommendations(user, db: AsyncSession, page=1, page_size=20, recency_factor=0.3, decay_strength=1.0):
        """Get personalized recommendations for a user."""
        hist_exist = await Recommender.check_history(user, db)
        if not hist_exist:
            return []

        weighted_embedding, article_ids = await Recommender.get_weighted_embedding_and_ids(
            user, db, hist_len=10, decay_strength=decay_strength)

        return await Recommender.personalized_feed(
            user.id, weighted_embedding, article_ids, db, page, page_size, recency_factor)
