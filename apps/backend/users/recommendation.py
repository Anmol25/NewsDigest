import numpy as np
from database.models import Articles, Users, UserHistory
from sqlalchemy import desc
from sqlalchemy.sql import exists


class Recommendar:

    @staticmethod
    def check_history(user, db):
        hist_exist = db.query(exists().where(
            UserHistory.user_id == user.id)).scalar()
        return hist_exist

    @staticmethod
    def get_mean_embedding(user, db, hist_len=5):
        results = db.query(Articles.embeddings).join(
            UserHistory, UserHistory.article_id == Articles.id).filter(UserHistory.user_id == user.id).order_by(desc(UserHistory.watched_at)).limit(hist_len).all()
        embeddings = np.array([result[0] for result in results])
        mean_embedding = np.mean(embeddings, axis=0)
        return mean_embedding

    @staticmethod
    def personalized_feed(mean_embedding, db, feed_limit=25):
        similar_items = []
        results = db.query(
            Articles,
            Articles.embeddings.cosine_distance(
                mean_embedding).label('distance')
        ).order_by('distance',
                   Articles.published_date.desc()).limit(feed_limit).all()
        for item, score in results:
            result_item = {
                "title": item.title,
                "link": item.link,
                "published_date": item.published_date,
                "image": item.image,
                "source": item.source,
                "link": item.link,
                "cosine_score": 1-score
            }
            similar_items.append(result_item)
        return similar_items

    @staticmethod
    def get_recommendations(user, db):
        # Check if User history exist
        hist_exist = Recommendar.check_history(user, db)
        if not hist_exist:
            return []
        mean_embedding = Recommendar.get_mean_embedding(user, db)
        feed = Recommendar.personalized_feed(mean_embedding, db)
        return feed
