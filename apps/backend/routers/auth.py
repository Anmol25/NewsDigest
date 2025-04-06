"""
auth.py
This module contains the authentication routes for user registration, login, token generation, refreshing, and logout.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from database.session import get_db
from database.models import Users
from database.operations import create_user_in_db, check_user_in_db
from sqlalchemy.orm import Session
from users.schemas import Token, User, UserCreate
from users.services import (authenticate_user, create_access_token, get_current_active_user,
                            get_password_hash, create_refresh_token, decode_refresh_token)

logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 365

router = APIRouter()


@router.post("/register")
async def create_user(user: UserCreate, db: Session = Depends(get_db)) -> dict:
    """Create a new User.

    Args:
        user (UserCreate): User details.
        db (Session): Database session.

    Returns:
        dict: Response message."""
    # Check if user exist in DB
    user_response = check_user_in_db(user, db)
    if user_response["userExists"] or user_response["emailExists"]:
        raise HTTPException(status_code=409, detail=user_response)
    try:
        # Hash Password
        user.password = get_password_hash(user.password)
        # Create User in DB
        user_created = create_user_in_db(user, db)
        if not user_created:
            raise HTTPException(
                status_code=500, detail="Failed to create User")
        return {"response": "User Successfully created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token", response_model=Token)
async def login_user(response: Response, form_data: OAuth2PasswordRequestForm = Depends(),  db: Session = Depends(get_db)):
    """Create a new Access Token.

    Args:
        response (Response): Response object.
        form_data (OAuth2PasswordRequestForm): User credentials.
        db (Session): Database session.

    Returns:
        dict: Access token details."""
    auth_response = authenticate_user(
        db, form_data.username, form_data.password)
    if not auth_response["user"] or not auth_response["password"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=auth_response, headers={"WWW-Authenticate": "Bearer"})
    try:
        # ACCESS TOKEN
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires)
        # REFRESH TOKEN
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": form_data.username}, expires_delta=refresh_token_expires)
        # Set refresh token in HttpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Use HTTP, True for HTTPS
            samesite="Strict",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Some Error Occured while generating access token")


@router.post("/refresh-token")
async def refresh_token(request: Request):
    """Refresh the access token using refresh token.

    Args:
        request (Request): Request object.

    Returns:
        dict: New access token details."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        payload = decode_refresh_token(refresh_token)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            {"sub": payload["sub"]}, expires_delta=access_token_expires)
        return {"access_token": new_access_token}
    except Exception as e:
        logger.debug(f"Error in refreshing access token: {e}")
        raise HTTPException(
            status_code=401, detail=f"Invalid refresh token: {e}")


@router.post("/logout")
async def logout(response: Response):
    """Logout the user by deleting the refresh token cookie.

    Args:
        response (Response): Response object.

    Returns:
        dict: Logout message."""
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: Users = Depends(get_current_active_user)):
    """Returns current user details.

    Args:
        current_user (Users): Current user object.

    Returns:
        dict: Current user details."""
    try:
        current_user = User.model_validate(current_user)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not logged in.")
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
