import type { Card as FSRSCard, State } from 'ts-fsrs'

// User and Auth types
export interface User {
  id: string
  email: string
  username: string
  isActive: boolean
  isAdmin: boolean
  oauthProvider?: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthConfig {
  registrationEnabled: boolean
  oauthEnabled: boolean
  oauthProviders: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
}

export type CardType = 'basic' | 'cloze' | 'multiple-choice'
export type CardDirection = 'normal' | 'reverse'

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
  direction: CardDirection // 'normal' = front→back, 'reverse' = back→front
  pairId?: string // Links normal and reverse cards together
  front: string
  back: string
  audio?: string // Chinese characters or text for TTS (if different from front)
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
  autoSync: boolean
}

export interface ImportedCard {
  front: string
  back: string
  audio?: string
  tags?: string[]
  type?: CardType
  createReverse?: boolean // Whether to also create a reverse card
}

export interface ExportData {
  version: string
  exportDate: string
  decks: Deck[]
  cards: Card[]
  reviewLogs: ReviewLog[]
}
