import logging
from .session import context_db
from .models import Articles, Users, UserHistory
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc
from sqlalchemy.orm import Session
from users.schemas import UserCreate
from datetime import datetime
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)


def update_entry(article, db):
    try:
        # Replace Entry
        old_entry = db.query(Articles).filter(Articles.link ==
                                              article.link).first()
        # Update Values:
        if old_entry:
            old_entry.title = article.title
            old_entry.link = article.link
            old_entry.published_date = article.published_date
            old_entry.image = article.image
            old_entry.source = article.source
            old_entry.topic = article.topic
            old_entry.embeddings = article.embeddings
            old_entry.summary = None
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(
            f"Cannot Update artice in Database, Unexpected Error Occured! {e}")


def handle_update(article, db):
    """
    Handle if the article is updated causing Unique Contrain violation
    """
    try:
        # Get Time of same article stored in DB
        time_in_db = db.query(Articles.published_date).filter(
            Articles.link == article.link).first()
        # If article not found in DB(Unexpected error occured) - Skip entry
        if time_in_db == None:
            return

        # Set Time from DB and from new article entry
        time_in_db = time_in_db[0]
        time_in_article = article.published_date

        # Check if Time in DB is same as new article entry(Duplicate) - Skip update
        if time_in_db == time_in_article:
            return
        # Check if Time in DB greater than new article - Retain DB entry
        elif time_in_db > time_in_article:
            return
        # If new article entry time is after previous time(Update) - Update entry
        elif time_in_db < time_in_article:
            update_entry(article, db)
    except Exception as e:
        print(f"Error in updating article in Database: {e}")


def insert_to_db(articles: list):
    """
    Insert a List of New Articles to Database
    """
    try:
        with context_db() as db:
            for item in articles:
                article = Articles(
                    title=item["title"],
                    link=item["link"],
                    published_date=item["published"],
                    image=item["image"],
                    source=item["source"],
                    topic=item["topic"],
                    embeddings=item["embeddings"]
                )
                try:
                    db.add(article)
                    db.commit()
                except IntegrityError:
                    db.rollback()  # Rollback
                    handle_update(article, db)
        logger.debug("Inserted Articles to Database Successfully")
    except Exception as e:
        logger.error(f"Unexpected error in inserting data to Database: {e}")


def get_latest_time():
    try:
        lastest_time = None
        with context_db() as db:
            lastest_time = db.query(Articles.published_date).order_by(
                desc(Articles.published_date)).first()
        # Return Latest Time if found
        if lastest_time:
            logger.debug(f"Latest Time fetched: {lastest_time[0]}")
            return lastest_time[0]
        logger.debug("No time found because Database is empty!")
        return None
    except Exception as e:
        logger.error(f"Error in Getting latest time from Database: {e}")


def create_user_in_db(user: UserCreate, db: Session):
    try:
        UserDB = Users(
            username=user.username,
            fullname=user.fullname,
            email=user.email,
            hashed_password=user.password,
            is_active=True
        )
        try:
            db.add(UserDB)
            db.commit()
        except:
            db.rollback()
            return False
        return True
    except Exception as e:
        logger.error("UnExpected Error occured while Creating user: {e}")


def update_user_history(db: Session, userid: int, art_id):
    try:
        # Check is already in history -> Update Time
        hist_item = db.query(UserHistory).filter(
            (UserHistory.user_id == userid) & (UserHistory.article_id == art_id)).first()
        if hist_item:
            try:
                hist_item.watched_at = datetime.now(ZoneInfo("UTC"))
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Cannot Update Time of User Hitory: {e}")
        else:
            # Else Add to DB
            try:
                user_hist = UserHistory(
                    user_id=userid,
                    article_id=art_id,
                    watched_at=datetime.now(ZoneInfo("UTC"))
                )
                db.add(user_hist)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Cannot add article to user history: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while updating user history: {e}")
