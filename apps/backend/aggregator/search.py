import logging
from database.models import Articles
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def search_similar_items(query: str, model, device: str, db: Session):
    """
    Perform Cosine Similarity Search and find most relevant articles
    Args:
        query (str): Query to be searched in database.
        model : model to create embeddings of query.
        device (str): device (cuda/CPU) to store the embeddings on.
        db (Session): Database Session to perform queries.
    Returns:
        similar_items (list): List of similar items(dict) for requested query.
    """
    try:
        similar_items = []
        embedding = model.encode(query, device=device)
        # Get Top 10 results
        results = db.query()
        results = db.query(
            Articles,
            Articles.embeddings.cosine_distance(embedding).label('distance')
        ).order_by('distance',
                   Articles.published_date.desc()).limit(100).all()
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
    except Exception as e:
        logger.error(f"Error in performing similarity search: {e}")
