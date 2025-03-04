from typing import Annotated, Optional
import time

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from skyvern.config import settings
from skyvern.forge import app
from skyvern.forge.sdk.db.client import get_db
from skyvern.forge.sdk.schemas.organizations import Organization
from skyvern.forge.sdk.schemas.users import TokenPayload, User
from skyvern.forge.sdk.services.user_service import ALGORITHM, get_user_with_organizations, get_user_by_id, get_user_organizations

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """
    Get the current user from the authorization header
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Extract the token from the Authorization header
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Decode the token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)

        # Check if token is expired
        if token_data.exp < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get the user by ID (token.sub is the user_id)
        user_model = await get_user_by_id(db, token_data.sub)
        if user_model is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get the user's organizations
        organizations = await get_user_organizations(db, user_model.user_id)

        # Convert to Pydantic model
        user = User(
            user_id=user_model.user_id,
            email=user_model.email,
            first_name=user_model.first_name,
            last_name=user_model.last_name,
            is_active=user_model.is_active,
            created_at=user_model.created_at,
            modified_at=user_model.modified_at,
            organizations=organizations,
        )

        return user

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


async def get_user_organization(
    organization_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> Organization:
    """
    Get an organization that the user has access to
    """
    if organization_id not in current_user.organizations:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this organization",
        )

    # Get the organization
    organization = await app.DATABASE.get_organization(organization_id=organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return organization
