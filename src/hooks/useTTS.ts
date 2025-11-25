import { useState, useCallback, useEffect } from 'react'
import {
  speak,
  stopSpeaking,
  checkServerStatus,
  preloadAudio,
  getTTSStatus,
} from '@/lib/tts'

interface UseTTSOptions {
  autoCheckServer?: boolean
}

interface TTSState {
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  serverAvailable: boolean | null
}

export function useTTS(options: UseTTSOptions = {}) {
  const { autoCheckServer = true } = options

  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    serverAvailable: null,
  })

  // Check server status on mount
  useEffect(() => {
    if (autoCheckServer) {
      checkServerStatus().then((available) => {
        setState((prev) => ({ ...prev, serverAvailable: available }))
      })
    }
  }, [autoCheckServer])

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }))
      await speak(text)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'TTS failed',
      }))
    } finally {
      setState((prev) => ({ ...prev, isPlaying: false, isLoading: false }))
    }
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const preload = useCallback(async (texts: string[]) => {
    await preloadAudio(texts)
  }, [])

  const refreshServerStatus = useCallback(async () => {
    const available = await checkServerStatus()
    setState((prev) => ({ ...prev, serverAvailable: available }))
    return available
  }, [])

  const getStatus = useCallback(() => {
    return getTTSStatus()
  }, [])

  return {
    ...state,
    speak: speakText,
    stop,
    preload,
    refreshServerStatus,
    getStatus,
  }
}
