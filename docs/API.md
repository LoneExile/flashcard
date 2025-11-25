# Flashcard App - API Reference

## Custom Hooks

### useDecks()

Manages deck CRUD operations.

```typescript
import { useDecks } from '@/hooks/useDecks'

const {
  decks,           // Deck[] - All decks (live query)
  createDeck,      // (name, description?, parentId?) => Promise<Deck>
  updateDeck,      // (id, updates) => Promise<void>
  deleteDeck,      // (id) => Promise<void>
  getDeckStats,    // (deckId) => Promise<DeckStats>
  getDeckWithSubdecks, // (parentId) => Deck[]
} = useDecks()
```

**Example:**
```typescript
// Create a new deck
const deck = await createDeck('Spanish', 'Basic vocabulary')

// Get deck statistics
const stats = await getDeckStats(deck.id)
console.log(stats.dueCards, stats.retention)

// Update deck
await updateDeck(deck.id, { name: 'Spanish Advanced' })

// Delete deck (also deletes cards and review logs)
await deleteDeck(deck.id)
```

---

### useCards(deckId: string)

Manages cards within a specific deck.

```typescript
import { useCards } from '@/hooks/useCards'

const {
  cards,         // Card[] - All cards in deck (live query)
  dueCards,      // Card[] - Cards due for review
  createCard,    // (front, back, tags?) => Promise<Card>
  updateCard,    // (id, updates) => Promise<void>
  deleteCard,    // (id) => Promise<void>
  reviewCard,    // (card, rating) => Promise<{ updatedCard, log }>
  searchCards,   // (query) => Card[]
  importCards,   // (deckId, cards[]) => Promise<number>
} = useCards(deckId)
```

**Example:**
```typescript
// Create a card
const card = await createCard(
  'Hola',
  'Hello',
  ['greetings', 'basics']
)

// Review a card
import { Rating } from '@/hooks/useCards'
const { updatedCard, log } = await reviewCard(card, Rating.Good)

// Search cards
const results = searchCards('hello')

// Bulk import
const count = await importCards(deckId, [
  { front: 'Gracias', back: 'Thank you' },
  { front: 'Por favor', back: 'Please' },
])
```

---

### useStudySession(deckId: string)

Manages study session state and flow.

```typescript
import { useStudySession, Rating } from '@/hooks/useStudySession'

const {
  // State
  isStudying,      // boolean
  currentCard,     // Card | null
  currentIndex,    // number
  totalCards,      // number
  showingAnswer,   // boolean
  sessionStats,    // { studied, again, hard, good, easy }
  session,         // StudySession | null
  dueCount,        // number

  // Actions
  startSession,    // (cards?) => Promise<boolean>
  showAnswer,      // () => void
  answerCard,      // (rating: Rating) => Promise<void>
  endSession,      // () => Promise<void>
  getSchedulingInfo, // () => SchedulingOptions | null
} = useStudySession(deckId)
```

**Example:**
```typescript
// Start studying
const started = await startSession()
if (!started) {
  console.log('No cards due!')
}

// Show answer
showAnswer()

// Get scheduling options (intervals for each rating)
const info = getSchedulingInfo()
console.log(info.good.interval) // e.g., "1d"

// Answer card
await answerCard(Rating.Good)

// End session early
await endSession()
```

---

## FSRS Library Functions

### createNewFSRSCard()

Creates a new FSRS card state object.

```typescript
import { createNewFSRSCard } from '@/lib/fsrs'

const fsrsState = createNewFSRSCard()
// Returns: { due, stability, difficulty, elapsed_days, ... }
```

### scheduleCard(card, rating, now?)

Schedules the next review for a card.

```typescript
import { scheduleCard, Rating } from '@/lib/fsrs'

const result = scheduleCard(card.fsrs, Rating.Good)
// result.card - Updated card state
// result.log - Review log entry
```

### getSchedulingOptions(card, now?)

Gets preview of all rating options.

```typescript
import { getSchedulingOptions } from '@/lib/fsrs'

const options = getSchedulingOptions(card.fsrs)
// options.again.interval - "1m"
// options.hard.interval  - "6m"
// options.good.interval  - "1d"
// options.easy.interval  - "4d"
```

### isDue(card, now?)

Checks if a card is due for review.

```typescript
import { isDue } from '@/lib/fsrs'

if (isDue(card.fsrs)) {
  console.log('Card needs review!')
}
```

### getCardState(card)

Returns human-readable state string.

```typescript
import { getCardState } from '@/lib/fsrs'

const state = getCardState(card.fsrs)
// "New" | "Learning" | "Review" | "Relearning"
```

### getRetention(card)

Calculates estimated retention probability.

```typescript
import { getRetention } from '@/lib/fsrs'

const retention = getRetention(card.fsrs)
// 0.0 to 1.0
```

---

## Types

### Deck

```typescript
interface Deck {
  id: string
  name: string
  description: string
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  settings: DeckSettings
}

interface DeckSettings {
  newCardsPerDay: number
  reviewsPerDay: number
  showAnswerTimer: boolean
  autoAdvance: boolean
}
```

### Card

```typescript
interface Card {
  id: string
  deckId: string
  front: string
  back: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  fsrs: FSRSCard
}
```

### DeckStats

```typescript
interface DeckStats {
  totalCards: number
  newCards: number
  learningCards: number
  reviewCards: number
  dueCards: number
  averageRetention: number
  streak: number
}
```

### StudySession

```typescript
interface StudySession {
  id: string
  deckId: string
  startTime: Date
  endTime: Date | null
  cardsStudied: number
  correctCount: number
  againCount: number
  hardCount: number
  goodCount: number
  easyCount: number
}
```

### Rating

```typescript
enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}
```

---

## Database Access

Direct database access via Dexie:

```typescript
import { db, clearAllData } from '@/db'

// Query cards
const cards = await db.cards.where('deckId').equals(deckId).toArray()

// Count due cards
const dueCount = await db.cards
  .where('deckId')
  .equals(deckId)
  .filter(c => c.fsrs.due <= new Date())
  .count()

// Transaction
await db.transaction('rw', [db.cards, db.reviewLogs], async () => {
  await db.cards.add(card)
  await db.reviewLogs.add(log)
})

// Clear all data
await clearAllData()
```

---

## Utility Functions

### formatRelativeTime(date)

Formats date as relative time string.

```typescript
import { formatRelativeTime } from '@/lib/utils'

formatRelativeTime(new Date()) // "just now"
formatRelativeTime(yesterday)  // "1 day ago"
```

### cn(...classes)

Merges Tailwind classes with clsx and tailwind-merge.

```typescript
import { cn } from '@/lib/utils'

cn('px-4 py-2', isActive && 'bg-primary', className)
```
