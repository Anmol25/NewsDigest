"""
services.py
This module authenticates and authorizes the users.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.database.models import Users


SECRET_KEY = "2383706089348953fbf69e4439e2ae1829b27406d9cabf104591ff3ef923df8b"
ALGORITHM = "HS256"


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    """"Verify a plain password against a hashed password.
    Args:
        plain_password (str): The plain password to verify.
        hashed_password (str): The hashed password to compare against.
    Returns:
        bool: True if the password matches, False otherwise."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    """Hash a password using bcrypt.
    Args:
        password (str): The password to hash.
    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)


def get_user(db: Session, username: str):
    """Fetch a user from the database by username.
    Args:
        db (Session): The database session to use for the query.
        username (str): The username of the user to fetch.
    Returns:
        Users: The user object if found, None otherwise."""
    user = db.query(Users).filter(Users.username == username).first()
    if user:
        return user


def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user by verifying their username and password.
    Args:
        db (Session): The database session to use for the query.
        username (str): The username of the user to authenticate.
        password (str): The password of the user to authenticate.
    Returns:
        bool: True if authentication is successful, False otherwise."""
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    if not user.is_active:
        return False
    return True


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create Access Token.
    Args:
        data (dict): The data to encode in the token.
        expires_delta (timedelta): The expiration time of the token.
    Returns:
        str: The encoded access token."""
    to_encode = data.copy()
    if expires_delta:
        expires = datetime.now(timezone.utc) + expires_delta
    else:
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    """Create Refresh Token.
    Args:
        data (dict): The data to encode in the token.
        expires_delta (timedelta): The expiration time of the token.
    Returns:
        str: The encoded refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expires = datetime.now(timezone.utc) + expires_delta
    else:
        expires = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expires})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_refresh_token(refresh_token: str):
    """Decode Refresh Token.
    Args:
        refresh_token (str): The refresh token to decode.
    Returns:
        dict: The decoded payload of the refresh token."""
    payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get Current User.
    Args:
        token (str): The token to decode.
        db (Session): The database session to use for the query.
    Returns:
        Users: The user object if found, None otherwise."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: Users = Depends(get_current_user)):
    """Get Current Active User.
    Args:
        current_user (Users): The current user to check.
    Returns:
        Users: The user object if found, None otherwise."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive User")
    return current_user
