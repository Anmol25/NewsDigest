import numpy as np
from database.models import Articles, Users, UserHistory
from sqlalchemy import desc


class Recommendar:

    @staticmethod
    def get_mean_embedding(user, db):
        results = db.query(Articles.embeddings).join(
            UserHistory, UserHistory.article_id == Articles.id).filter(UserHistory.user_id == user.id).order_by(desc(UserHistory.watched_at)).limit(5).all()
        embeddings = np.array([result[0] for result in results])
        mean_embedding = np.mean(embeddings, axis=0)
        return mean_embedding

    @staticmethod
    def get_recommendations(user, db):
        mean_embedding = Recommendar.get_mean_embedding(user, db)
        similar_items = []
        results = db.query(
            Articles,
            Articles.embeddings.cosine_distance(
                mean_embedding).label('distance')
        ).order_by('distance',
                   Articles.published_date.desc()).limit(15).all()
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
