import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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


async def get_chat_messages(db: AsyncSession, session_id: str, page: int = 1, limit: int = 20, user_id: int = None):
    """Retrieve chat messages for a given session with pagination.

    Args:
            db: Async SQLAlchemy session.
            session_id: The UUID/string identifier for the session.
            page: The page number for pagination.
            limit: The number of messages per page.
            user_id: The user ID to verify session ownership (optional).
    Returns:
            A list of chat messages for the specified session.
    """
    try:
        # sanitize pagination inputs
        if page is None or page < 1:
            page = 1
        if limit is None or limit < 1:
            limit = 20

        offset = (page - 1) * limit

        # Build async-select statement
        stmt = select(ChatMessage.id, ChatMessage.sender, ChatMessage.message,
                      ChatMessage.message_metadata).where(ChatMessage.session_id == session_id)

        if user_id is not None:
            # Join with ChatSession to verify ownership
            stmt = stmt.join(ChatSession, ChatMessage.session_id == ChatSession.id).where(
                ChatSession.user_id == user_id)

        stmt = stmt.order_by(ChatMessage.created_at.desc()
                             ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        # Use mappings() to get dict-like rows instead of ORM objects
        rows = result.mappings().all()

        # Return simple list of dicts with only the two fields
        messages = [{"id": r["id"], "sender": r["sender"], "message": r["message"], "message_metadata": r["message_metadata"]}
                    for r in rows]

        return messages
    except Exception as e:
        logger.error(f"Error retrieving chat messages: {e}")
        return []


async def get_chat_sessions(db: AsyncSession, page: int = 1, limit: int = 10, user_id: int = None):
    """Retrieve chat sessions with pagination.

    Args:
            db: Async SQLAlchemy session.
            page: The page number for pagination.
            limit: The number of sessions per page.
            user_id: The user ID to filter sessions (optional).
    Returns:
            A list of chat sessions.
    """
    try:
        # sanitize pagination inputs
        if page is None or page < 1:
            page = 1
        if limit is None or limit < 1:
            limit = 10

        offset = (page - 1) * limit

        # Build async-select statement
        stmt = select(ChatSession.id, ChatSession.session_name)

        if user_id is not None:
            # Filter by user_id to get only user's sessions
            stmt = stmt.where(ChatSession.user_id == user_id)

        stmt = stmt.order_by(ChatSession.last_activity.desc()
                             ).offset(offset).limit(limit)

        result = await db.execute(stmt)
        # Use mappings() to get dict-like rows instead of ORM objects
        rows = result.mappings().all()

        # Return simple list of dicts with only the two fields
        sessions = [{"id": r["id"], "session_name": r["session_name"]}
                    for r in rows]

        return sessions
    except Exception as e:
        logger.error(f"Error retrieving chat sessions: {e}")
        return []
