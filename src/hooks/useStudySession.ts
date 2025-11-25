import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import type { Card, StudySession } from '@/types'
import { useCards, Rating } from './useCards'
import { getSchedulingOptions, isDue } from '@/lib/fsrs'

interface StudyState {
  isStudying: boolean
  currentCard: Card | null
  currentIndex: number
  totalCards: number
  showingAnswer: boolean
  sessionStats: {
    studied: number
    again: number
    hard: number
    good: number
    easy: number
  }
}

export function useStudySession(deckId: string) {
  const { dueCards, reviewCard } = useCards(deckId)
  const [session, setSession] = useState<StudySession | null>(null)
  const [studyQueue, setStudyQueue] = useState<Card[]>([])
  const [state, setState] = useState<StudyState>({
    isStudying: false,
    currentCard: null,
    currentIndex: 0,
    totalCards: 0,
    showingAnswer: false,
    sessionStats: {
      studied: 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    },
  })

  const startSession = useCallback(
    async (cardsToStudy?: Card[]) => {
      const cards = cardsToStudy || dueCards.filter((c) => isDue(c.fsrs))

      if (cards.length === 0) {
        return false
      }

      // Shuffle cards for variety
      const shuffled = [...cards].sort(() => Math.random() - 0.5)

      const newSession: StudySession = {
        id: uuidv4(),
        deckId,
        startTime: new Date(),
        endTime: null,
        cardsStudied: 0,
        correctCount: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
      }

      await db.studySessions.add(newSession)
      setSession(newSession)
      setStudyQueue(shuffled)

      setState({
        isStudying: true,
        currentCard: shuffled[0],
        currentIndex: 0,
        totalCards: shuffled.length,
        showingAnswer: false,
        sessionStats: {
          studied: 0,
          again: 0,
          hard: 0,
          good: 0,
          easy: 0,
        },
      })

      return true
    },
    [dueCards, deckId]
  )

  const showAnswer = useCallback(() => {
    setState((prev) => ({ ...prev, showingAnswer: true }))
  }, [])

  const endSession = useCallback(async () => {
    if (session) {
      await db.studySessions.update(session.id, {
        endTime: new Date(),
        cardsStudied: state.sessionStats.studied,
        correctCount: state.sessionStats.good + state.sessionStats.easy,
        againCount: state.sessionStats.again,
        hardCount: state.sessionStats.hard,
        goodCount: state.sessionStats.good,
        easyCount: state.sessionStats.easy,
      })
    }

    setSession(null)
    setStudyQueue([])
    setState({
      isStudying: false,
      currentCard: null,
      currentIndex: 0,
      totalCards: 0,
      showingAnswer: false,
      sessionStats: {
        studied: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
      },
    })
  }, [session, state.sessionStats])

  const answerCard = useCallback(
    async (rating: Rating) => {
      if (!state.currentCard || !session) return

      const { updatedCard } = await reviewCard(state.currentCard, rating)

      // Update session stats
      const ratingKey =
        rating === Rating.Again
          ? 'again'
          : rating === Rating.Hard
            ? 'hard'
            : rating === Rating.Good
              ? 'good'
              : 'easy'

      const newStats = {
        ...state.sessionStats,
        studied: state.sessionStats.studied + 1,
        [ratingKey]: state.sessionStats[ratingKey] + 1,
      }

      // Update session in DB
      await db.studySessions.update(session.id, {
        cardsStudied: newStats.studied,
        correctCount: newStats.good + newStats.easy,
        againCount: newStats.again,
        hardCount: newStats.hard,
        goodCount: newStats.good,
        easyCount: newStats.easy,
      })

      // If Again, add card back to queue
      const newQueue = [...studyQueue]
      if (rating === Rating.Again) {
        // Insert the card at a random position in the remaining queue
        const insertPos =
          state.currentIndex + 1 + Math.floor(Math.random() * 3)
        newQueue.splice(insertPos, 0, { ...state.currentCard, fsrs: updatedCard.fsrs })
      }

      // Move to next card
      const nextIndex = state.currentIndex + 1
      if (nextIndex < newQueue.length) {
        setStudyQueue(newQueue)
        setState((prev) => ({
          ...prev,
          currentCard: newQueue[nextIndex],
          currentIndex: nextIndex,
          totalCards: newQueue.length,
          showingAnswer: false,
          sessionStats: newStats,
        }))
      } else {
        // Session complete
        await endSession()
      }
    },
    [state, session, studyQueue, reviewCard, endSession]
  )

  const getSchedulingInfo = useCallback(() => {
    if (!state.currentCard) return null
    return getSchedulingOptions(state.currentCard.fsrs)
  }, [state.currentCard])

  return {
    ...state,
    session,
    dueCount: dueCards.length,
    startSession,
    showAnswer,
    answerCard,
    endSession,
    getSchedulingInfo,
  }
}

export { Rating }
