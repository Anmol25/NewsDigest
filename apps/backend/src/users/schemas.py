"""
schemas.py
This module contains the schemas for the users.
"""

from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    fullname: str
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str
    fullname: str
    email: Optional[str] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True
