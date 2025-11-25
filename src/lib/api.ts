/**
 * API Service for Flashcard App Backend
 *
 * Communicates with the SQLite backend for syncing data.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SyncData {
  decks: any[]
  cards: any[]
  reviewLogs: any[]
  studySessions: any[]
}

/**
 * Check if the backend server is available
 */
export async function checkServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Upload all local data to the server
 */
export async function syncToServer(data: SyncData): Promise<{ success: boolean; message: string }> {
  try {
    // Transform data to match API expectations
    const transformedData = {
      decks: data.decks.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description || '',
        parentId: d.parentId || null,
        settings: d.settings || {},
      })),
      cards: data.cards.map(c => ({
        id: c.id,
        deckId: c.deckId,
        type: c.type || 'basic',
        front: c.front,
        back: c.back,
        audio: c.audio || null,
        tags: c.tags || [],
        mediaUrls: c.mediaUrls || [],
        fsrs: {
          due: c.fsrs.due instanceof Date ? c.fsrs.due.toISOString() : c.fsrs.due,
          stability: c.fsrs.stability || 0,
          difficulty: c.fsrs.difficulty || 0,
          elapsed_days: c.fsrs.elapsed_days || 0,
          scheduled_days: c.fsrs.scheduled_days || 0,
          reps: c.fsrs.reps || 0,
          lapses: c.fsrs.lapses || 0,
          state: c.fsrs.state || 0,
          last_review: c.fsrs.last_review instanceof Date
            ? c.fsrs.last_review.toISOString()
            : c.fsrs.last_review || null,
        },
      })),
      reviewLogs: data.reviewLogs.map(l => ({
        id: l.id,
        cardId: l.cardId,
        rating: l.rating,
        state: l.state,
        due: l.due instanceof Date ? l.due.toISOString() : l.due,
        stability: l.stability,
        difficulty: l.difficulty,
        elapsedDays: l.elapsedDays,
        scheduledDays: l.scheduledDays,
        review: l.review instanceof Date ? l.review.toISOString() : l.review,
      })),
      studySessions: data.studySessions.map(s => ({
        id: s.id,
        deckId: s.deckId,
        startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
        endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime || null,
        cardsStudied: s.cardsStudied || 0,
        correctCount: s.correctCount || 0,
        againCount: s.againCount || 0,
        hardCount: s.hardCount || 0,
        goodCount: s.goodCount || 0,
        easyCount: s.easyCount || 0,
      })),
    }

    const response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Sync failed')
    }

    const result = await response.json()
    return {
      success: true,
      message: `Synced ${result.counts.decks} decks, ${result.counts.cards} cards`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
    }
  }
}

/**
 * Download all data from the server
 */
export async function syncFromServer(): Promise<{ success: boolean; data?: SyncData; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch data')
    }

    const data = await response.json()

    // Transform dates back to Date objects
    const transformedData: SyncData = {
      decks: data.decks.map((d: any) => ({
        ...d,
        parentId: d.parentId,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      })),
      cards: data.cards.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        fsrs: {
          ...c.fsrs,
          due: new Date(c.fsrs.due),
          last_review: c.fsrs.last_review ? new Date(c.fsrs.last_review) : undefined,
        },
      })),
      reviewLogs: data.reviewLogs.map((l: any) => ({
        ...l,
        due: new Date(l.due),
        review: new Date(l.review),
      })),
      studySessions: data.studySessions.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : null,
      })),
    }

    return {
      success: true,
      data: transformedData,
      message: `Loaded ${transformedData.decks.length} decks, ${transformedData.cards.length} cards`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch data',
    }
  }
}

/**
 * Get API status info
 */
export function getApiUrl(): string {
  return API_BASE_URL
}
