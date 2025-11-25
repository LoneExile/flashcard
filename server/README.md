# IndexTTS Server Setup

This server provides TTS (Text-to-Speech) functionality for the Flashcard App using IndexTTS.

## Prerequisites

- Python 3.10+
- CUDA-capable GPU (recommended)
- ~4GB disk space for model checkpoints

## Installation

### 1. Install IndexTTS

Follow the official IndexTTS installation:

```bash
# Clone IndexTTS
git clone https://github.com/index-tts/index-tts.git
cd index-tts

# Install with uv (recommended)
uv sync --all-extras

# Or with pip
pip install -e .
```

### 2. Download Model Checkpoints

```bash
# Using HuggingFace CLI
pip install "huggingface-hub[cli]"
huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints

# Or using ModelScope (faster in China)
pip install modelscope
modelscope download --model IndexTeam/IndexTTS-2 --local_dir checkpoints
```

### 3. Install Server Dependencies

```bash
cd /path/to/flashcard-app/server
pip install -r requirements.txt
```

## Running the Server

### Basic Usage

```bash
# From the IndexTTS directory (where checkpoints are)
cd /path/to/index-tts
uvicorn server.main:app --host 0.0.0.0 --port 8000

# Or run directly
python /path/to/flashcard-app/server/main.py
```

### With Custom Paths

Edit `main.py` to update the `TTSConfig`:

```python
config = TTSConfig(
    model_dir="/path/to/checkpoints",
    config_path="/path/to/checkpoints/config.yaml",
    voice_sample="/path/to/voice.wav",
    use_fp16=True,
    device="cuda:0"
)
```

### Environment Variables (Alternative)

```bash
export INDEXTTS_MODEL_DIR="/path/to/checkpoints"
export INDEXTTS_VOICE="/path/to/voice.wav"
export INDEXTTS_DEVICE="cuda:0"
```

## API Endpoints

### GET /
Health check

### GET /health
Detailed health status

### POST /tts
Generate speech from text

```bash
curl -X POST "http://localhost:8000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好世界"}' \
  --output audio.wav
```

### GET /tts?text=...
Generate speech (GET method)

```bash
curl "http://localhost:8000/tts?text=你好" --output hello.wav
```

### GET /voices
List available voice samples

### DELETE /cache
Clear audio cache

## Frontend Configuration

In the Flashcard App, update the TTS server URL:

```typescript
// src/lib/tts.ts
const TTS_SERVER_URL = 'http://localhost:8000'
```

## Troubleshooting

### CUDA Out of Memory
- Use `use_fp16=True` to reduce memory usage
- Try a smaller batch size
- Use `device="cpu"` for CPU-only inference (slower)

### Model Not Found
- Ensure checkpoints are downloaded to the correct directory
- Check `config.yaml` exists in the checkpoints folder

### CORS Errors
- The server allows all origins by default
- For production, specify your frontend URL in `allow_origins`

## Performance Tips

1. **Enable FP16**: Significantly faster on modern GPUs
2. **Use caching**: Audio is cached based on text hash
3. **GPU warming**: First inference is slower due to model loading
4. **Batch requests**: If processing many texts, consider batching
