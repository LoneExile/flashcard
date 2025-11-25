# Text-to-Speech (TTS) Integration

The Flashcard App supports high-quality audio playback for Chinese cards using Microsoft Edge TTS neural voices.

## Architecture

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐
│  React Frontend │ ◄────────────────► │  Edge-TTS Server │
│   (Browser)     │   /tts?text=...    │    (FastAPI)     │
└─────────────────┘                    └──────────────────┘
        │                                      │
        │ Fallback                             │
        ▼                                      ▼
┌─────────────────┐                    ┌──────────────────┐
│ Web Speech API  │                    │  Microsoft Edge  │
│   (Browser)     │                    │  Neural Voices   │
└─────────────────┘                    └──────────────────┘
```

## Features

- **Edge-TTS Integration**: High-quality Microsoft Edge neural voices for Chinese
- **Multiple Voice Options**: 6+ Chinese voices with different styles
- **Automatic Fallback**: Uses browser Web Speech API if server unavailable
- **Audio Caching**: Server caches generated audio for faster playback
- **Audio Field Support**: Cards can have an optional `audio` field with Chinese characters for correct pronunciation when `front` contains Pinyin
- **Language Detection**: Chinese uses Edge-TTS, English uses Web Speech API
- **Keyboard Shortcuts**:
  - `S` - Speak question (uses `audio` field if available, otherwise `front`)
  - `A` - Speak answer (back, uses English voice)

## Available Voices

| Key | Voice ID | Gender | Style |
|-----|----------|--------|-------|
| xiaoxiao | zh-CN-XiaoxiaoNeural | Female | Warm and cheerful (default) |
| xiaoyi | zh-CN-XiaoyiNeural | Female | Lively |
| yunjian | zh-CN-YunjianNeural | Male | Professional |
| yunxi | zh-CN-YunxiNeural | Male | Cheerful |
| yunxia | zh-CN-YunxiaNeural | Male | Calm |
| yunyang | zh-CN-YunyangNeural | Male | News style |
| liaoning | zh-CN-liaoning-XiaobeiNeural | Female | Liaoning dialect |
| shaanxi | zh-CN-shaanxi-XiaoniNeural | Female | Shaanxi dialect |

## Setup

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
# Or individually:
pip install fastapi uvicorn edge-tts sqlalchemy
```

### 2. Start Server

```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will:
- Start on `http://localhost:8000`
- Initialize SQLite database (`flashcards.db`)
- Cache generated audio in temp directory

### 3. Frontend Configuration

By default, the frontend connects to `http://localhost:8000`.

To change the server URL, set the environment variable:

```bash
# .env.local
VITE_API_URL=http://your-server:8000
```

## Usage

### Voice Selection

1. Go to **Settings** > **Voice Settings**
2. Select a Chinese voice from the dropdown
3. The selected voice is saved to localStorage

### In Study Mode

1. Click the speaker icon next to the question to hear pronunciation
2. Press `S` key to speak the question (Chinese)
3. When answer is shown, press `A` to speak the answer (English)
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
  speak,           // (text: string, options?: { lang?: string }) => Promise<void>
  stop,            // () => void
  isPlaying,       // boolean
  isLoading,       // boolean
  serverAvailable, // boolean | null
  preload,         // (texts: string[]) => Promise<void>
  refreshServerStatus, // () => Promise<boolean>
} = useTTS()

// Example usage
speak('你好世界')                    // Chinese (uses Edge-TTS)
speak('Hello world', { lang: 'en-US' })  // English (uses Web Speech API)
```

### TTS Service Functions

```typescript
import { speak, stopSpeaking, checkServerStatus, setVoice, getVoice, CHINESE_VOICES } from '@/lib/tts'

// Speak text (auto-selects best available method)
await speak('你好世界')

// Force specific method
await speak('Hello', { forceWebSpeech: true })
await speak('你好', { forceServer: true })

// Change voice
setVoice('yunxi')  // Changes to male cheerful voice

// Get current voice
const currentVoice = getVoice()  // Returns 'xiaoxiao' by default

// Stop all audio
stopSpeaking()

// Check server status
const isAvailable = await checkServerStatus()
```

### Server API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Detailed health status |
| `/tts` | GET/POST | Generate speech audio |
| `/voices` | GET | List Chinese voices |
| `/voices/all` | GET | List all Edge-TTS voices |
| `/cache` | DELETE | Clear audio cache |

#### TTS Endpoint Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| text | string | required | Text to synthesize |
| voice | string | xiaoxiao | Voice key or full voice ID |
| rate | string | +0% | Speech rate (-50% to +100%) |
| pitch | string | +0Hz | Pitch adjustment |

Example requests:

```bash
# GET request
curl "http://localhost:8000/tts?text=你好&voice=yunxi" --output hello.mp3

# POST request with JSON
curl -X POST "http://localhost:8000/tts" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好世界", "voice": "xiaoxiao", "rate": "+10%"}' \
  --output output.mp3

# List available voices
curl http://localhost:8000/voices
```

## Troubleshooting

### Server Not Responding

1. Check if server is running: `curl http://localhost:8000/health`
2. Verify CORS is enabled (check browser console)
3. Check firewall/network settings
4. Ensure `edge-tts` is installed: `pip show edge-tts`

### No Audio Playing

1. Check browser console for errors
2. Verify server status in Settings (green = online)
3. Try refreshing server status with the refresh button
4. Check if audio is muted in browser

### Poor Audio Quality (Fallback Mode)

- Browser Web Speech API has limited Chinese voices
- Ensure Edge-TTS server is running for best quality
- Check server logs for TTS generation errors

### Voice Not Changing

1. Clear browser cache
2. Check localStorage for `tts-voice` key
3. Refresh the page after changing voice

## Performance

| Method | Quality | Latency | Requirements |
|--------|---------|---------|--------------|
| Edge-TTS Server | Excellent | ~500ms-2s | Python, Internet |
| Web Speech API | Basic | Instant | Browser only |

Edge-TTS requires internet connection to Microsoft's servers but provides high-quality neural voices without GPU requirements.

## Files

```
server/
├── main.py           # FastAPI server with TTS endpoints
├── database.py       # SQLAlchemy models
├── api.py            # REST API endpoints
└── requirements.txt  # Python dependencies

src/
├── lib/
│   └── tts.ts        # TTS service with voice selection
└── hooks/
    └── useTTS.ts     # React hook for TTS
```
