from .session import context_db
from .models import Articles
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc


def insert_to_db(articles: list):
    """
    Insert a List of New Articles to Database
    """
    with context_db() as db:
        for item in articles:
            article = Articles(
                title=item["title"],
                link=item["link"],
                published_date=item["published"],
                image=item["image"],
                source=item["source"],
                topic=item["topic"]
            )
            try:
                db.add(article)
                db.commit()
            except IntegrityError:
                db.rollback()  # Rollback the transaction in case of a duplicate


def get_latest_time():
    lastest_time = None
    with context_db() as db:
        lastest_time = db.query(Articles.published_date).order_by(
            desc(Articles.published_date)).first()
    # Return Latest Time if found
    if lastest_time:
        return lastest_time[0]
    return None
