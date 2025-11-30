"""
Admin Routes for Flashcard App

Handles user management and system administration.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, User, Deck, Card, StudySession, ReviewLog
from middleware import get_admin_user, get_password_hash, validate_password

router = APIRouter(prefix="/admin", tags=["admin"])


# Request/Response Models
class UserListResponse(BaseModel):
    users: list[dict]
    total: int
    page: int
    pageSize: int


class UserUpdateRequest(BaseModel):
    isActive: Optional[bool] = None
    isAdmin: Optional[bool] = None
    password: Optional[str] = None


class UserCreateRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    isAdmin: bool = False


class SystemStatsResponse(BaseModel):
    totalUsers: int
    activeUsers: int
    totalDecks: int
    totalCards: int
    totalStudySessions: int
    totalReviews: int


# Routes
@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all users with pagination and filters"""
    query = db.query(User)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_pattern)) |
            (User.username.ilike(search_pattern))
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    return UserListResponse(
        users=[user.to_dict() for user in users],
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed information about a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get user statistics
    deck_count = db.query(func.count(Deck.id)).filter(Deck.user_id == user_id).scalar()
    card_count = db.query(func.count(Card.id)).join(Deck).filter(Deck.user_id == user_id).scalar()
    session_count = db.query(func.count(StudySession.id)).filter(StudySession.user_id == user_id).scalar()

    user_data = user.to_dict()
    user_data["stats"] = {
        "deckCount": deck_count,
        "cardCount": card_count,
        "sessionCount": session_count,
    }

    return user_data


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update a user's status or admin privileges"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-demotion from admin
    if user.id == current_user.id and request.isAdmin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges",
        )

    # Prevent self-deactivation
    if user.id == current_user.id and request.isActive is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Update fields
    if request.isActive is not None:
        user.is_active = request.isActive

    if request.isAdmin is not None:
        user.is_admin = request.isAdmin

    if request.password is not None:
        is_valid, error = validate_password(request.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error,
            )
        user.password_hash = get_password_hash(request.password)

    db.commit()
    db.refresh(user)

    return user.to_dict()


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new user (admin only)"""
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check if username already exists
    username = request.username.lower()
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Validate password
    is_valid, error = validate_password(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Create user
    from database import generate_uuid
    user = User(
        id=generate_uuid(),
        email=request.email,
        username=username,
        password_hash=get_password_hash(request.password),
        is_active=True,
        is_admin=request.isAdmin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user.to_dict()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a user and all their data"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Delete user (cascades to all related data)
    db.delete(user)
    db.commit()

    return {"message": f"User {user.username} and all their data have been deleted"}


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get system-wide statistics"""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_decks = db.query(func.count(Deck.id)).scalar()
    total_cards = db.query(func.count(Card.id)).scalar()
    total_sessions = db.query(func.count(StudySession.id)).scalar()
    total_reviews = db.query(func.count(ReviewLog.id)).scalar()

    return SystemStatsResponse(
        totalUsers=total_users,
        activeUsers=active_users,
        totalDecks=total_decks,
        totalCards=total_cards,
        totalStudySessions=total_sessions,
        totalReviews=total_reviews,
    )
