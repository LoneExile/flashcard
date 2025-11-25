# Changelog

## v1.1.0 (2025-11-26)

### Bidirectional Study
- **Reverse cards**: Create cards in both directions (中→EN and EN→中)
- **Direction field**: Cards now have `direction` ('normal' or 'reverse') and `pairId` to link pairs
- **Generate Reverse button**: In deck view, generate reverse cards for all existing cards that don't have one
- **Direction filter**: Filter study sessions by direction (All, 中→EN only, EN→中 only)
- **Pre-session screen**: Shows card counts by direction before starting study
- **Checkbox options**: "Also create reverse card" when creating/importing cards

### Voice Settings Enhancements
- **Speed control**: Adjust voice speed from 0.5x (slow) to 2.0x (fast)
- **Pitch control**: Adjust voice pitch from 0.5 (low) to 2.0 (high)
- **Sample text testing**: Enter custom text and test voice settings
- **Test button**: Preview voice with current speed/pitch settings
- Settings persisted to localStorage (`tts-speed`, `tts-pitch`)

### Improvements
- Cards without `direction` field treated as 'normal' for backward compatibility
- Audio cache cleared when voice/speed/pitch changes
- Speed/pitch parameters sent to Edge-TTS server

---

## v1.0.0 (2025-11-25)

### Initial Release

Full-featured flashcard application with FSRS spaced repetition algorithm.

#### Core Features
- **FSRS Algorithm Integration**
  - ts-fsrs library for intelligent scheduling
  - 90% target retention rate
  - Four rating options (Again, Hard, Good, Easy)
  - Automatic interval calculation
  - Fuzz factor for natural spacing

- **Deck Management**
  - Create, edit, delete decks
  - Deck descriptions
  - Per-deck statistics
  - Subdeck data model support

- **Card Management**
  - Create, edit, delete cards
  - Front/back content with multiline support
  - Tag system for organization
  - Search across front, back, and tags
  - Card state visualization (New, Learning, Review, Relearning)
  - Due date display with relative time

- **Study Sessions**
  - Interactive flashcard review
  - Keyboard shortcuts (Space, 1-4)
  - Session statistics tracking
  - "Again" cards re-queue at random position
  - Progress bar during session
  - Session completion summary

- **Import/Export**
  - Import: Q:/A: format
  - Import: Tab-separated format
  - Import: Double-colon format
  - Import: File upload (.txt, .csv, .tsv)
  - Export: Full JSON backup
  - Data restore from backup

- **Statistics Dashboard**
  - Total cards breakdown
  - Retention rate calculation
  - Current streak tracking
  - Total study time
  - Daily progress with configurable goal
  - 7-day activity chart
  - Card distribution by state

- **Settings**
  - Theme toggle (Light/Dark/System)
  - Daily goal configuration
  - Data management (export, import, clear)

- **UI/UX**
  - shadcn/ui component library
  - Responsive design
  - Dark mode support
  - Smooth animations
  - Custom scrollbars
  - Loading states

#### Technical
- React 19 + TypeScript
- Vite 7 build system
- Tailwind CSS v4
- Dexie.js (IndexedDB)
- Offline-first architecture
- ESLint with React hooks rules

#### Sample Data
- Mandarin Chinese vocabulary flashcards
- Sourced from qa-files directory
- "Load Sample Data" quick start option

---

## Development Notes

### Files Created

```
src/
├── components/
│   ├── ui/
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── CardEditor.tsx
│   ├── DeckDialog.tsx
│   ├── DeckList.tsx
│   ├── DeckView.tsx
│   ├── ImportDialog.tsx
│   ├── Settings.tsx
│   ├── Statistics.tsx
│   └── StudyView.tsx
├── db/
│   └── index.ts
├── hooks/
│   ├── useCards.ts
│   ├── useDecks.ts
│   └── useStudySession.ts
├── lib/
│   ├── fsrs.ts
│   ├── seedData.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── App.tsx
├── index.css
└── main.tsx

Configuration:
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── package.json
└── index.html
```

### Dependencies Installed

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "ts-fsrs": "^4.6.0",
    "dexie": "^4.0.11",
    "dexie-react-hooks": "^1.1.7",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-tooltip": "^1.2.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0",
    "lucide-react": "^0.511.0",
    "date-fns": "^4.1.0",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "typescript": "~5.8.3",
    "vite": "^7.2.4",
    "@vitejs/plugin-react": "^4.4.1",
    "tailwindcss": "^4.1.8",
    "@tailwindcss/vite": "^4.1.8",
    "eslint": "^9.28.0",
    "@eslint/js": "^9.28.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "typescript-eslint": "^8.33.1",
    "globals": "^16.2.0",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "@types/uuid": "^10.0.0"
  }
}
```

### Build Issues Fixed

1. **Unused imports** - Removed `Settings` from DeckView.tsx, Tabs from Statistics.tsx
2. **Type mismatch** - Cast `Rating` to `Grade` in fsrs.ts
3. **Prefer const** - Changed `let` to `const` for non-reassigned variables
4. **Hook ordering** - Moved `endSession` before `answerCard` in useStudySession.ts
5. **setState in effect** - Converted to `useMemo` in Statistics.tsx and StudyView.tsx
6. **ESLint config** - Disabled react-refresh rule for UI components
