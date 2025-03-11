import numpy as np
from database.models import Articles, UserHistory
from sqlalchemy import desc
from sqlalchemy.sql import exists


class Recommendar:
    @staticmethod
    def check_history(user, db):
        hist_exist = db.query(exists().where(
            UserHistory.user_id == user.id)).scalar()
        return hist_exist

    @staticmethod
    def get_mean_embedding_and_ids(user, db, hist_len=10):
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
    def personalized_feed(mean_embedding, article_ids, db, page=1, page_size=10):
        offset = (page - 1) * page_size
        similar_items = []
        results = db.query(
            Articles,
            Articles.embeddings.cosine_distance(
                mean_embedding).label('distance')
        ).filter(~Articles.id.in_(article_ids)).order_by('distance',
                                                         Articles.published_date.desc()).offset(offset).limit(page_size).all()

        for item, score in results:
            result_item = {
                "id": item.id,
                "title": item.title,
                "link": item.link,
                "published_date": item.published_date,
                "image": item.image,
                "source": item.source,
                "cosine_score": 1 - score
            }
            similar_items.append(result_item)

        return similar_items

    @staticmethod
    def get_recommendations(user, db, page=1, page_size=10):
        # Check if User history exists
        hist_exist = Recommendar.check_history(user, db)
        if not hist_exist:
            return []
        mean_embedding, article_ids = Recommendar.get_mean_embedding_and_ids(
            user, db)
        feed = Recommendar.personalized_feed(
            mean_embedding, article_ids, db, page, page_size)
        return feed
