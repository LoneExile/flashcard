"""
Authentication Routes for Flashcard App

Handles user registration, login, logout, and session management.
"""

import os
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from database import get_db, User, generate_uuid
from middleware import (
    get_password_hash,
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user,
    get_current_user_optional,
    validate_password,
    ACCESS_TOKEN_EXPIRE_DAYS,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Environment configuration
REGISTRATION_ENABLED = os.getenv("REGISTRATION_ENABLED", "true").lower() == "true"


# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters long")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password_field(cls, v: str) -> str:
        is_valid, error = validate_password(v)
        if not is_valid:
            raise ValueError(error)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    isActive: bool
    isAdmin: bool
    oauthProvider: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class AuthConfigResponse(BaseModel):
    registrationEnabled: bool
    oauthEnabled: bool
    oauthProviders: list[str]


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


# Routes
@router.get("/config", response_model=AuthConfigResponse)
async def get_auth_config():
    """Get authentication configuration (public endpoint)"""
    oauth_enabled = os.getenv("OAUTH_ENABLED", "false").lower() == "true"
    providers = []

    if oauth_enabled:
        if os.getenv("GITHUB_CLIENT_ID"):
            providers.append("github")
        if os.getenv("GOOGLE_CLIENT_ID"):
            providers.append("google")

    return AuthConfigResponse(
        registrationEnabled=REGISTRATION_ENABLED,
        oauthEnabled=oauth_enabled,
        oauthProviders=providers,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Register a new user"""
    if not REGISTRATION_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently disabled",
        )

    # Check if email already exists (case-insensitive)
    from sqlalchemy import func
    existing_email = db.query(User).filter(func.lower(User.email) == request.email.lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    existing_username = db.query(User).filter(User.username == request.username.lower()).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create new user
    user = User(
        id=generate_uuid(),
        email=request.email,
        username=request.username.lower(),
        password_hash=get_password_hash(request.password),
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token and set cookie
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )
    set_auth_cookie(response, access_token)

    return UserResponse(**user.to_dict())


@router.post("/login", response_model=UserResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Login with email and password"""
    # Find user by email (case-insensitive)
    from sqlalchemy import func
    user = db.query(User).filter(func.lower(User.email) == request.email.lower()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if user has a password (not OAuth-only)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses OAuth login. Please sign in with your OAuth provider.",
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    # Create access token and set cookie
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )
    set_auth_cookie(response, access_token)

    return UserResponse(**user.to_dict())


@router.post("/logout")
async def logout(response: Response):
    """Logout current user"""
    clear_auth_cookie(response)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current user information"""
    return UserResponse(**current_user.to_dict())


@router.post("/refresh", response_model=UserResponse)
async def refresh_token(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """Refresh the authentication token"""
    # Create new access token
    access_token = create_access_token(
        data={"sub": current_user.id},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )
    set_auth_cookie(response, access_token)

    return UserResponse(**current_user.to_dict())


@router.put("/password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change current user's password"""
    # Check if user has a password (not OAuth-only)
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for OAuth-only accounts",
        )

    # Verify old password
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Validate new password
    is_valid, error = validate_password(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Update password
    current_user.password_hash = get_password_hash(new_password)
    db.commit()

    return {"message": "Password changed successfully"}
