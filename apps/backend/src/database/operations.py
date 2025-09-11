"""
operations.py
This module contains the operations for the database.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from .session import context_db
from .models import Articles, Users, UserHistory
from src.users.schemas import UserCreate


logger = logging.getLogger(__name__)


def insert_articles(articles: list[dict]):
    """Efficiently performs a bulk "upsert" of articles into the database.

    Inserts all articles in a single statement using Postgres ON CONFLICT.
    Updates existing rows only if the incoming article has a more recent
    published_date.
    """
    if not articles:
        logger.info("No articles to insert or update.")
        return

    # Map articles into list of dicts ready for insert
    mapped_articles = [
        {
            "title": a["title"],
            "link": a["link"],
            "published_date": a["published"],
            "image": a["image"],
            "source": a["source"],
            "topic": a["topic"],
            "embeddings": a["embeddings"],
            "summary": None,
        }
        for a in articles
    ]

    try:
        with context_db() as db:
            stmt = pg_insert(Articles).values(mapped_articles)

            update_stmt = stmt.on_conflict_do_update(
                constraint="uq_title_source",
                set_={
                    "link": stmt.excluded.link,
                    "published_date": stmt.excluded.published_date,
                    "image": stmt.excluded.image,
                    "embeddings": stmt.excluded.embeddings,
                    "summary": stmt.excluded.summary,
                },
                where=(Articles.published_date < stmt.excluded.published_date),
            )

            db.execute(update_stmt)
            db.commit()

        logger.info(
            f"Database upserted successfully")

    except Exception as e:
        logger.exception(f"Error during bulk insert/upsert: {e}")


def check_user_in_db(user: UserCreate, db: Session):
    """Checks if a user exists in the database and returns a response indicating if the user exists.
    Args:
        user: The user data to check in the database.
        db: The database session to use for the query.
    Returns:
        dict: A dictionary containing two boolean values indicating if the user exists."""
    try:
        response = {"userExists": False, "emailExists": False}
        # Check Email
        exist_user = db.query(Users).filter(Users.email == user.email).first()
        if exist_user:
            response["emailExists"] = True
        exist_user = db.query(Users).filter(
            Users.username == user.username).first()
        if exist_user:
            response["userExists"] = True
        return response
    except Exception as e:
        logger.error(f"Error in Checking User in Database: {e}")


def create_user_in_db(user: UserCreate, db: Session):
    """Creates a new user in the database.
    Args:
        user: The user data to create in the database.
        db: The database session to use for the creation.
    Returns:
        bool: True if the user was created successfully, False otherwise."""
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
    """Updates the user history in the database.
    Args:
        db: The database session to use for the update.
        userid: The user ID to update the history for.
        art_id: The article ID to update the history for.
    Returns:
        bool: True if the update was successful, False otherwise."""
    try:
        hist_item = db.query(UserHistory).filter(
            (UserHistory.user_id == userid) & (UserHistory.article_id == art_id)).first()
        if hist_item:
            try:
                hist_item.watched_at = datetime.now(
                    timezone.utc)  # Use timezone.utc
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Cannot Update Time of User History: {e}")
        else:
            # Else Add to DB
            try:
                user_hist = UserHistory(
                    user_id=userid,
                    article_id=art_id,
                    watched_at=datetime.now(timezone.utc)  # Use timezone.utc
                )
                db.add(user_hist)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Cannot add article to user history: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while updating user history: {e}")
