from typing import Annotated
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from skyvern.forge.sdk.db.client import get_db
from skyvern.forge.sdk.schemas.users import Token, User, UserCreate, UserLogin
from skyvern.forge.sdk.services.auth_service import get_current_active_user
from skyvern.forge.sdk.services.user_service import (
    authenticate_user,
    get_user_by_email,
    add_user_to_organization,
    get_user_with_organizations,
    get_user_by_id,
    get_user_organizations,
    create_user,
)
from skyvern.forge import app
from skyvern.forge.sdk.services import org_auth_service, org_auth_token_service
from skyvern.forge.sdk.schemas.organizations import Organization
from skyvern.forge.sdk.db.enums import OrganizationAuthTokenType
from skyvern.forge.sdk.core import security
from skyvern.forge.sdk.db.models import UserModel, UserOrganizationModel

router = APIRouter(prefix="/auth", tags=["auth"])

# Constants for API key
API_KEY_LIFETIME = timedelta(weeks=5200)  # 100 years


@router.post("/register", response_model=User)
async def register(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user
    """
    # Check if user already exists
    db_user = await get_user_by_email(db, user_create.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create the user
    user = await create_user(db, user_create)

    # Create a default organization for the user
    default_org_name = f"{user.first_name}'s Organization"
    organization = await app.DATABASE.create_organization(
        organization_name=default_org_name
    )

    # Add the user to the organization as an admin
    await add_user_to_organization(
        db=db,
        user_id=user.user_id,
        organization_id=organization.organization_id,
        is_admin=True,
    )

    # Get the user with organizations using the helper function
    user_with_orgs = await get_user_with_organizations(db, user.user_id)
    if not user_with_orgs:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user after creation",
        )

    return user_with_orgs


@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login a user
    """
    user = await authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )

    # Create an API key for the user's first organization
    organizations = await get_user_organizations(db, user.user_id)
    if not organizations:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User has no organizations",
        )

    # Create an API key for the first organization
    org_id = organizations[0]
    api_key = await org_auth_token_service.create_org_api_token(org_id)

    return {"api_key": api_key.token, "token_type": "api_key"}


@router.get("/me", response_model=User)
async def read_users_me(
    db: AsyncSession = Depends(get_db),
    current_org: Organization = Depends(org_auth_service.get_current_org_with_api_key),
):
    """
    Get the current user
    """
    # Get the user from UserOrganizationModel
    result = await db.execute(
        select(UserModel)
        .join(UserOrganizationModel)
        .where(UserOrganizationModel.organization_id == current_org.organization_id)
        .where(UserOrganizationModel.is_admin == True)
    )
    user_model = result.scalars().first()
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
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
