"""
IndexTTS API Server for Flashcard App

This FastAPI server provides text-to-speech functionality using IndexTTS.
It generates audio for Chinese text and Pinyin.

Requirements:
    pip install fastapi uvicorn python-multipart
    # Plus IndexTTS dependencies (see IndexTTS repo)

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import io
import hashlib
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Cache directory for generated audio
CACHE_DIR = Path(tempfile.gettempdir()) / "indextts_cache"
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="IndexTTS API",
    description="Text-to-Speech API for Flashcard App using IndexTTS",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global TTS model instance (lazy loaded)
tts_model = None
voice_sample = None


class TTSRequest(BaseModel):
    """Request body for TTS generation"""
    text: str
    voice: Optional[str] = None  # Optional voice sample path


class TTSConfig(BaseModel):
    """TTS configuration"""
    model_dir: str = "checkpoints"
    config_path: str = "checkpoints/config.yaml"
    voice_sample: str = "examples/voice_07.wav"  # Default Chinese voice
    use_fp16: bool = True
    device: str = "cuda:0"


# Configuration - adjust paths as needed
config = TTSConfig()


def get_tts_model():
    """Lazy load the IndexTTS model"""
    global tts_model, voice_sample

    if tts_model is None:
        try:
            from indextts.infer_v2 import IndexTTS2

            print(f"Loading IndexTTS2 model from {config.model_dir}...")
            tts_model = IndexTTS2(
                cfg_path=config.config_path,
                model_dir=config.model_dir,
                use_fp16=config.use_fp16,
                device=config.device
            )
            voice_sample = config.voice_sample
            print("IndexTTS2 model loaded successfully!")
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="IndexTTS not installed. Please install it first."
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load IndexTTS model: {str(e)}"
            )

    return tts_model


def get_cache_path(text: str, voice: str) -> Path:
    """Generate cache file path based on text and voice hash"""
    hash_input = f"{text}:{voice}".encode('utf-8')
    hash_key = hashlib.md5(hash_input).hexdigest()
    return CACHE_DIR / f"{hash_key}.wav"


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "IndexTTS API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    model_loaded = tts_model is not None
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "cache_dir": str(CACHE_DIR),
        "config": {
            "model_dir": config.model_dir,
            "use_fp16": config.use_fp16,
            "device": config.device
        }
    }


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Generate speech from text.

    Args:
        request: TTSRequest with text and optional voice sample

    Returns:
        Audio file (WAV format)
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice = request.voice or voice_sample or config.voice_sample

    # Check cache first
    cache_path = get_cache_path(request.text, voice)
    if cache_path.exists():
        return FileResponse(
            cache_path,
            media_type="audio/wav",
            headers={"X-Cache": "HIT"}
        )

    # Generate audio
    model = get_tts_model()

    try:
        # Generate to cache file
        model.infer(voice, request.text, str(cache_path))

        return FileResponse(
            cache_path,
            media_type="audio/wav",
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
    voice: Optional[str] = Query(None, description="Voice sample path")
):
    """
    Generate speech from text (GET method for easy browser access).

    Args:
        text: Text to convert to speech
        voice: Optional voice sample path

    Returns:
        Audio file (WAV format)
    """
    request = TTSRequest(text=text, voice=voice)
    return await text_to_speech(request)


@app.post("/tts/stream")
async def text_to_speech_stream(request: TTSRequest):
    """
    Generate speech with streaming response (for longer texts).

    Note: This is a placeholder - IndexTTS streaming requires additional setup.
    """
    # For now, redirect to regular TTS
    return await text_to_speech(request)


@app.delete("/cache")
async def clear_cache():
    """Clear the audio cache"""
    count = 0
    for file in CACHE_DIR.glob("*.wav"):
        file.unlink()
        count += 1

    return {"status": "ok", "files_deleted": count}


@app.get("/voices")
async def list_voices():
    """List available voice samples"""
    voices_dir = Path(config.model_dir).parent / "examples"

    if not voices_dir.exists():
        return {"voices": [], "default": config.voice_sample}

    voices = [
        str(f.relative_to(voices_dir.parent))
        for f in voices_dir.glob("*.wav")
    ]

    return {
        "voices": voices,
        "default": config.voice_sample
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
