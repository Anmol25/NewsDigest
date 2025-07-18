from sqlalchemy.orm import Session
from src.database.models import Sources  # Adjust the import if needed


def seed_data(session: Session):
    if session.query(Sources).count() == 0:
        sources = [
            "Times of India",
            "NDTV",
            "Firstpost",
            "India Today",
            "Hindustan Times",
            "India TV",
            "Zee News",
            "DNA India",
            "News18",
            "CNBCTV18"
        ]

        source_entries = [Sources(source=name) for name in sources]
        session.add_all(source_entries)
        print(f"[Seed] Inserted {len(sources)} news sources.")
    else:
        print("[Seed] Sources already populated.")
