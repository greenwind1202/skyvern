from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    user_id: str
    is_active: bool
    created_at: datetime
    modified_at: datetime


class User(UserInDB):
    organizations: List[str] = Field(default_factory=list)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    api_key: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str  # user_id
    exp: float  # expiration time
    organization_id: str
