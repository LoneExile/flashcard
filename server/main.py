"""
Edge-TTS API Server for Flashcard App

This FastAPI server provides text-to-speech functionality using Microsoft Edge TTS.
It generates high-quality audio for Chinese and English text.

Requirements:
    pip install fastapi uvicorn edge-tts

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import hashlib
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Cache directory for generated audio
CACHE_DIR = Path(tempfile.gettempdir()) / "edge_tts_cache"
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Edge-TTS API",
    description="Text-to-Speech API for Flashcard App using Microsoft Edge TTS",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "service": "Edge-TTS API",
        "version": "1.0.0"
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
