"""
auth.py
This module contains the authentication routes for user registration, login, token generation, refreshing, and logout.
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.session import get_async_db
from src.database.operations import create_user_in_db, check_user_in_db
from src.users.schemas import Token, UserCreate
from src.users.services import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    create_refresh_token,
    decode_refresh_token,
)

logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 365

router = APIRouter()


@router.post("/register")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_async_db)) -> dict:
    """Create a new User."""
    # Check if user exist in DB
    user_response = await check_user_in_db(user, db)
    if user_response["userExists"] or user_response["emailExists"]:
        raise HTTPException(status_code=409, detail=user_response)
    try:
        # Hash Password
        user.password = get_password_hash(user.password)
        # Create User in DB
        user_created = await create_user_in_db(user, db)
        if not user_created:
            raise HTTPException(
                status_code=500, detail="Failed to create User")
        return {"response": "User Successfully created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token", response_model=Token)
async def login_user(response: Response, form_data: OAuth2PasswordRequestForm = Depends(),  db: AsyncSession = Depends(get_async_db)):
    """Create a new Access Token."""
    auth_response = await authenticate_user(
        db, form_data.username, form_data.password)
    if not auth_response:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail={"message": "Invalid Credentials"}, headers={"WWW-Authenticate": "Bearer"})
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
    """Refresh the access token using refresh token."""
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
    """Logout the user by deleting the refresh token cookie."""
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
