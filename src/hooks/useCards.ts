import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import type { Card, CardType, ReviewLog } from '@/types'
import {
  createNewFSRSCard,
  scheduleCard,
  Rating,
  isDue,
  type FSRSCard,
} from '@/lib/fsrs'

export function useCards(deckId?: string) {
  const cards = useLiveQuery(
    () =>
      deckId
        ? db.cards.where('deckId').equals(deckId).toArray()
        : db.cards.toArray(),
    [deckId]
  )

  const dueCards = useLiveQuery(
    () =>
      deckId
        ? db.cards
            .where('deckId')
            .equals(deckId)
            .filter((card) => isDue(card.fsrs))
            .toArray()
        : db.cards.filter((card) => isDue(card.fsrs)).toArray(),
    [deckId]
  )

  const createCard = async (
    targetDeckId: string,
    front: string,
    back: string,
    type: CardType = 'basic',
    tags: string[] = []
  ): Promise<Card> => {
    const now = new Date()
    const card: Card = {
      id: uuidv4(),
      deckId: targetDeckId,
      type,
      front,
      back,
      tags,
      createdAt: now,
      updatedAt: now,
      fsrs: createNewFSRSCard(),
      mediaUrls: [],
    }
    await db.cards.add(card)
    return card
  }

  const updateCard = async (
    id: string,
    updates: Partial<Omit<Card, 'id' | 'createdAt' | 'fsrs'>>
  ) => {
    await db.cards.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
  }

  const deleteCard = async (id: string) => {
    await db.transaction('rw', [db.cards, db.reviewLogs], async () => {
      await db.reviewLogs.where('cardId').equals(id).delete()
      await db.cards.delete(id)
    })
  }

  const reviewCard = async (
    card: Card,
    rating: Rating
  ): Promise<{ updatedCard: Card; log: ReviewLog }> => {
    const now = new Date()
    const result = scheduleCard(card.fsrs, rating, now)

    const updatedFsrs: FSRSCard = result.card
    const log = result.log

    const reviewLog: ReviewLog = {
      id: uuidv4(),
      cardId: card.id,
      rating: log.rating,
      state: log.state,
      due: updatedFsrs.due,
      stability: updatedFsrs.stability,
      difficulty: updatedFsrs.difficulty,
      elapsedDays: log.elapsed_days,
      scheduledDays: updatedFsrs.scheduled_days,
      review: now,
    }

    await db.transaction('rw', [db.cards, db.reviewLogs], async () => {
      await db.cards.update(card.id, {
        fsrs: updatedFsrs,
        updatedAt: now,
      })
      await db.reviewLogs.add(reviewLog)
    })

    return {
      updatedCard: { ...card, fsrs: updatedFsrs, updatedAt: now },
      log: reviewLog,
    }
  }

  const getCardsByTag = async (tag: string): Promise<Card[]> => {
    return db.cards.where('tags').equals(tag).toArray()
  }

  const searchCards = async (query: string): Promise<Card[]> => {
    const lowerQuery = query.toLowerCase()
    return db.cards
      .filter(
        (card) =>
          card.front.toLowerCase().includes(lowerQuery) ||
          card.back.toLowerCase().includes(lowerQuery)
      )
      .toArray()
  }

  const importCards = async (
    targetDeckId: string,
    cardsData: Array<{ front: string; back: string; audio?: string; tags?: string[]; type?: CardType }>
  ): Promise<number> => {
    const now = new Date()
    const newCards: Card[] = cardsData.map((data) => ({
      id: uuidv4(),
      deckId: targetDeckId,
      type: data.type || 'basic',
      front: data.front,
      back: data.back,
      audio: data.audio,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      fsrs: createNewFSRSCard(),
      mediaUrls: [],
    }))

    await db.cards.bulkAdd(newCards)
    return newCards.length
  }

  return {
    cards: cards || [],
    dueCards: dueCards || [],
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    getCardsByTag,
    searchCards,
    importCards,
  }
}

export { Rating }
