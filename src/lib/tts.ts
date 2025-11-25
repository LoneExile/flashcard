/**
 * TTS (Text-to-Speech) Service for Flashcard App
 *
 * Integrates with IndexTTS server for high-quality Chinese/Pinyin speech synthesis.
 * Falls back to browser Web Speech API if server is unavailable.
 */

// Configuration
const TTS_SERVER_URL = import.meta.env.VITE_TTS_SERVER_URL || 'http://localhost:8000'
const USE_CACHE = true
const FALLBACK_TO_WEB_SPEECH = true

// Audio cache for played audio
const audioCache = new Map<string, HTMLAudioElement>()

// Server status
let serverAvailable: boolean | null = null
let serverCheckPromise: Promise<boolean> | null = null

/**
 * Check if IndexTTS server is available
 */
export async function checkServerStatus(): Promise<boolean> {
  if (serverCheckPromise) {
    return serverCheckPromise
  }

  serverCheckPromise = (async () => {
    try {
      const response = await fetch(`${TTS_SERVER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      serverAvailable = response.ok
      return serverAvailable
    } catch {
      serverAvailable = false
      return false
    } finally {
      // Reset check promise after 30 seconds to allow re-checking
      setTimeout(() => {
        serverCheckPromise = null
      }, 30000)
    }
  })()

  return serverCheckPromise
}

/**
 * Generate audio URL for text using IndexTTS server
 */
function getServerAudioUrl(text: string): string {
  const params = new URLSearchParams({ text })
  return `${TTS_SERVER_URL}/tts?${params.toString()}`
}

/**
 * Play audio using IndexTTS server
 */
async function playWithServer(text: string): Promise<HTMLAudioElement> {
  const cacheKey = `server:${text}`

  // Check cache
  if (USE_CACHE && audioCache.has(cacheKey)) {
    const cached = audioCache.get(cacheKey)!
    cached.currentTime = 0
    await cached.play()
    return cached
  }

  // Create and play audio
  const audio = new Audio(getServerAudioUrl(text))
  audio.preload = 'auto'

  return new Promise((resolve, reject) => {
    audio.oncanplaythrough = async () => {
      try {
        await audio.play()
        if (USE_CACHE) {
          audioCache.set(cacheKey, audio)
        }
        resolve(audio)
      } catch (err) {
        reject(err)
      }
    }

    audio.onerror = () => {
      reject(new Error('Failed to load audio from TTS server'))
    }

    audio.load()
  })
}

/**
 * Play audio using Web Speech API (browser built-in)
 */
async function playWithWebSpeech(text: string, lang: string = 'zh-CN'): Promise<SpeechSynthesisUtterance> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Web Speech API not supported'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9 // Slightly slower for learning
    utterance.pitch = 1

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices()
    const chineseVoice = voices.find(
      (v) => v.lang.startsWith('zh') || v.lang.includes('Chinese')
    )
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }

    utterance.onend = () => resolve(utterance)
    utterance.onerror = (event) => reject(new Error(event.error))

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Main function to speak text
 *
 * @param text - Text to speak (Chinese characters or Pinyin)
 * @param options - Optional configuration
 * @returns Promise that resolves when speech starts
 */
export async function speak(
  text: string,
  options: {
    forceServer?: boolean
    forceWebSpeech?: boolean
    lang?: string
  } = {}
): Promise<void> {
  if (!text.trim()) return

  const { forceServer, forceWebSpeech, lang = 'zh-CN' } = options

  // Force Web Speech API
  if (forceWebSpeech) {
    await playWithWebSpeech(text, lang)
    return
  }

  // Check server availability
  const isServerAvailable = forceServer || (await checkServerStatus())

  if (isServerAvailable) {
    try {
      await playWithServer(text)
      return
    } catch (err) {
      console.warn('IndexTTS server failed, falling back to Web Speech:', err)
      if (!FALLBACK_TO_WEB_SPEECH) throw err
    }
  }

  // Fallback to Web Speech API
  if (FALLBACK_TO_WEB_SPEECH) {
    await playWithWebSpeech(text, lang)
  } else {
    throw new Error('TTS server unavailable and fallback disabled')
  }
}

/**
 * Stop any currently playing audio
 */
export function stopSpeaking(): void {
  // Stop Web Speech
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  // Stop cached audio elements
  audioCache.forEach((audio) => {
    audio.pause()
    audio.currentTime = 0
  })
}

/**
 * Preload audio for a list of texts (for smoother playback)
 */
export async function preloadAudio(texts: string[]): Promise<void> {
  const isServerAvailable = await checkServerStatus()
  if (!isServerAvailable) return

  // Preload in background
  texts.forEach((text) => {
    if (!text.trim()) return
    const cacheKey = `server:${text}`
    if (audioCache.has(cacheKey)) return

    const audio = new Audio(getServerAudioUrl(text))
    audio.preload = 'auto'
    audio.load()

    audio.oncanplaythrough = () => {
      audioCache.set(cacheKey, audio)
    }
  })
}

/**
 * Clear audio cache
 */
export function clearAudioCache(): void {
  audioCache.forEach((audio) => {
    audio.pause()
    audio.src = ''
  })
  audioCache.clear()
}

/**
 * Get TTS service status
 */
export function getTTSStatus(): {
  serverUrl: string
  serverAvailable: boolean | null
  cacheSize: number
  webSpeechSupported: boolean
} {
  return {
    serverUrl: TTS_SERVER_URL,
    serverAvailable,
    cacheSize: audioCache.size,
    webSpeechSupported: 'speechSynthesis' in window,
  }
}
