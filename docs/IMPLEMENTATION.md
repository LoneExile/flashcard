# Flashcard App - Implementation Documentation

## Overview

A production-ready flashcard application built with modern web technologies, featuring the FSRS (Free Spaced Repetition Scheduler) algorithm for optimal learning retention.

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI component library |
| Dexie.js | 4.x | IndexedDB wrapper for offline storage |
| ts-fsrs | 4.x | FSRS spaced repetition algorithm |
| date-fns | 4.x | Date manipulation |
| uuid | 11.x | Unique ID generation |
| Lucide React | latest | Icons |

### Backend (Optional)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| FastAPI | 0.109+ | REST API framework |
| SQLAlchemy | 2.0+ | ORM for SQLite |
| edge-tts | 6.1+ | Microsoft Edge neural TTS |
| uvicorn | 0.27+ | ASGI server |

## Project Structure

```
flashcard-app/
├── docs/                    # Documentation
├── dist/                    # Production build output
├── server/                  # Python backend
│   ├── main.py              # FastAPI server (TTS + API)
│   ├── database.py          # SQLAlchemy models
│   ├── api.py               # REST API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── flashcards.db        # SQLite database (created on run)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── tooltip.tsx
│   │   ├── CardEditor.tsx   # Card create/edit dialog
│   │   ├── DeckDialog.tsx   # Deck create/edit dialog
│   │   ├── DeckList.tsx     # Main deck listing
│   │   ├── DeckView.tsx     # Single deck view with cards
│   │   ├── ImportDialog.tsx # Multi-format card import
│   │   ├── Settings.tsx     # App settings & data management
│   │   ├── Statistics.tsx   # Stats dashboard
│   │   └── StudyView.tsx    # Study session interface
│   ├── db/
│   │   └── index.ts         # Dexie database setup
│   ├── hooks/
│   │   ├── useCards.ts      # Card CRUD operations
│   │   ├── useDecks.ts      # Deck CRUD operations
│   │   ├── useStudySession.ts # Study session management
│   │   └── useTTS.ts        # Text-to-speech hook
│   ├── lib/
│   │   ├── api.ts           # Backend API client
│   │   ├── fsrs.ts          # FSRS algorithm wrapper
│   │   ├── seedData.ts      # Sample Mandarin flashcards
│   │   ├── tts.ts           # TTS service
│   │   └── utils.ts         # Utility functions
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles & theme
│   └── main.tsx             # Application entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

## Database Schema

Using Dexie.js with IndexedDB for offline-first storage:

### Tables

**decks**
- `id` (string, primary key) - UUID
- `name` (string) - Deck name
- `description` (string) - Optional description
- `parentId` (string | null) - For subdeck hierarchy
- `createdAt` (Date)
- `updatedAt` (Date)
- `settings` (DeckSettings) - Per-deck study settings

**cards**
- `id` (string, primary key) - UUID
- `deckId` (string, indexed) - Foreign key to deck
- `front` (string) - Question/prompt (e.g., Pinyin)
- `back` (string) - Answer (e.g., English translation)
- `audio` (string, optional) - Text for TTS (e.g., Chinese characters if front is Pinyin)
- `tags` (string[]) - Card tags
- `createdAt` (Date)
- `updatedAt` (Date)
- `fsrs` (FSRSCard) - FSRS algorithm state

**reviewLogs**
- `id` (string, primary key) - UUID
- `cardId` (string, indexed) - Foreign key to card
- `rating` (number) - User rating (1-4)
- `state` (number) - Card state at review time
- `due` (Date) - When card was due
- `stability` (number) - FSRS stability
- `difficulty` (number) - FSRS difficulty
- `elapsed_days` (number) - Days since last review
- `last_elapsed_days` (number) - Previous elapsed days
- `scheduled_days` (number) - Days until next review
- `review` (Date) - Review timestamp

**studySessions**
- `id` (string, primary key) - UUID
- `deckId` (string, indexed) - Foreign key to deck
- `startTime` (Date)
- `endTime` (Date | null)
- `cardsStudied` (number)
- `correctCount` (number)
- `againCount` (number)
- `hardCount` (number)
- `goodCount` (number)
- `easyCount` (number)

**settings**
- `id` (string, primary key) - 'app-settings'
- `theme` ('light' | 'dark' | 'system')
- `dailyGoal` (number)
- `showKeyboardShortcuts` (boolean)
- `autoPlayAudio` (boolean)

## FSRS Algorithm Integration

The app uses ts-fsrs library with these configurations:

```typescript
const defaultParams: Partial<FSRSParameters> = {
  request_retention: 0.9,    // Target 90% retention
  maximum_interval: 36500,   // Max 100 years between reviews
  enable_fuzz: true,         // Add randomness to intervals
  enable_short_term: true,   // Enable short-term scheduling
}
```

### Card States
- **New** - Never reviewed
- **Learning** - In initial learning phase
- **Review** - In long-term review
- **Relearning** - Failed review, relearning

### Rating Options
- **Again (1)** - Complete failure, restart learning
- **Hard (2)** - Recalled with difficulty
- **Good (3)** - Recalled correctly
- **Easy (4)** - Recalled effortlessly

## Features Implemented

### 1. Deck Management
- Create/edit/delete decks
- Deck descriptions
- Per-deck statistics (total cards, due cards, retention, streak)
- Subdeck support (data model ready, UI can be extended)

### 2. Card Management
- Create/edit/delete cards
- Front/back content (supports multiline)
- Tag system for organization
- Search across front, back, and tags
- Card state badges (New, Learning, Review, Relearning)
- Due date display

### 3. Study Sessions
- FSRS-powered scheduling
- Four rating buttons with interval previews
- Keyboard shortcuts:
  - `Space` or `Enter` - Show answer
  - `1` - Again
  - `2` - Hard
  - `3` - Good
  - `4` - Easy
- Session statistics (cards studied, correct rate, rating breakdown)
- "Again" cards re-enter queue at random position
- Progress bar during session

### 4. Import/Export
**Import Formats:**
- Q:/A: format (with optional Tags: line)
- Tab-separated (front\tback\ttags)
- Double-colon (front::back)
- File upload (.txt, .csv, .tsv)

**Export:**
- Full JSON backup (decks, cards, review logs)
- Timestamped filename

### 5. Statistics Dashboard
- Total cards breakdown (new, learning, mature)
- Retention rate
- Current streak
- Total study time
- Daily progress with configurable goal
- 7-day activity chart
- Card distribution visualization

### 6. Settings
- Theme toggle (Light/Dark/System)
- Daily goal configuration
- Voice selection (6+ Chinese neural voices)
- Backend sync (upload/download to SQLite server)
- Data export (JSON)
- Data import (full restore)
- Clear all data (with confirmation)

### 7. Text-to-Speech
- Chinese TTS using Microsoft Edge neural voices
- Voice selection in Settings (xiaoxiao, yunxi, etc.)
- Keyboard shortcuts: `S` for question, `A` for answer
- Automatic language detection (Chinese/English)
- Server-side audio caching
- Fallback to browser Web Speech API

### 8. Backend Sync
- SQLite server for persistent storage
- Upload local data to server
- Download server data to local
- Server status indicator in Settings
- API for decks, cards, review logs, study sessions

### 9. Sample Data
- Mandarin Chinese flashcards from qa-files
- "Load Sample Data" button for quick onboarding

## Styling

### Theme System
Using Tailwind CSS v4 with CSS custom properties:

```css
@theme {
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(14.08% 0.004 285.82);
  --color-primary: oklch(20.47% 0.006 285.88);
  /* ... more colors */
}

.dark {
  --color-background: oklch(14.08% 0.004 285.82);
  --color-foreground: oklch(98.49% 0.001 106.42);
  /* ... dark mode overrides */
}
```

### Animations
- Fade in/out
- Zoom in/out
- Slide from top/bottom/left/right
- Custom scrollbar styling

## Build & Development

### Commands
```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Build Output
- `dist/index.html` - 0.64 KB
- `dist/assets/index-*.css` - 34 KB (6.7 KB gzipped)
- `dist/assets/index-*.js` - 576 KB (180 KB gzipped)

## Browser Support
- Modern browsers with IndexedDB support
- ES2020+ features (uses `esnext` build target)
- Offline-capable (all data stored locally)

## Text-to-Speech (TTS)

The app integrates with Microsoft Edge TTS for high-quality Chinese neural voices:

- **Edge-TTS Server**: Python FastAPI backend using `edge-tts` library
- **Multiple Voices**: 6+ Chinese voices (male/female, different styles)
- **Voice Selection**: Configurable in Settings > Voice Settings
- **Audio Playback**: Speaker buttons in study view and card list
- **Keyboard Shortcuts**: `S` to speak question (Chinese), `A` to speak answer (English)
- **Language Support**: Chinese uses Edge-TTS, English uses Web Speech API
- **Fallback**: Browser Web Speech API when server unavailable
- **Caching**: Server-side audio caching for faster playback

See `docs/TTS.md` for setup and configuration.

## SQLite Backend

The app includes an optional SQLite backend for persistent server-side storage:

### Backend Stack

| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| SQLAlchemy | ORM for SQLite |
| edge-tts | Microsoft Edge neural TTS |

### Database Schema (SQLite)

**decks**
- `id` (TEXT, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `parent_id` (TEXT, FOREIGN KEY)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)
- `settings` (JSON)

**cards**
- `id` (TEXT, PRIMARY KEY)
- `deck_id` (TEXT, FOREIGN KEY)
- `type` (TEXT) - basic, cloze, reversible
- `front` (TEXT)
- `back` (TEXT)
- `audio` (TEXT) - Chinese characters for TTS
- `tags` (JSON)
- `media_urls` (JSON)
- `fsrs_*` (FSRS algorithm fields)
- `created_at`, `updated_at` (DATETIME)

**review_logs**
- `id` (TEXT, PRIMARY KEY)
- `card_id` (TEXT, FOREIGN KEY)
- `rating`, `state`, `stability`, `difficulty` (FSRS data)
- `review` (DATETIME)

**study_sessions**
- `id` (TEXT, PRIMARY KEY)
- `deck_id` (TEXT, FOREIGN KEY)
- `start_time`, `end_time` (DATETIME)
- `cards_studied`, rating counts

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/decks` | GET, POST | List/create decks |
| `/api/decks/{id}` | GET, PUT, DELETE | CRUD deck |
| `/api/cards` | GET, POST | List/create cards |
| `/api/cards/{id}` | GET, PUT, DELETE | CRUD card |
| `/api/sync` | GET | Download all data |
| `/api/sync` | POST | Upload all data (replaces existing) |
| `/api/stats/deck/{id}` | GET | Deck statistics |

### Sync Flow

```
┌─────────────────┐                    ┌──────────────────┐
│  Browser        │                    │  Server          │
│  (IndexedDB)    │                    │  (SQLite)        │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │  Upload to Server (POST /api/sync)   │
         │─────────────────────────────────────►│
         │                                      │
         │  Download from Server (GET /api/sync)│
         │◄─────────────────────────────────────│
         │                                      │
```

### Running the Backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The database file `flashcards.db` is created automatically in the `server/` directory.

## Future Enhancements
Potential features for future development:
- Rich media support (images)
- Cloze deletion cards
- Multiple choice cards
- Cloud sync (Firebase/Supabase)
- Spaced repetition analytics
- Study reminders/notifications
- Subdeck UI implementation
- Card templates
- Markdown support in cards
- Mobile app (React Native/Capacitor)
