"""
Flashcard App Backend Server

Features:
- User authentication with email/password and OAuth (GitHub, Google)
- Text-to-Speech using Microsoft Edge TTS
- PostgreSQL database for persistent storage
- REST API for decks, cards, and study data

Requirements:
    pip install -r requirements.txt

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import hashlib
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware

from database import init_db, SessionLocal, User, generate_uuid
from api import router as api_router
from auth import router as auth_router
from admin import router as admin_router
from oauth import router as oauth_router
from middleware import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache directory for generated audio
CACHE_DIR = Path(tempfile.gettempdir()) / "edge_tts_cache"
CACHE_DIR.mkdir(exist_ok=True)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def bootstrap_admin():
    """Create admin user on startup if configured"""
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        logger.info("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin bootstrap")
        return

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            logger.info(f"Admin user {admin_email} already exists")
            # Ensure they are admin
            if not existing_admin.is_admin:
                existing_admin.is_admin = True
                db.commit()
                logger.info(f"Updated {admin_email} to admin status")
            return

        # Create admin user
        admin_user = User(
            id=generate_uuid(),
            email=admin_email,
            username=admin_email.split("@")[0].lower(),
            password_hash=get_password_hash(admin_password),
            is_active=True,
            is_admin=True,
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Created admin user: {admin_email}")
    except Exception as e:
        logger.error(f"Failed to bootstrap admin: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Flashcard App Backend...")
    init_db()
    bootstrap_admin()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down Flashcard App Backend...")


app = FastAPI(
    title="Flashcard App API",
    description="Backend API for Flashcard App with authentication, TTS, and PostgreSQL storage",
    version="2.0.0",
    lifespan=lifespan,
)

# Add session middleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600,  # 1 hour session
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3100",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(admin_router)
app.include_router(api_router)

# Available Chinese voices (Microsoft Edge)
CHINESE_VOICES = {
    "xiaoxiao": "zh-CN-XiaoxiaoNeural",      # Female, warm and cheerful
    "xiaoyi": "zh-CN-XiaoyiNeural",          # Female, lively
    "yunjian": "zh-CN-YunjianNeural",        # Male, professional
    "yunxi": "zh-CN-YunxiNeural",            # Male, cheerful
    "yunxia": "zh-CN-YunxiaNeural",          # Male, calm
    "yunyang": "zh-CN-YunyangNeural",        # Male, professional news
    "liaoning": "zh-CN-liaoning-XiaobeiNeural",  # Female, Liaoning dialect
    "shaanxi": "zh-CN-shaanxi-XiaoniNeural",     # Female, Shaanxi dialect
}

# Default voice
DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"


class TTSRequest(BaseModel):
    """Request body for TTS generation"""
    text: str
    voice: Optional[str] = None
    rate: Optional[str] = "+0%"   # Speed: -50% to +100%
    pitch: Optional[str] = "+0Hz"  # Pitch adjustment


def get_cache_path(text: str, voice: str, rate: str, pitch: str) -> Path:
    """Generate cache file path based on parameters hash"""
    hash_input = f"{text}:{voice}:{rate}:{pitch}".encode('utf-8')
    hash_key = hashlib.md5(hash_input).hexdigest()
    return CACHE_DIR / f"{hash_key}.mp3"


async def generate_audio(text: str, voice: str, rate: str, pitch: str, output_path: Path):
    """Generate audio using edge-tts"""
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="edge-tts not installed. Run: pip install edge-tts"
        )

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(output_path))


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Flashcard App API",
        "version": "2.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        import edge_tts
        edge_tts_installed = True
    except ImportError:
        edge_tts_installed = False

    return {
        "status": "healthy" if edge_tts_installed else "degraded",
        "edge_tts_installed": edge_tts_installed,
        "cache_dir": str(CACHE_DIR),
        "default_voice": DEFAULT_VOICE
    }


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Generate speech from text.

    Args:
        request: TTSRequest with text and optional voice/rate/pitch

    Returns:
        Audio file (MP3 format)
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Resolve voice name
    voice = request.voice or DEFAULT_VOICE
    if voice in CHINESE_VOICES:
        voice = CHINESE_VOICES[voice]

    rate = request.rate or "+0%"
    pitch = request.pitch or "+0Hz"

    # Check cache first
    cache_path = get_cache_path(request.text, voice, rate, pitch)
    if cache_path.exists():
        return FileResponse(
            cache_path,
            media_type="audio/mpeg",
            headers={"X-Cache": "HIT"}
        )

    # Generate audio
    try:
        await generate_audio(request.text, voice, rate, pitch, cache_path)

        return FileResponse(
            cache_path,
            media_type="audio/mpeg",
            headers={"X-Cache": "MISS"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS generation failed: {str(e)}"
        )


@app.get("/tts")
async def text_to_speech_get(
    text: str = Query(..., description="Text to synthesize"),
    voice: Optional[str] = Query(None, description="Voice name or full voice ID"),
    rate: Optional[str] = Query("+0%", description="Speech rate (-50% to +100%)"),
    pitch: Optional[str] = Query("+0Hz", description="Pitch adjustment")
):
    """
    Generate speech from text (GET method for easy browser access).
    """
    request = TTSRequest(text=text, voice=voice, rate=rate, pitch=pitch)
    return await text_to_speech(request)


@app.delete("/cache")
async def clear_cache():
    """Clear the audio cache"""
    count = 0
    for file in CACHE_DIR.glob("*.mp3"):
        file.unlink()
        count += 1

    return {"status": "ok", "files_deleted": count}


@app.get("/voices")
async def list_voices():
    """List available Chinese voices"""
    return {
        "voices": CHINESE_VOICES,
        "default": DEFAULT_VOICE,
        "description": {
            "xiaoxiao": "Female, warm and cheerful (recommended)",
            "xiaoyi": "Female, lively",
            "yunjian": "Male, professional",
            "yunxi": "Male, cheerful",
            "yunxia": "Male, calm",
            "yunyang": "Male, professional news style",
            "liaoning": "Female, Liaoning dialect",
            "shaanxi": "Female, Shaanxi dialect",
        }
    }


@app.get("/voices/all")
async def list_all_voices():
    """List all available Edge TTS voices"""
    try:
        import edge_tts
        voices = asyncio.get_event_loop().run_until_complete(edge_tts.list_voices())
        return {"voices": voices}
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="edge-tts not installed. Run: pip install edge-tts"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list voices: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
