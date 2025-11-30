import { useEffect, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { syncToServer, checkServerStatus } from '@/lib/api'
import type { AppSettings } from '@/types'

const SYNC_DEBOUNCE_MS = 5000 // Wait 5 seconds after last change before syncing

export function useAutoSync() {
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<string>('')
  const isSyncingRef = useRef(false)

  const settings = useLiveQuery(() =>
    db.settings.get('app-settings')
  ) as (AppSettings & { id: string }) | undefined

  // Watch for data changes
  const decks = useLiveQuery(() => db.decks.toArray())
  const cards = useLiveQuery(() => db.cards.toArray())
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray())
  const studySessions = useLiveQuery(() => db.studySessions.toArray())

  const performSync = useCallback(async () => {
    if (isSyncingRef.current) return

    // Check if server is online first
    const isOnline = await checkServerStatus()
    if (!isOnline) {
      console.log('[AutoSync] Server offline, skipping sync')
      return
    }

    isSyncingRef.current = true
    try {
      const [decksData, cardsData, reviewLogsData, studySessionsData] = await Promise.all([
        db.decks.toArray(),
        db.cards.toArray(),
        db.reviewLogs.toArray(),
        db.studySessions.toArray(),
      ])

      const result = await syncToServer({
        decks: decksData,
        cards: cardsData,
        reviewLogs: reviewLogsData,
        studySessions: studySessionsData,
      })

      if (result.success) {
        console.log('[AutoSync] Sync completed:', result.message)
      } else {
        console.warn('[AutoSync] Sync failed:', result.message)
      }
    } catch (error) {
      console.error('[AutoSync] Sync error:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  // Create a hash of current data to detect changes
  const getDataHash = useCallback(() => {
    if (!decks || !cards) return ''
    return JSON.stringify({
      decksCount: decks.length,
      cardsCount: cards.length,
      reviewLogsCount: reviewLogs?.length || 0,
      studySessionsCount: studySessions?.length || 0,
      // Include some data fingerprints
      lastDeck: decks[decks.length - 1]?.updatedAt?.toString(),
      lastCard: cards[cards.length - 1]?.updatedAt?.toString(),
    })
  }, [decks, cards, reviewLogs, studySessions])

  useEffect(() => {
    // Don't sync if autoSync is disabled or data not loaded yet
    if (!settings?.autoSync || !decks || !cards) {
      return
    }

    const currentHash = getDataHash()

    // Skip if data hasn't changed
    if (currentHash === lastSyncRef.current) {
      return
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Schedule a new sync after debounce period
    syncTimeoutRef.current = setTimeout(() => {
      lastSyncRef.current = currentHash
      performSync()
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [settings?.autoSync, decks, cards, reviewLogs, studySessions, getDataHash, performSync])

  return {
    isAutoSyncEnabled: settings?.autoSync ?? true,
  }
}
