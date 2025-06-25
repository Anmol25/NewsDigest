"""
operations.py
This module contains the operations for the database.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from tqdm import tqdm

from .session import context_db
from .models import Articles, Users, UserHistory
from src.users.schemas import UserCreate


logger = logging.getLogger(__name__)


def update_entry(existing_article, new_article_data, db):
    """Updates an existing article entry in the database.
    Args:
        existing_article: The existing article object to update.
        new_article_data: The new article data to update the existing article with.
        db: The database session to use for the update.
    Returns:
        bool: True if the update was successful, False otherwise."""
    try:
        existing_article.title = new_article_data["title"]
        existing_article.link = new_article_data["link"]
        existing_article.published_date = new_article_data["published"]
        existing_article.image = new_article_data["image"]
        existing_article.source = new_article_data["source"]
        existing_article.topic = new_article_data["topic"]
        existing_article.embeddings = new_article_data["embeddings"]
        existing_article.summary = None  # Reset summary

        db.commit()
        return True  # Indicates an update occurred
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating article in database: {e}")
        return False


def handle_update(existing_article, new_article_data, db):
    """Handles updates if an article is already in the database.
    Args:
        existing_article: The existing article object to update.
        new_article_data: The new article data to update the existing article with.
        db: The database session to use for the update.
    Returns:
        bool: True if an update occurred, False otherwise."""
    try:
        time_in_db = existing_article.published_date
        time_in_article = new_article_data["published"]

        # Only update if the new article is newer
        if time_in_article > time_in_db:
            return update_entry(existing_article, new_article_data, db)
        return False
    except Exception as e:
        logger.exception(f"Error handling article update: {e}")
        return False


def check_in_db(article: dict, db: Session):
    """Checks if an article exists in the database and returns the ORM object.
    Args:
        article: The article data to check in the database.
        db: The database session to use for the query.
    Returns:
        Articles: The ORM object if the article exists, None otherwise."""
    return db.query(Articles).filter(Articles.link == article["link"]).first()


def insert_to_db(articles: list):
    """Inserts a list of new articles into the database and logs counts of added and updated articles.
    Args:
        articles: A list of dictionaries containing article data.
    Returns:
        None"""
    added_count = 0
    updated_count = 0

    try:
        with context_db() as db:
            for item in tqdm(articles, desc="Inserting articles in DB", unit="article"):
                existing_article = check_in_db(item, db)

                if existing_article:
                    if handle_update(existing_article, item, db):
                        updated_count += 1
                else:
                    new_article = Articles(
                        title=item["title"],
                        link=item["link"],
                        published_date=item["published"],
                        image=item["image"],
                        source=item["source"],
                        topic=item["topic"],
                        embeddings=item["embeddings"]
                    )
                    try:
                        db.add(new_article)
                        db.commit()
                        added_count += 1
                    except IntegrityError:
                        db.rollback()
                        logger.debug(
                            f"Integrity error while adding to DB: {item}")

        logger.info(
            f"Database update summary: {added_count} new articles added, {updated_count} articles updated.")
    except Exception as e:
        logger.exception(
            f"Unexpected error inserting articles into database: {e}")


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
