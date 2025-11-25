# Flashcard App - Implementation Documentation

## Overview

A production-ready flashcard application built with modern web technologies, featuring the FSRS (Free Spaced Repetition Scheduler) algorithm for optimal learning retention.

## Tech Stack

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

## Project Structure

```
flashcard-app/
├── docs/                    # Documentation
├── dist/                    # Production build output
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
│   │   └── useStudySession.ts # Study session management
│   ├── lib/
│   │   ├── fsrs.ts          # FSRS algorithm wrapper
│   │   ├── seedData.ts      # Sample Mandarin flashcards
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
- `front` (string) - Question/prompt
- `back` (string) - Answer
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
- Data export
- Data import (full restore)
- Clear all data (with confirmation)

### 7. Sample Data
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

## Future Enhancements
Potential features for future development:
- Rich media support (images, audio)
- Cloze deletion cards
- Multiple choice cards
- Cloud sync (Firebase/Supabase)
- Spaced repetition analytics
- Study reminders/notifications
- Subdeck UI implementation
- Card templates
- Markdown support in cards
- Mobile app (React Native/Capacitor)
