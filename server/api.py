"""
API Routes for Flashcard App

CRUD operations for decks, cards, and review logs.
All endpoints require authentication and are user-scoped.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Deck, Card, ReviewLog, StudySession, User
from middleware import get_current_user

router = APIRouter(prefix="/api", tags=["flashcards"])


# ============== Pydantic Models ==============

class DeckCreate(BaseModel):
    id: str
    name: str
    description: str = ""
    parentId: Optional[str] = None
    settings: dict = {}


class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parentId: Optional[str] = None
    settings: Optional[dict] = None


class FSRSData(BaseModel):
    due: str
    stability: float = 0
    difficulty: float = 0
    elapsed_days: int = 0
    scheduled_days: int = 0
    reps: int = 0
    lapses: int = 0
    state: int = 0
    last_review: Optional[str] = None


class CardCreate(BaseModel):
    id: str
    deckId: str
    type: str = "basic"
    direction: str = "normal"
    pairId: Optional[str] = None
    front: str
    back: str
    audio: Optional[str] = None
    tags: List[str] = []
    mediaUrls: List[str] = []
    fsrs: FSRSData


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    audio: Optional[str] = None
    tags: Optional[List[str]] = None
    type: Optional[str] = None
    direction: Optional[str] = None
    pairId: Optional[str] = None
    fsrs: Optional[FSRSData] = None


class ReviewLogCreate(BaseModel):
    id: str
    cardId: str
    rating: int
    state: int
    due: str
    stability: float
    difficulty: float
    elapsedDays: int
    scheduledDays: int
    review: str


class StudySessionCreate(BaseModel):
    id: str
    deckId: str
    startTime: str
    endTime: Optional[str] = None
    cardsStudied: int = 0
    correctCount: int = 0
    againCount: int = 0
    hardCount: int = 0
    goodCount: int = 0
    easyCount: int = 0


class SyncRequest(BaseModel):
    """Request body for syncing all data from frontend"""
    decks: List[DeckCreate]
    cards: List[CardCreate]
    reviewLogs: List[ReviewLogCreate] = []
    studySessions: List[StudySessionCreate] = []


# ============== Helper Functions ==============

def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string"""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.now(timezone.utc)


def get_user_deck(db: Session, deck_id: str, user_id: str) -> Deck:
    """Get a deck and verify it belongs to the user"""
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.user_id == user_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


def get_user_card(db: Session, card_id: str, user_id: str) -> Card:
    """Get a card and verify it belongs to the user"""
    card = db.query(Card).join(Deck).filter(Card.id == card_id, Deck.user_id == user_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


# ============== Deck Endpoints ==============

@router.get("/decks")
def get_decks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all decks for the current user"""
    decks = db.query(Deck).filter(Deck.user_id == current_user.id).all()
    return [d.to_dict() for d in decks]


@router.get("/decks/{deck_id}")
def get_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific deck"""
    deck = get_user_deck(db, deck_id, current_user.id)
    return deck.to_dict()


@router.post("/decks")
def create_deck(
    deck: DeckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new deck"""
    # Verify parent deck belongs to user if specified
    if deck.parentId:
        get_user_deck(db, deck.parentId, current_user.id)

    db_deck = Deck(
        id=deck.id,
        user_id=current_user.id,
        name=deck.name,
        description=deck.description,
        parent_id=deck.parentId,
        settings=deck.settings,
    )
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck.to_dict()


@router.put("/decks/{deck_id}")
def update_deck(
    deck_id: str,
    deck: DeckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a deck"""
    db_deck = get_user_deck(db, deck_id, current_user.id)

    if deck.name is not None:
        db_deck.name = deck.name
    if deck.description is not None:
        db_deck.description = deck.description
    if deck.parentId is not None:
        # Verify parent deck belongs to user
        if deck.parentId:
            get_user_deck(db, deck.parentId, current_user.id)
        db_deck.parent_id = deck.parentId
    if deck.settings is not None:
        db_deck.settings = deck.settings

    db.commit()
    db.refresh(db_deck)
    return db_deck.to_dict()


@router.delete("/decks/{deck_id}")
def delete_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a deck and all its cards"""
    db_deck = get_user_deck(db, deck_id, current_user.id)
    db.delete(db_deck)
    db.commit()
    return {"status": "ok", "message": "Deck deleted"}


# ============== Card Endpoints ==============

@router.get("/cards")
def get_cards(
    deck_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all cards for the current user, optionally filtered by deck"""
    query = db.query(Card).join(Deck).filter(Deck.user_id == current_user.id)
    if deck_id:
        # Verify deck belongs to user
        get_user_deck(db, deck_id, current_user.id)
        query = query.filter(Card.deck_id == deck_id)
    cards = query.all()
    return [c.to_dict() for c in cards]


@router.get("/cards/due")
def get_due_cards(
    deck_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get cards that are due for review"""
    now = datetime.now(timezone.utc)
    query = db.query(Card).join(Deck).filter(
        Deck.user_id == current_user.id,
        Card.fsrs_due <= now,
    )
    if deck_id:
        get_user_deck(db, deck_id, current_user.id)
        query = query.filter(Card.deck_id == deck_id)
    cards = query.all()
    return [c.to_dict() for c in cards]


@router.get("/cards/{card_id}")
def get_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific card"""
    card = get_user_card(db, card_id, current_user.id)
    return card.to_dict()


@router.post("/cards")
def create_card(
    card: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new card"""
    # Verify deck belongs to user
    get_user_deck(db, card.deckId, current_user.id)

    db_card = Card(
        id=card.id,
        deck_id=card.deckId,
        type=card.type,
        direction=card.direction,
        pair_id=card.pairId,
        front=card.front,
        back=card.back,
        audio=card.audio,
        tags=card.tags,
        media_urls=card.mediaUrls,
        fsrs_due=parse_datetime(card.fsrs.due),
        fsrs_stability=card.fsrs.stability,
        fsrs_difficulty=card.fsrs.difficulty,
        fsrs_elapsed_days=card.fsrs.elapsed_days,
        fsrs_scheduled_days=card.fsrs.scheduled_days,
        fsrs_reps=card.fsrs.reps,
        fsrs_lapses=card.fsrs.lapses,
        fsrs_state=card.fsrs.state,
        fsrs_last_review=parse_datetime(card.fsrs.last_review),
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card.to_dict()


@router.put("/cards/{card_id}")
def update_card(
    card_id: str,
    card: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a card"""
    db_card = get_user_card(db, card_id, current_user.id)

    if card.front is not None:
        db_card.front = card.front
    if card.back is not None:
        db_card.back = card.back
    if card.audio is not None:
        db_card.audio = card.audio
    if card.tags is not None:
        db_card.tags = card.tags
    if card.type is not None:
        db_card.type = card.type
    if card.direction is not None:
        db_card.direction = card.direction
    if card.pairId is not None:
        db_card.pair_id = card.pairId
    if card.fsrs is not None:
        db_card.fsrs_due = parse_datetime(card.fsrs.due)
        db_card.fsrs_stability = card.fsrs.stability
        db_card.fsrs_difficulty = card.fsrs.difficulty
        db_card.fsrs_elapsed_days = card.fsrs.elapsed_days
        db_card.fsrs_scheduled_days = card.fsrs.scheduled_days
        db_card.fsrs_reps = card.fsrs.reps
        db_card.fsrs_lapses = card.fsrs.lapses
        db_card.fsrs_state = card.fsrs.state
        db_card.fsrs_last_review = parse_datetime(card.fsrs.last_review)

    db.commit()
    db.refresh(db_card)
    return db_card.to_dict()


@router.delete("/cards/{card_id}")
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a card"""
    db_card = get_user_card(db, card_id, current_user.id)
    db.delete(db_card)
    db.commit()
    return {"status": "ok", "message": "Card deleted"}


# ============== Review Log Endpoints ==============

@router.get("/review-logs")
def get_review_logs(
    card_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get review logs for the current user's cards"""
    query = db.query(ReviewLog).join(Card).join(Deck).filter(Deck.user_id == current_user.id)
    if card_id:
        get_user_card(db, card_id, current_user.id)
        query = query.filter(ReviewLog.card_id == card_id)
    logs = query.order_by(ReviewLog.review.desc()).all()
    return [l.to_dict() for l in logs]


@router.post("/review-logs")
def create_review_log(
    log: ReviewLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a review log entry"""
    # Verify card belongs to user
    get_user_card(db, log.cardId, current_user.id)

    db_log = ReviewLog(
        id=log.id,
        card_id=log.cardId,
        rating=log.rating,
        state=log.state,
        due=parse_datetime(log.due),
        stability=log.stability,
        difficulty=log.difficulty,
        elapsed_days=log.elapsedDays,
        scheduled_days=log.scheduledDays,
        review=parse_datetime(log.review),
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log.to_dict()


# ============== Study Session Endpoints ==============

@router.get("/study-sessions")
def get_study_sessions(
    deck_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get study sessions for the current user"""
    query = db.query(StudySession).filter(StudySession.user_id == current_user.id)
    if deck_id:
        get_user_deck(db, deck_id, current_user.id)
        query = query.filter(StudySession.deck_id == deck_id)
    sessions = query.order_by(StudySession.start_time.desc()).all()
    return [s.to_dict() for s in sessions]


@router.post("/study-sessions")
def create_study_session(
    session: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a study session"""
    # Verify deck belongs to user
    get_user_deck(db, session.deckId, current_user.id)

    db_session = StudySession(
        id=session.id,
        user_id=current_user.id,
        deck_id=session.deckId,
        start_time=parse_datetime(session.startTime),
        end_time=parse_datetime(session.endTime),
        cards_studied=session.cardsStudied,
        again_count=session.againCount,
        hard_count=session.hardCount,
        good_count=session.goodCount,
        easy_count=session.easyCount,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session.to_dict()


@router.put("/study-sessions/{session_id}")
def update_study_session(
    session_id: str,
    session: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a study session"""
    db_session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id,
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.end_time = parse_datetime(session.endTime)
    db_session.cards_studied = session.cardsStudied
    db_session.again_count = session.againCount
    db_session.hard_count = session.hardCount
    db_session.good_count = session.goodCount
    db_session.easy_count = session.easyCount

    db.commit()
    db.refresh(db_session)
    return db_session.to_dict()


# ============== Sync Endpoints ==============

@router.post("/sync")
def sync_all_data(
    data: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sync all data from frontend to backend for the current user.
    This replaces all existing data for the user with the provided data.
    """
    try:
        # Clear existing data for this user only
        # Delete in order: ReviewLogs -> StudySessions -> Cards -> Decks
        user_deck_ids = [d.id for d in db.query(Deck.id).filter(Deck.user_id == current_user.id).all()]

        if user_deck_ids:
            db.query(ReviewLog).filter(
                ReviewLog.card_id.in_(
                    db.query(Card.id).filter(Card.deck_id.in_(user_deck_ids))
                )
            ).delete(synchronize_session=False)
            db.query(StudySession).filter(StudySession.user_id == current_user.id).delete()
            db.query(Card).filter(Card.deck_id.in_(user_deck_ids)).delete(synchronize_session=False)
            db.query(Deck).filter(Deck.user_id == current_user.id).delete()

        # Import decks
        for deck in data.decks:
            db_deck = Deck(
                id=deck.id,
                user_id=current_user.id,
                name=deck.name,
                description=deck.description,
                parent_id=deck.parentId,
                settings=deck.settings,
            )
            db.add(db_deck)

        db.flush()  # Ensure decks are created before cards

        # Import cards
        for card in data.cards:
            db_card = Card(
                id=card.id,
                deck_id=card.deckId,
                type=card.type,
                direction=getattr(card, 'direction', 'normal'),
                pair_id=getattr(card, 'pairId', None),
                front=card.front,
                back=card.back,
                audio=card.audio,
                tags=card.tags,
                media_urls=card.mediaUrls,
                fsrs_due=parse_datetime(card.fsrs.due),
                fsrs_stability=card.fsrs.stability,
                fsrs_difficulty=card.fsrs.difficulty,
                fsrs_elapsed_days=card.fsrs.elapsed_days,
                fsrs_scheduled_days=card.fsrs.scheduled_days,
                fsrs_reps=card.fsrs.reps,
                fsrs_lapses=card.fsrs.lapses,
                fsrs_state=card.fsrs.state,
                fsrs_last_review=parse_datetime(card.fsrs.last_review),
            )
            db.add(db_card)

        db.flush()

        # Import review logs
        for log in data.reviewLogs:
            db_log = ReviewLog(
                id=log.id,
                card_id=log.cardId,
                rating=log.rating,
                state=log.state,
                due=parse_datetime(log.due),
                stability=log.stability,
                difficulty=log.difficulty,
                elapsed_days=log.elapsedDays,
                scheduled_days=log.scheduledDays,
                review=parse_datetime(log.review),
            )
            db.add(db_log)

        # Import study sessions
        for session in data.studySessions:
            db_session = StudySession(
                id=session.id,
                user_id=current_user.id,
                deck_id=session.deckId,
                start_time=parse_datetime(session.startTime),
                end_time=parse_datetime(session.endTime),
                cards_studied=session.cardsStudied,
                again_count=session.againCount,
                hard_count=session.hardCount,
                good_count=session.goodCount,
                easy_count=session.easyCount,
            )
            db.add(db_session)

        db.commit()

        return {
            "status": "ok",
            "message": "Data synced successfully",
            "counts": {
                "decks": len(data.decks),
                "cards": len(data.cards),
                "reviewLogs": len(data.reviewLogs),
                "studySessions": len(data.studySessions),
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/sync")
def get_all_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all data for the current user for syncing to frontend"""
    decks = db.query(Deck).filter(Deck.user_id == current_user.id).all()
    deck_ids = [d.id for d in decks]

    cards = db.query(Card).filter(Card.deck_id.in_(deck_ids)).all() if deck_ids else []
    card_ids = [c.id for c in cards]

    review_logs = db.query(ReviewLog).filter(ReviewLog.card_id.in_(card_ids)).all() if card_ids else []
    study_sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()

    return {
        "decks": [d.to_dict() for d in decks],
        "cards": [c.to_dict() for c in cards],
        "reviewLogs": [l.to_dict() for l in review_logs],
        "studySessions": [s.to_dict() for s in study_sessions],
    }


# ============== Stats Endpoints ==============

@router.get("/stats/deck/{deck_id}")
def get_deck_stats(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get statistics for a deck"""
    # Verify deck belongs to user
    get_user_deck(db, deck_id, current_user.id)

    now = datetime.now(timezone.utc)

    total_cards = db.query(Card).filter(Card.deck_id == deck_id).count()
    due_cards = db.query(Card).filter(
        Card.deck_id == deck_id,
        Card.fsrs_due <= now
    ).count()

    new_cards = db.query(Card).filter(
        Card.deck_id == deck_id,
        Card.fsrs_state == 0
    ).count()

    learning_cards = db.query(Card).filter(
        Card.deck_id == deck_id,
        Card.fsrs_state.in_([1, 3])
    ).count()

    review_cards = db.query(Card).filter(
        Card.deck_id == deck_id,
        Card.fsrs_state == 2
    ).count()

    # Calculate average retention
    cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    if cards:
        avg_stability = sum(c.fsrs_stability for c in cards) / len(cards)
    else:
        avg_stability = 0

    return {
        "totalCards": total_cards,
        "dueCards": due_cards,
        "newCards": new_cards,
        "learningCards": learning_cards,
        "reviewCards": review_cards,
        "averageRetention": min(avg_stability / 30, 1) if avg_stability > 0 else 0,
        "streak": 0,  # TODO: Calculate streak from review logs
    }
