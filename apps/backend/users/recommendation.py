import numpy as np
from database.models import Articles, UserHistory, UserLikes, UserBookmarks
from sqlalchemy import desc
from sqlalchemy.sql import exists, case
from sqlalchemy.orm import aliased


class Recommendar:
    @staticmethod
    def check_history(user, db):
        hist_exist = db.query(exists().where(
            UserHistory.user_id == user.id)).scalar()
        return hist_exist

    @staticmethod
    def get_mean_embedding_and_ids(user, db, hist_len=5):
        results = db.query(Articles. id, Articles.embeddings).join(
            UserHistory, UserHistory.article_id == Articles.id).filter(
                UserHistory.user_id == user.id).order_by(desc(UserHistory.watched_at)).limit(
                    hist_len).all()
        if not results:
            return None, []
        articles_id = [result[0] for result in results]
        embeddings = np.array([result[1] for result in results])
        mean_embedding = np.mean(embeddings, axis=0)
        return mean_embedding, articles_id

    @staticmethod
    def personalized_feed(user_id, mean_embedding, article_ids, db, page=1, page_size=10):
        """
        Fetches a personalized feed of articles based on cosine similarity to the user's mean embedding,
        excluding already viewed articles.
        """
        offset = (page - 1) * page_size
        like_alias = aliased(UserLikes)
        bookmark_alias = aliased(UserBookmarks)

        # Query articles with similarity ranking and user interactions
        results = (
            db.query(
                Articles.id,
                Articles.title,
                Articles.link,
                Articles.published_date,
                Articles.image,
                Articles.source,
                Articles.topic,
                case((like_alias.article_id.isnot(None), True),
                     else_=False).label("liked"),
                case((bookmark_alias.article_id.isnot(None), True),
                     else_=False).label("bookmarked"),
                Articles.embeddings.cosine_distance(
                    mean_embedding).label("distance")
            )
            .outerjoin(like_alias, (Articles.id == like_alias.article_id) & (like_alias.user_id == user_id))
            .outerjoin(bookmark_alias, (Articles.id == bookmark_alias.article_id) & (bookmark_alias.user_id == user_id))
            .filter(~Articles.id.in_(article_ids))
            .order_by("distance", Articles.published_date.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        # Transform query results into a structured list
        return [
            {
                "id": item.id,
                "title": item.title,
                "link": item.link,
                "published_date": item.published_date,
                "image": item.image,
                "source": item.source,
                "liked": item.liked,
                "bookmarked": item.bookmarked
            }
            for item in results
        ]

    @staticmethod
    def get_recommendations(user, db, page=1, page_size=10):
        # Check if User history exists
        hist_exist = Recommendar.check_history(user, db)
        if not hist_exist:
            return []
        mean_embedding, article_ids = Recommendar.get_mean_embedding_and_ids(
            user, db)
        feed = Recommendar.personalized_feed(
            user.id, mean_embedding, article_ids, db, page, page_size)
        return feed
