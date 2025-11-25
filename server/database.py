"""
SQLite Database Models for Flashcard App

Uses SQLAlchemy for ORM with SQLite backend.
"""

import os
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, Text, DateTime, Float, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flashcards.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Deck(Base):
    """Deck model - collection of flashcards"""
    __tablename__ = "decks"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    parent_id = Column(String, ForeignKey("decks.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    settings = Column(JSON, default=dict)

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

    id = Column(String, primary_key=True, index=True)
    deck_id = Column(String, ForeignKey("decks.id"), nullable=False, index=True)
    type = Column(String, default="basic")  # basic, cloze, reversible
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    audio = Column(Text, nullable=True)  # Chinese characters for TTS
    tags = Column(JSON, default=list)
    media_urls = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # FSRS fields
    fsrs_due = Column(DateTime, default=datetime.utcnow)
    fsrs_stability = Column(Float, default=0)
    fsrs_difficulty = Column(Float, default=0)
    fsrs_elapsed_days = Column(Integer, default=0)
    fsrs_scheduled_days = Column(Integer, default=0)
    fsrs_reps = Column(Integer, default=0)
    fsrs_lapses = Column(Integer, default=0)
    fsrs_state = Column(Integer, default=0)  # 0=New, 1=Learning, 2=Review, 3=Relearning
    fsrs_last_review = Column(DateTime, nullable=True)

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
    """Review log - tracks each card review"""
    __tablename__ = "review_logs"

    id = Column(String, primary_key=True, index=True)
    card_id = Column(String, ForeignKey("cards.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1=Again, 2=Hard, 3=Good, 4=Easy
    state = Column(Integer, nullable=False)
    due = Column(DateTime, nullable=False)
    stability = Column(Float, nullable=False)
    difficulty = Column(Float, nullable=False)
    elapsed_days = Column(Integer, nullable=False)
    scheduled_days = Column(Integer, nullable=False)
    review = Column(DateTime, default=datetime.utcnow)

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

    id = Column(String, primary_key=True, index=True)
    deck_id = Column(String, ForeignKey("decks.id"), nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    cards_studied = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    again_count = Column(Integer, default=0)
    hard_count = Column(Integer, default=0)
    good_count = Column(Integer, default=0)
    easy_count = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "deckId": self.deck_id,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "cardsStudied": self.cards_studied,
            "correctCount": self.correct_count,
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
