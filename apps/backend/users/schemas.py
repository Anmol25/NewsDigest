from pydantic import BaseModel
from typing import Optional


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
