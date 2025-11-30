"""
OAuth Configuration for Flashcard App

Handles OAuth authentication with GitHub and Google providers.
"""

import os
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from sqlalchemy.orm import Session

from database import get_db, User, generate_uuid
from middleware import (
    create_access_token,
    set_auth_cookie,
    ACCESS_TOKEN_EXPIRE_DAYS,
)

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])

# OAuth configuration
OAUTH_ENABLED = os.getenv("OAUTH_ENABLED", "false").lower() == "true"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Initialize OAuth client
oauth = OAuth()

# Configure GitHub OAuth
if os.getenv("GITHUB_CLIENT_ID"):
    oauth.register(
        name="github",
        client_id=os.getenv("GITHUB_CLIENT_ID"),
        client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
        access_token_url="https://github.com/login/oauth/access_token",
        access_token_params=None,
        authorize_url="https://github.com/login/oauth/authorize",
        authorize_params=None,
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "user:email"},
    )

# Configure Google OAuth
if os.getenv("GOOGLE_CLIENT_ID"):
    oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def check_oauth_enabled():
    """Check if OAuth is enabled"""
    if not OAUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth authentication is not enabled",
        )


@router.get("/{provider}")
async def oauth_login(provider: str, request: Request):
    """Initiate OAuth login flow"""
    check_oauth_enabled()

    if provider not in ["github", "google"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider {provider} is not configured",
        )

    redirect_uri = request.url_for("oauth_callback", provider=provider)
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Handle OAuth callback"""
    check_oauth_enabled()

    if provider not in ["github", "google"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider {provider} is not configured",
        )

    try:
        token = await client.authorize_access_token(request)
    except OAuthError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error.error}",
        )

    # Get user info from provider
    if provider == "github":
        user_info = await get_github_user_info(client, token)
    elif provider == "google":
        user_info = await get_google_user_info(token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    # Find or create user
    user = db.query(User).filter(
        User.oauth_provider == provider,
        User.oauth_id == user_info["oauth_id"],
    ).first()

    if not user:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_info["email"]).first()
        if existing_user:
            # Link OAuth to existing account
            existing_user.oauth_provider = provider
            existing_user.oauth_id = user_info["oauth_id"]
            db.commit()
            user = existing_user
        else:
            # Create new user
            user = User(
                id=generate_uuid(),
                email=user_info["email"],
                username=generate_unique_username(db, user_info["username"]),
                oauth_provider=provider,
                oauth_id=user_info["oauth_id"],
                is_active=True,
                is_admin=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Check if user is active
    if not user.is_active:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=account_deactivated",
            status_code=status.HTTP_302_FOUND,
        )

    # Create access token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )

    # Create response with redirect
    redirect_response = RedirectResponse(
        url=f"{FRONTEND_URL}/oauth/callback?success=true",
        status_code=status.HTTP_302_FOUND,
    )
    set_auth_cookie(redirect_response, access_token)

    return redirect_response


async def get_github_user_info(client, token: dict) -> dict:
    """Get user info from GitHub API"""
    resp = await client.get("user", token=token)
    profile = resp.json()

    # Get primary email
    email = profile.get("email")
    if not email:
        # Fetch emails if not public
        emails_resp = await client.get("user/emails", token=token)
        emails = emails_resp.json()
        for email_info in emails:
            if email_info.get("primary"):
                email = email_info["email"]
                break

    return {
        "oauth_id": str(profile["id"]),
        "email": email,
        "username": profile.get("login", "").lower(),
    }


async def get_google_user_info(token: dict) -> dict:
    """Get user info from Google ID token"""
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from Google",
        )

    # Generate username from email
    email = user_info["email"]
    username = email.split("@")[0].lower()

    return {
        "oauth_id": user_info["sub"],
        "email": email,
        "username": username,
    }


def generate_unique_username(db: Session, base_username: str) -> str:
    """Generate a unique username by appending numbers if necessary"""
    username = base_username[:50]  # Truncate to max length

    # Clean username
    clean_username = "".join(c if c.isalnum() or c in "_-" else "" for c in username).lower()
    if not clean_username:
        clean_username = "user"

    # Check if username exists
    existing = db.query(User).filter(User.username == clean_username).first()
    if not existing:
        return clean_username

    # Append numbers until unique
    counter = 1
    while True:
        new_username = f"{clean_username[:45]}{counter}"
        existing = db.query(User).filter(User.username == new_username).first()
        if not existing:
            return new_username
        counter += 1
