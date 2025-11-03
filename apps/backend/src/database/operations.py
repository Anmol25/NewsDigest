"""
operations.py
This module contains the operations for the database.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select, and_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from .session import context_db
from .models import Articles, Users, UserHistory
from src.users.schemas import UserCreate


logger = logging.getLogger(__name__)


def insert_articles(articles: list[dict]):
    """
    Bulk insert articles with ON CONFLICT for 'link'.
    Assumes deduplication is handled upstream (e.g., in feed parsing),
    and performs an upsert per row based on 'link'.
    """
    if not articles:
        logger.info("No articles to insert or update.")
        return

    # Step 3: Map articles to dicts for insertion
    mapped_articles = [
        {
            "title": a["title"],
            "link": a["link"],
            "published_date": a["published"],
            "image": a.get("image"),
            "source": a["source"],
            "topic": a["topic"],
            "embeddings": a["embeddings"],
            "summary": None,
            "tsv": None
        }
        for a in articles
    ]

    try:
        with context_db() as db:
            stmt = pg_insert(Articles).values(mapped_articles)

            # ON CONFLICT for link only
            stmt = stmt.on_conflict_do_update(
                index_elements=['link'],
                set_={
                    "title": stmt.excluded.title,
                    "source": stmt.excluded.source,
                    "published_date": stmt.excluded.published_date,
                    "image": stmt.excluded.image,
                    "topic": stmt.excluded.topic,
                    "embeddings": stmt.excluded.embeddings,
                    "summary": stmt.excluded.summary,
                    "tsv": stmt.excluded.tsv
                },
                where=(stmt.excluded.published_date > Articles.published_date)
            )

            db.execute(stmt)
            db.commit()

        logger.info(
            f"Successfully inserted/updated {len(articles)} articles.")

    except Exception as e:
        logger.exception(f"Error during bulk insert/upsert of articles: {e}")


async def check_user_in_db(user: UserCreate, db: AsyncSession):
    """Checks if a user exists in the database and returns a response indicating if the user exists.
    Args:
        user: The user data to check in the database.
        db: The async database session to use for the query.
    Returns:
        dict: A dictionary containing two boolean values indicating if the user exists."""
    try:
        response = {"userExists": False, "emailExists": False}
        # Check Email
        result = await db.execute(select(Users).where(Users.email == user.email))
        exist_user = result.scalar_one_or_none()
        if exist_user:
            response["emailExists"] = True

        result = await db.execute(select(Users).where(Users.username == user.username))
        exist_user = result.scalar_one_or_none()
        if exist_user:
            response["userExists"] = True
        return response
    except Exception as e:
        logger.error(f"Error in Checking User in Database: {e}")
        return {"userExists": False, "emailExists": False}


async def create_user_in_db(user: UserCreate, db: AsyncSession):
    """Creates a new user in the database.
    Args:
        user: The user data to create in the database.
        db: The async database session to use for the creation.
    Returns:
        bool: True if the user was created successfully, False otherwise."""
    try:
        user_db = Users(
            username=user.username,
            fullname=user.fullname,
            email=user.email,
            hashed_password=user.password,
            is_active=True
        )
        try:
            db.add(user_db)
            await db.commit()
        except Exception:
            await db.rollback()
            return False
        return True
    except Exception as e:
        logger.error(f"Unexpected error occurred while Creating user: {e}")
        return False


async def update_user_history(db: AsyncSession, userid: int, art_id: int):
    """Updates the user history in the database.
    Args:
        db: The async database session to use for the update.
        userid: The user ID to update the history for.
        art_id: The article ID to update the history for.
    Returns:
        None
    """
    try:
        result = await db.execute(
            select(UserHistory).where(
                and_(UserHistory.user_id == userid,
                     UserHistory.article_id == art_id)
            )
        )
        hist_item = result.scalar_one_or_none()
        if hist_item:
            try:
                hist_item.watched_at = datetime.now(
                    timezone.utc)  # Use timezone.utc
                await db.commit()
            except Exception as e:
                await db.rollback()
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
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.error(f"Cannot add article to user history: {e}")
    except Exception as e:
        logger.error(f"Unexpected error while updating user history: {e}")
