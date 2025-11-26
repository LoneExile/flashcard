"""
SQLite Database Models for Flashcard App

Uses SQLAlchemy for ORM with SQLite backend.
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import create_engine, String, Text, DateTime, Float, Integer, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import sessionmaker, relationship, DeclarativeBase, Mapped, mapped_column

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flashcards.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def utcnow():
    """Return current UTC time (timezone-aware)"""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base"""
    pass


class Deck(Base):
    """Deck model - collection of flashcards"""
    __tablename__ = "decks"
    __table_args__ = (
        UniqueConstraint("name", "parent_id", name="uq_deck_name_parent"),
    )

    id = mapped_column(String, primary_key=True, index=True)
    name = mapped_column(String, nullable=False)
    description = mapped_column(Text, default="")
    parent_id = mapped_column(String, ForeignKey("decks.id"), nullable=True)
    created_at = mapped_column(DateTime, default=utcnow)
    updated_at = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    settings = mapped_column(JSON, default=dict)

    # Relationships
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")
    parent = relationship("Deck", remote_side=[id], backref="subdecks")

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

    id = mapped_column(String, primary_key=True, index=True)
    deck_id = mapped_column(String, ForeignKey("decks.id"), nullable=False, index=True)
    type = mapped_column(String, default="basic")  # basic, cloze, reversible
    front = mapped_column(Text, nullable=False)
    back = mapped_column(Text, nullable=False)
    audio = mapped_column(Text, nullable=True)  # Chinese characters for TTS
    tags = mapped_column(JSON, default=list)
    media_urls = mapped_column(JSON, default=list)
    created_at = mapped_column(DateTime, default=utcnow)
    updated_at = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    # FSRS fields
    fsrs_due = mapped_column(DateTime, default=utcnow)
    fsrs_stability = mapped_column(Float, default=0)
    fsrs_difficulty = mapped_column(Float, default=0)
    fsrs_elapsed_days = mapped_column(Integer, default=0)
    fsrs_scheduled_days = mapped_column(Integer, default=0)
    fsrs_reps = mapped_column(Integer, default=0)
    fsrs_lapses = mapped_column(Integer, default=0)
    fsrs_state = mapped_column(Integer, default=0)  # 0=New, 1=Learning, 2=Review, 3=Relearning
    fsrs_last_review = mapped_column(DateTime, nullable=True)

    # Relationships
    deck = relationship("Deck", back_populates="cards")
    review_logs = relationship("ReviewLog", back_populates="card", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "deckId": self.deck_id,
            "type": self.type,
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

    id = mapped_column(String, primary_key=True, index=True)
    card_id = mapped_column(String, ForeignKey("cards.id"), nullable=False, index=True)
    rating = mapped_column(Integer, nullable=False)  # 1=Again, 2=Hard, 3=Good, 4=Easy
    state = mapped_column(Integer, nullable=False)
    due = mapped_column(DateTime, nullable=False)
    stability = mapped_column(Float, nullable=False)
    difficulty = mapped_column(Float, nullable=False)
    elapsed_days = mapped_column(Integer, nullable=False)
    scheduled_days = mapped_column(Integer, nullable=False)
    review = mapped_column(DateTime, default=utcnow)

    # Relationships
    card = relationship("Card", back_populates="review_logs")

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

    id = mapped_column(String, primary_key=True, index=True)
    deck_id = mapped_column(String, ForeignKey("decks.id"), nullable=False, index=True)
    start_time = mapped_column(DateTime, default=utcnow)
    end_time = mapped_column(DateTime, nullable=True)
    cards_studied = mapped_column(Integer, default=0)
    again_count = mapped_column(Integer, default=0)
    hard_count = mapped_column(Integer, default=0)
    good_count = mapped_column(Integer, default=0)
    easy_count = mapped_column(Integer, default=0)

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
