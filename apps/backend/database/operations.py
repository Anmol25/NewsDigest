from .session import context_db
from .models import Articles
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc


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
            old_entry.summary = None
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Cannot Update, Unexpected Error Occured! {e}")


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
            print("Skipped Due to Unexpected error")
            return

        time_in_db = time_in_db[0]
        print("Handling Update")
        print("DB_TIME: ", time_in_db)
        time_in_article = article.published_date
        print("NEW_TIME: ", time_in_article)

        # Check if Time in DB is same as new article entry(Duplicate) - Skip update
        if time_in_db == time_in_article:
            print("Duplicate Entry Skipping")
            return
        # Check if Time in DB greater than new article - Retain DB entry
        elif time_in_db > time_in_article:
            print("Retaining DB entry (Already Up to date)")
            return
        # If new article entry time is after previous time(Update) - Update entry
        elif time_in_db < time_in_article:
            print("Updating Entry in DB")
            update_entry(article, db)
    except Exception as e:
        print(f"Error in update: {e}")


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
                db.rollback()  # Rollback
                handle_update(article, db)


def get_latest_time():
    lastest_time = None
    with context_db() as db:
        lastest_time = db.query(Articles.published_date).order_by(
            desc(Articles.published_date)).first()
    # Return Latest Time if found
    if lastest_time:
        return lastest_time[0]
    return None
