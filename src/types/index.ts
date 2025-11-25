import type { Card as FSRSCard, State } from 'ts-fsrs'

export type CardType = 'basic' | 'cloze' | 'multiple-choice'

export interface Deck {
  id: string
  name: string
  description: string
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  settings: DeckSettings
}

export interface DeckSettings {
  newCardsPerDay: number
  reviewsPerDay: number
  showAnswerTimer: boolean
  autoAdvance: boolean
}

export interface Card {
  id: string
  deckId: string
  type: CardType
  front: string
  back: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  fsrs: FSRSCard
  mediaUrls: string[]
}

export interface ReviewLog {
  id: string
  cardId: string
  rating: number
  state: State
  due: Date
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  review: Date
}

export interface StudySession {
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

export interface DeckStats {
  totalCards: number
  newCards: number
  learningCards: number
  reviewCards: number
  dueCards: number
  averageRetention: number
  streak: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  dailyGoal: number
  soundEnabled: boolean
  hapticEnabled: boolean
}

export interface ImportedCard {
  front: string
  back: string
  tags?: string[]
  type?: CardType
}

export interface ExportData {
  version: string
  exportDate: string
  decks: Deck[]
  cards: Card[]
  reviewLogs: ReviewLog[]
}
