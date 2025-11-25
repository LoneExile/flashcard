# Flashcard App - Quick Start Guide

## Installation

```bash
# Clone and install
cd flashcard-app
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Getting Started

### 1. Create Your First Deck

1. Click **"Create Deck"** button
2. Enter a name (e.g., "Spanish Vocabulary")
3. Add optional description
4. Click **"Create"**

### 2. Add Cards

1. Click on your deck to open it
2. Click **"Add Card"** button
3. Enter the front (question) and back (answer)
4. Optionally add tags (comma-separated)
5. Click **"Save"**

### 3. Import Cards

You can bulk import cards in several formats:

**Q:/A: Format:**
```
Q: What is the capital of France?
A: Paris
Tags: geography, europe

Q: What is 2 + 2?
A: 4
Tags: math
```

**Tab-Separated:**
```
Capital of France	Paris	geography,europe
2 + 2	4	math
```

**Double-Colon:**
```
Capital of France::Paris
2 + 2::4
```

### 4. Study Cards

1. Click **"Study"** button (shows number of due cards)
2. Read the question
3. Press **Space** or click **"Show Answer"**
4. Rate your recall:
   - **Again (1)** - Forgot completely
   - **Hard (2)** - Remembered with difficulty
   - **Good (3)** - Remembered correctly
   - **Easy (4)** - Too easy

### 5. Load Sample Data

Want to try it out quickly?
1. Go to **Settings** (gear icon)
2. Scroll to bottom
3. Click **"Load Sample Data"**

This adds Mandarin Chinese vocabulary flashcards.

## Keyboard Shortcuts

During study sessions:
| Key | Action |
|-----|--------|
| Space / Enter | Show answer |
| 1 | Rate "Again" |
| 2 | Rate "Hard" |
| 3 | Rate "Good" |
| 4 | Rate "Easy" |

## Understanding FSRS

The app uses the **FSRS algorithm** (Free Spaced Repetition Scheduler) which:

- Schedules reviews at optimal intervals for memory retention
- Adapts to your performance on each card
- Shows harder cards more frequently
- Spaces out easy cards over longer intervals

### Card States

| State | Meaning |
|-------|---------|
| New | Never studied |
| Learning | Currently being learned |
| Review | In long-term memory |
| Relearning | Failed, needs relearning |

## Data Management

### Export Data
Settings > Export Data

Creates a JSON file with all your decks, cards, and review history.

### Import Data
Settings > Import Data

Restores from a previously exported JSON file. **Warning:** This replaces all existing data.

### Clear Data
Settings > Clear All Data

Permanently deletes everything. Use with caution!

## Theme

Switch between Light, Dark, or System theme in Settings.

## Tips for Effective Learning

1. **Study daily** - Consistency beats cramming
2. **Be honest** with ratings - Don't inflate "Good" ratings
3. **Use "Again"** when needed - It's okay to forget
4. **Add context** - Include example sentences or mnemonics
5. **Use tags** - Organize cards for targeted study
6. **Review statistics** - Track your progress
