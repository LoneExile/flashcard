/**
 * API Service for Flashcard App Backend
 *
 * Communicates with the PostgreSQL backend for syncing data and authentication.
 */

import type { User, AuthConfig, LoginCredentials, RegisterCredentials } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface SyncData {
  decks: any[]
  cards: any[]
  reviewLogs: any[]
  studySessions: any[]
}

// Helper for API requests with credentials
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============== Auth API ==============

/**
 * Get authentication configuration
 */
export async function getAuthConfig(): Promise<AuthConfig> {
  return apiRequest<AuthConfig>('/auth/config')
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  return apiRequest<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  await apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
  })
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me')
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<User> {
  return apiRequest<User>('/auth/refresh', {
    method: 'POST',
  })
}

// ============== Admin API ==============

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

export interface UserUpdateRequest {
  isActive?: boolean
  isAdmin?: boolean
  password?: string
}

export interface UserCreateRequest {
  email: string
  username: string
  password: string
  isAdmin?: boolean
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalDecks: number
  totalCards: number
  totalStudySessions: number
  totalReviews: number
}

/**
 * List all users (admin only)
 */
export async function listUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
  isAdmin?: boolean
}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString())
  if (params?.search) searchParams.set('search', params.search)
  if (params?.isActive !== undefined) searchParams.set('is_active', params.isActive.toString())
  if (params?.isAdmin !== undefined) searchParams.set('is_admin', params.isAdmin.toString())

  const query = searchParams.toString()
  return apiRequest<UserListResponse>(`/admin/users${query ? `?${query}` : ''}`)
}

/**
 * Get user details (admin only)
 */
export async function getUser(userId: string): Promise<User & { stats: { deckCount: number; cardCount: number; sessionCount: number } }> {
  return apiRequest(`/admin/users/${userId}`)
}

/**
 * Update user (admin only)
 */
export async function updateUser(userId: string, data: UserUpdateRequest): Promise<User> {
  return apiRequest<User>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Create user (admin only)
 */
export async function createUser(data: UserCreateRequest): Promise<User> {
  return apiRequest<User>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

/**
 * Get system statistics (admin only)
 */
export async function getSystemStats(): Promise<SystemStats> {
  return apiRequest<SystemStats>('/admin/stats')
}

// ============== Data Sync API ==============

/**
 * Check if the backend server is available
 */
export async function checkServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
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
        direction: c.direction || 'normal',
        pairId: c.pairId || null,
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
      credentials: 'include',
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
      credentials: 'include',
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
        direction: c.direction || 'normal',
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
