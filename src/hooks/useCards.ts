import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import type { Card, CardType, CardDirection, ReviewLog } from '@/types'
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
    options: {
      type?: CardType
      tags?: string[]
      audio?: string
      direction?: CardDirection
      createReverse?: boolean
    } = {}
  ): Promise<Card[]> => {
    const {
      type = 'basic',
      tags = [],
      audio,
      direction = 'normal',
      createReverse = false,
    } = options

    const now = new Date()
    const pairId = createReverse ? uuidv4() : undefined
    const cards: Card[] = []

    // Create the main card
    const card: Card = {
      id: uuidv4(),
      deckId: targetDeckId,
      type,
      direction,
      pairId,
      front,
      back,
      audio,
      tags,
      createdAt: now,
      updatedAt: now,
      fsrs: createNewFSRSCard(),
      mediaUrls: [],
    }
    cards.push(card)

    // Create reverse card if requested
    if (createReverse) {
      const reverseCard: Card = {
        id: uuidv4(),
        deckId: targetDeckId,
        type,
        direction: 'reverse',
        pairId,
        front: back,  // Swap front and back
        back: front,
        audio,  // Keep audio (Chinese characters) for TTS on the answer side
        tags: [...tags, 'reverse'],
        createdAt: now,
        updatedAt: now,
        fsrs: createNewFSRSCard(),
        mediaUrls: [],
      }
      cards.push(reverseCard)
    }

    await db.cards.bulkAdd(cards)
    return cards
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

  const generateReverseCards = async (targetDeckId: string): Promise<number> => {
    // Find all normal cards that don't have a reverse pair
    const allCards = await db.cards.where('deckId').equals(targetDeckId).toArray()

    // Get cards that are normal (or undefined direction) and don't have a pairId
    const cardsWithoutReverse = allCards.filter(card =>
      (card.direction === 'normal' || !card.direction) && !card.pairId
    )

    if (cardsWithoutReverse.length === 0) {
      return 0
    }

    const now = new Date()
    const newCards: Card[] = []
    const updates: { id: string; pairId: string; direction: CardDirection }[] = []

    for (const card of cardsWithoutReverse) {
      const pairId = uuidv4()

      // Update the original card with pairId and direction
      updates.push({ id: card.id, pairId, direction: 'normal' })

      // Create reverse card
      newCards.push({
        id: uuidv4(),
        deckId: targetDeckId,
        type: card.type,
        direction: 'reverse',
        pairId,
        front: card.back,  // Swap
        back: card.front,
        audio: card.audio,  // Keep for TTS
        tags: [...card.tags.filter(t => t !== 'reverse'), 'reverse'],
        createdAt: now,
        updatedAt: now,
        fsrs: createNewFSRSCard(),
        mediaUrls: [],
      })
    }

    await db.transaction('rw', db.cards, async () => {
      // Update original cards with pairId
      for (const update of updates) {
        await db.cards.update(update.id, {
          pairId: update.pairId,
          direction: update.direction,
          updatedAt: now
        })
      }
      // Add new reverse cards
      await db.cards.bulkAdd(newCards)
    })

    return newCards.length
  }

  const importCards = async (
    targetDeckId: string,
    cardsData: Array<{
      front: string
      back: string
      audio?: string
      tags?: string[]
      type?: CardType
      createReverse?: boolean
    }>,
    defaultCreateReverse: boolean = false
  ): Promise<number> => {
    const now = new Date()
    const newCards: Card[] = []

    for (const data of cardsData) {
      const shouldCreateReverse = data.createReverse ?? defaultCreateReverse
      const pairId = shouldCreateReverse ? uuidv4() : undefined

      // Normal card
      newCards.push({
        id: uuidv4(),
        deckId: targetDeckId,
        type: data.type || 'basic',
        direction: 'normal',
        pairId,
        front: data.front,
        back: data.back,
        audio: data.audio,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now,
        fsrs: createNewFSRSCard(),
        mediaUrls: [],
      })

      // Reverse card if requested
      if (shouldCreateReverse) {
        newCards.push({
          id: uuidv4(),
          deckId: targetDeckId,
          type: data.type || 'basic',
          direction: 'reverse',
          pairId,
          front: data.back,  // Swap
          back: data.front,
          audio: data.audio,  // Keep for TTS
          tags: [...(data.tags || []), 'reverse'],
          createdAt: now,
          updatedAt: now,
          fsrs: createNewFSRSCard(),
          mediaUrls: [],
        })
      }
    }

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
    generateReverseCards,
  }
}

export { Rating }
