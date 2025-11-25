import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import type { Deck, DeckSettings, DeckStats } from '@/types'
import { State } from '@/lib/fsrs'

const defaultSettings: DeckSettings = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  showAnswerTimer: true,
  autoAdvance: false,
}

export function useDecks() {
  const decks = useLiveQuery(() => db.decks.toArray())

  const createDeck = async (
    name: string,
    description: string = '',
    parentId: string | null = null
  ): Promise<Deck> => {
    const now = new Date()
    const deck: Deck = {
      id: uuidv4(),
      name,
      description,
      parentId,
      createdAt: now,
      updatedAt: now,
      settings: { ...defaultSettings },
    }
    await db.decks.add(deck)
    return deck
  }

  const updateDeck = async (
    id: string,
    updates: Partial<Omit<Deck, 'id' | 'createdAt'>>
  ) => {
    await db.decks.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
  }

  const deleteDeck = async (id: string) => {
    await db.transaction('rw', [db.decks, db.cards, db.reviewLogs], async () => {
      const cardIds = await db.cards.where('deckId').equals(id).primaryKeys()
      await db.reviewLogs.where('cardId').anyOf(cardIds).delete()
      await db.cards.where('deckId').equals(id).delete()
      await db.decks.delete(id)
      // Delete subdecks recursively
      const subdecks = await db.decks.where('parentId').equals(id).toArray()
      for (const subdeck of subdecks) {
        await deleteDeck(subdeck.id)
      }
    })
  }

  const getDeckStats = async (deckId: string): Promise<DeckStats> => {
    const cards = await db.cards.where('deckId').equals(deckId).toArray()
    const now = new Date()

    const totalCards = cards.length
    const newCards = cards.filter((c) => c.fsrs.state === State.New).length
    const learningCards = cards.filter(
      (c) => c.fsrs.state === State.Learning || c.fsrs.state === State.Relearning
    ).length
    const reviewCards = cards.filter((c) => c.fsrs.state === State.Review).length
    const dueCards = cards.filter((c) => c.fsrs.due <= now).length

    // Calculate average retention from review logs
    const reviewLogs = await db.reviewLogs
      .where('cardId')
      .anyOf(cards.map((c) => c.id))
      .toArray()

    const averageRetention =
      reviewLogs.length > 0
        ? reviewLogs.filter((l) => l.rating >= 3).length / reviewLogs.length
        : 0

    // Calculate streak (days in a row with reviews)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    const sessions = await db.studySessions
      .where('deckId')
      .equals(deckId)
      .toArray()

    if (sessions.length > 0) {
      const sortedSessions = sessions.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      )
      const checkDate = new Date(today)

      for (const session of sortedSessions) {
        const sessionDate = new Date(session.startTime)
        sessionDate.setHours(0, 0, 0, 0)

        if (sessionDate.getTime() === checkDate.getTime()) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else if (sessionDate.getTime() < checkDate.getTime()) {
          break
        }
      }
    }

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      dueCards,
      averageRetention,
      streak,
    }
  }

  const getDeckWithSubdecks = (deckId: string | null): Deck[] => {
    if (!decks) return []
    return decks.filter((d) => d.parentId === deckId)
  }

  return {
    decks: decks || [],
    createDeck,
    updateDeck,
    deleteDeck,
    getDeckStats,
    getDeckWithSubdecks,
  }
}
