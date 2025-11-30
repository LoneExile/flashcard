"""
PostgreSQL Database Models for Flashcard App

Uses SQLAlchemy for ORM with PostgreSQL backend.
Supports user authentication and per-user data isolation.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import create_engine, String, Text, DateTime, Float, Integer, Boolean, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import sessionmaker, relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://flashcard:flashcard@localhost:5432/flashcard")

# Use NullPool for PostgreSQL to avoid connection issues
if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL, poolclass=NullPool)
else:
    # Fallback for SQLite (development only)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def utcnow():
    """Return current UTC time (timezone-aware)"""
    return datetime.now(timezone.utc)


def generate_uuid():
    """Generate a new UUID string"""
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base"""
    pass


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Nullable for OAuth-only users

    # OAuth fields
    oauth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'github', 'google', or null
    oauth_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Provider-specific user ID

    # Status fields
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    decks: Mapped[List["Deck"]] = relationship("Deck", back_populates="user", cascade="all, delete-orphan")
    study_sessions: Mapped[List["StudySession"]] = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_oauth", "oauth_provider", "oauth_id"),
    )

    def to_dict(self, include_sensitive: bool = False):
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "isActive": self.is_active,
            "isAdmin": self.is_admin,
            "oauthProvider": self.oauth_provider,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
        return data


class Deck(Base):
    """Deck model - collection of flashcards"""
    __tablename__ = "decks"
    __table_args__ = (
        UniqueConstraint("name", "parent_id", "user_id", name="uq_deck_name_parent_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    parent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("decks.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="decks")
    cards: Mapped[List["Card"]] = relationship("Card", back_populates="deck", cascade="all, delete-orphan")
    parent: Mapped[Optional["Deck"]] = relationship("Deck", remote_side=[id], backref="subdecks")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "parentId": self.parent_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "settings": self.settings or {},
        }


class Card(Base):
    """Card model - individual flashcard with FSRS data"""
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    deck_id: Mapped[str] = mapped_column(String(36), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), default="basic")  # basic, cloze, reversible
    direction: Mapped[str] = mapped_column(String(20), default="normal")  # normal, reverse
    pair_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)  # Links normal+reverse cards
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    audio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Chinese characters for TTS
    tags: Mapped[list] = mapped_column(JSON, default=list)
    media_urls: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # FSRS fields
    fsrs_due: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    fsrs_stability: Mapped[float] = mapped_column(Float, default=0)
    fsrs_difficulty: Mapped[float] = mapped_column(Float, default=0)
    fsrs_elapsed_days: Mapped[int] = mapped_column(Integer, default=0)
    fsrs_scheduled_days: Mapped[int] = mapped_column(Integer, default=0)
    fsrs_reps: Mapped[int] = mapped_column(Integer, default=0)
    fsrs_lapses: Mapped[int] = mapped_column(Integer, default=0)
    fsrs_state: Mapped[int] = mapped_column(Integer, default=0)  # 0=New, 1=Learning, 2=Review, 3=Relearning
    fsrs_last_review: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    deck: Mapped["Deck"] = relationship("Deck", back_populates="cards")
    review_logs: Mapped[List["ReviewLog"]] = relationship("ReviewLog", back_populates="card", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_cards_deck_due", "deck_id", "fsrs_due"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "deckId": self.deck_id,
            "type": self.type,
            "direction": self.direction,
            "pairId": self.pair_id,
            "front": self.front,
            "back": self.back,
            "audio": self.audio,
            "tags": self.tags or [],
            "mediaUrls": self.media_urls or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "fsrs": {
                "due": self.fsrs_due.isoformat() if self.fsrs_due else None,
                "stability": self.fsrs_stability,
                "difficulty": self.fsrs_difficulty,
                "elapsed_days": self.fsrs_elapsed_days,
                "scheduled_days": self.fsrs_scheduled_days,
                "reps": self.fsrs_reps,
                "lapses": self.fsrs_lapses,
                "state": self.fsrs_state,
                "last_review": self.fsrs_last_review.isoformat() if self.fsrs_last_review else None,
            },
        }


class ReviewLog(Base):
    """Review log - tracks each card review for FSRS history"""
    __tablename__ = "review_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    card_id: Mapped[str] = mapped_column(String(36), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1=Again, 2=Hard, 3=Good, 4=Easy
    state: Mapped[int] = mapped_column(Integer, nullable=False)
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    stability: Mapped[float] = mapped_column(Float, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, nullable=False)
    elapsed_days: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_days: Mapped[int] = mapped_column(Integer, nullable=False)
    review: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Relationships
    card: Mapped["Card"] = relationship("Card", back_populates="review_logs")

    __table_args__ = (
        Index("ix_review_logs_card_review", "card_id", "review"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "cardId": self.card_id,
            "rating": self.rating,
            "state": self.state,
            "due": self.due.isoformat() if self.due else None,
            "stability": self.stability,
            "difficulty": self.difficulty,
            "elapsedDays": self.elapsed_days,
            "scheduledDays": self.scheduled_days,
            "review": self.review.isoformat() if self.review else None,
        }


class StudySession(Base):
    """Study session - tracks study sessions"""
    __tablename__ = "study_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    deck_id: Mapped[str] = mapped_column(String(36), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cards_studied: Mapped[int] = mapped_column(Integer, default=0)
    again_count: Mapped[int] = mapped_column(Integer, default=0)
    hard_count: Mapped[int] = mapped_column(Integer, default=0)
    good_count: Mapped[int] = mapped_column(Integer, default=0)
    easy_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="study_sessions")

    __table_args__ = (
        Index("ix_study_sessions_user_deck", "user_id", "deck_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "deckId": self.deck_id,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "cardsStudied": self.cards_studied,
            "correctCount": self.good_count + self.easy_count,  # Computed: Good + Easy
            "againCount": self.again_count,
            "hardCount": self.hard_count,
            "goodCount": self.good_count,
            "easyCount": self.easy_count,
        }


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
