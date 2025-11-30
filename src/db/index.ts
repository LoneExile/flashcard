import Dexie, { type EntityTable } from 'dexie'
import type { Card, Deck, ReviewLog, StudySession, AppSettings } from '@/types'

class FlashcardDB extends Dexie {
  decks!: EntityTable<Deck, 'id'>
  cards!: EntityTable<Card, 'id'>
  reviewLogs!: EntityTable<ReviewLog, 'id'>
  studySessions!: EntityTable<StudySession, 'id'>
  settings!: EntityTable<AppSettings & { id: string }, 'id'>

  constructor() {
    super('FlashcardDB')

    this.version(1).stores({
      decks: 'id, name, parentId, createdAt, updatedAt',
      cards: 'id, deckId, type, *tags, createdAt, updatedAt, [deckId+fsrs.due]',
      reviewLogs: 'id, cardId, review, rating',
      studySessions: 'id, deckId, startTime, endTime',
      settings: 'id',
    })
  }
}

export const db = new FlashcardDB()

export async function initializeDB() {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'app-settings',
      theme: 'system',
      dailyGoal: 20,
      soundEnabled: true,
      hapticEnabled: true,
      autoSync: true,
    })
  }
}

export async function clearAllData() {
  await db.transaction('rw', [db.decks, db.cards, db.reviewLogs, db.studySessions], async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.reviewLogs.clear()
    await db.studySessions.clear()
  })
}

export { Dexie }
