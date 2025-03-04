import time
from datetime import datetime, timedelta
from typing import List, Optional

import bcrypt
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from skyvern.config import settings
from skyvern.forge.sdk.db.models import OrganizationModel, UserModel, UserOrganizationModel
from skyvern.forge.sdk.schemas.users import User, UserCreate, UserInDB, UserUpdate

# Constants for JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[UserModel]:
    """Get a user by email"""
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[UserModel]:
    """Get a user by ID"""
    result = await db.execute(select(UserModel).where(UserModel.user_id == user_id))
    return result.scalars().first()


async def get_user_organizations(db: AsyncSession, user_id: str) -> List[str]:
    """Get all organizations for a user"""
    result = await db.execute(
        select(UserOrganizationModel.organization_id).where(UserOrganizationModel.user_id == user_id)
    )
    return result.scalars().all()


async def create_user(db: AsyncSession, user_create: UserCreate) -> User:
    """Create a new user"""
    # Hash the password
    hashed_password = hash_password(user_create.password)

    # Create the user
    db_user = UserModel(
        email=user_create.email,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        password=hashed_password,
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Convert to Pydantic model
    user = User(
        user_id=db_user.user_id,
        email=db_user.email,
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        is_active=db_user.is_active,
        created_at=db_user.created_at,
        modified_at=db_user.modified_at,
        organizations=[],  # New user has no organizations yet
    )

    return user


async def update_user(db: AsyncSession, user_id: str, user_update: UserUpdate) -> Optional[UserModel]:
    """Update a user"""
    db_user = await get_user_by_id(db, user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)

    # Hash the password if it's being updated
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])

    for key, value in update_data.items():
        setattr(db_user, key, value)

    await db.commit()
    await db.refresh(db_user)

    return db_user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[UserModel]:
    """Authenticate a user"""
    user = await get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user


async def add_user_to_organization(db: AsyncSession, user_id: str, organization_id: str, is_admin: bool = False) -> UserOrganizationModel:
    """Add a user to an organization"""
    db_user_org = UserOrganizationModel(
        user_id=user_id,
        organization_id=organization_id,
        is_admin=is_admin,
    )

    db.add(db_user_org)
    await db.commit()
    await db.refresh(db_user_org)

    return db_user_org


async def get_user_with_organizations(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get a user with their organizations"""
    db_user = await get_user_by_id(db, user_id)
    if not db_user:
        return None

    # Get the user's organizations
    organizations = await get_user_organizations(db, user_id)

    # Convert to Pydantic model
    user = User(
        user_id=db_user.user_id,
        email=db_user.email,
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        is_active=db_user.is_active,
        created_at=db_user.created_at,
        modified_at=db_user.modified_at,
        organizations=organizations,
    )

    return user


def create_access_token(data: dict) -> str:
    """Create a JWT access token for a user"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": time.mktime(expire.timetuple())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    """Hash a password"""
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
