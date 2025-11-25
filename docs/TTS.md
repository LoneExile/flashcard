# Text-to-Speech (TTS) Integration

The Flashcard App supports audio playback for cards using IndexTTS, a high-quality Chinese text-to-speech system.

## Architecture

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐
│  React Frontend │ ◄────────────────► │  IndexTTS Server │
│   (Browser)     │   /tts?text=...    │    (Python)      │
└─────────────────┘                    └──────────────────┘
        │                                      │
        │ Fallback                             │
        ▼                                      ▼
┌─────────────────┐                    ┌──────────────────┐
│ Web Speech API  │                    │  GPU (CUDA)      │
│   (Browser)     │                    │  + Model Files   │
└─────────────────┘                    └──────────────────┘
```

## Features

- **IndexTTS Integration**: High-quality Chinese/Pinyin TTS
- **Automatic Fallback**: Uses browser Web Speech API if server unavailable
- **Audio Caching**: Server caches generated audio for faster playback
- **Audio Field Support**: Cards can have an optional `audio` field with Chinese characters for correct pronunciation when `front` contains Pinyin
- **Keyboard Shortcuts**:
  - `S` - Speak question (uses `audio` field if available, otherwise `front`)
  - `A` - Speak answer (back)

## Setup

### 1. IndexTTS Server Setup

See `server/README.md` for detailed instructions.

Quick start:
```bash
# Install IndexTTS (from their repo)
git clone https://github.com/index-tts/index-tts.git
cd index-tts
uv sync --all-extras

# Download models
huggingface-cli download IndexTeam/IndexTTS-2 --local-dir=checkpoints

# Start server
uvicorn flashcard-app/server/main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Configuration

By default, the frontend connects to `http://localhost:8000`.

To change the server URL, set the environment variable:

```bash
# .env.local
VITE_TTS_SERVER_URL=http://your-server:8000
```

Or edit `src/lib/tts.ts`:

```typescript
const TTS_SERVER_URL = 'http://your-server:8000'
```

## Usage

### In Study Mode

1. Click the speaker icon next to the question to hear pronunciation
2. Press `S` key to speak the question
3. When answer is shown, press `A` to speak the answer
4. Click speaker icon next to answer text

### In Card List

- Click the small speaker icon next to any card's front text

### Status Indicator

- If TTS server is offline, a message appears: "TTS server offline - using browser speech"
- Browser speech works but has lower quality for Chinese

## API Reference

### Frontend Hook: useTTS()

```typescript
import { useTTS } from '@/hooks/useTTS'

const {
  speak,           // (text: string) => Promise<void>
  stop,            // () => void
  isPlaying,       // boolean
  isLoading,       // boolean
  serverAvailable, // boolean | null
  preload,         // (texts: string[]) => Promise<void>
  refreshServerStatus, // () => Promise<boolean>
} = useTTS()
```

### TTS Service Functions

```typescript
import { speak, stopSpeaking, checkServerStatus } from '@/lib/tts'

// Speak text (auto-selects best available method)
await speak('你好世界')

// Force specific method
await speak('Hello', { forceWebSpeech: true })
await speak('你好', { forceServer: true })

// Stop all audio
stopSpeaking()

// Check server status
const isAvailable = await checkServerStatus()
```

### Server API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed status |
| `/tts` | GET/POST | Generate speech |
| `/tts?text=...` | GET | Generate speech (URL param) |
| `/voices` | GET | List available voices |
| `/cache` | DELETE | Clear audio cache |

Example:
```bash
# Generate audio
curl "http://localhost:8000/tts?text=你好" --output hello.wav

# POST with JSON
curl -X POST "http://localhost:8000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好世界"}' \
  --output output.wav
```

## Pinyin Support

IndexTTS supports mixed Chinese characters and Pinyin for precise pronunciation:

```
之前你做DE5很好，所以这一次也DEI3做DE2很好才XING2
```

The numbers after Pinyin indicate tones (1-5).

## Troubleshooting

### Server Not Responding

1. Check if server is running: `curl http://localhost:8000/health`
2. Verify CORS is enabled (check browser console)
3. Check firewall/network settings

### Poor Audio Quality

- Browser Web Speech API has limited Chinese voices
- Ensure IndexTTS server is running for best quality
- Try different voice samples in IndexTTS

### GPU Out of Memory

- Enable FP16 mode in server config
- Use smaller batch sizes
- Consider CPU inference (slower but works)

### Audio Delays

- First request loads the model (can take 5-10s)
- Subsequent requests are cached
- Use `preload()` to pre-cache common phrases

## Performance

| Method | Quality | Latency | Requirements |
|--------|---------|---------|--------------|
| IndexTTS (GPU) | Excellent | ~1-2s | CUDA GPU, ~4GB VRAM |
| IndexTTS (CPU) | Excellent | ~10-30s | 16GB+ RAM |
| Web Speech API | Basic | Instant | Browser only |

## Files

```
server/
├── main.py           # FastAPI server
├── requirements.txt  # Python dependencies
└── README.md         # Server setup guide

src/
├── lib/
│   └── tts.ts        # TTS service
└── hooks/
    └── useTTS.ts     # React hook
```
