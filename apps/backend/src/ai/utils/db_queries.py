import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import ChatSession, ChatMessage
import uuid

logger = logging.getLogger(__name__)


async def create_session(db: AsyncSession, session_id: str, user_id: int) -> bool:
    """Create a new chat session record.

    Args:
            db: Async SQLAlchemy session.
            session_id: The UUID/string identifier for the session.
            user_id: The user ID who owns this session.

    Returns:
            True if the session was created successfully, otherwise False.
    """
    try:
        session = ChatSession(
            id=session_id,
            user_id=user_id,
            session_name=None,  # explicitly keep session name as NULL
            started_at=datetime.now(timezone.utc),
            last_activity=datetime.now(timezone.utc),
        )
        db.add(session)
        try:
            await db.commit()
        except Exception:
            await db.rollback()
            return False
        return True
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        return False


async def update_session_name(db: AsyncSession, session_id: str, session_name: str) -> bool:
    """Update the name of an existing chat session.

    Args:
            db: Async SQLAlchemy session.
            session_id: The UUID/string identifier for the session.
            session_name: The new name for the session.

    Returns:
            True if the session name was updated successfully, otherwise False.
    """
    try:
        # Fetch the session using the primary key
        session = await db.get(ChatSession, session_id)
        if not session:
            logger.debug(f"ChatSession not found for id={session_id}")
            return False

        session.session_name = session_name

        try:
            await db.commit()
        except Exception:
            await db.rollback()
            return False
        return True
    except Exception as e:
        logger.error(f"Error updating chat session name: {e}")
        return False


async def log_chat_message(db: AsyncSession, session_id: str, sender: str, message: str, message_metadata: dict) -> bool:
    """Log a chat message in the database.

    Args:
            db: Async SQLAlchemy session.
            session_id: The UUID/string identifier for the session.
            sender: The sender of the message (user/ai).
            message: The content of the message.
            message_metadata: Additional metadata for the message.

    Returns:
            True if the message was logged successfully, otherwise False.
    """
    try:
        chat_message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            sender=sender,
            message=message,
            created_at=datetime.now(timezone.utc),
            message_metadata=message_metadata
        )
        db.add(chat_message)
        try:
            await db.commit()
        except Exception:
            await db.rollback()
            return False
        return True
    except Exception as e:
        logger.error(f"Error logging chat message: {e}")
        return False
