import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Sun, Monitor, Trash2, Download, Upload, Volume2, Cloud, CloudUpload, CloudDownload, RefreshCw } from 'lucide-react'
import { CHINESE_VOICES, getVoice, setVoice, type VoiceKey } from '@/lib/tts'
import { checkServerStatus, syncToServer, syncFromServer, getApiUrl } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { db, clearAllData } from '@/db'
import type { AppSettings, ExportData } from '@/types'

export function Settings() {
  const settings = useLiveQuery(() =>
    db.settings.get('app-settings')
  ) as (AppSettings & { id: string }) | undefined

  const [dailyGoal, setDailyGoal] = useState(20)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<VoiceKey>(getVoice())
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setDailyGoal(settings.dailyGoal)
    }
  }, [settings])

  // Check server status on mount
  useEffect(() => {
    checkServerStatus().then(setServerOnline)
  }, [])

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    await db.settings.update('app-settings', { theme })

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const updateDailyGoal = async (goal: number) => {
    setDailyGoal(goal)
    await db.settings.update('app-settings', { dailyGoal: goal })
  }

  const handleVoiceChange = (voice: VoiceKey) => {
    setSelectedVoice(voice)
    setVoice(voice)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const [decks, cards, reviewLogs] = await Promise.all([
        db.decks.toArray(),
        db.cards.toArray(),
        db.reviewLogs.toArray(),
      ])

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        decks,
        cards,
        reviewLogs,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flashcard-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data: ExportData = JSON.parse(text)

      if (!data.version || !data.decks || !data.cards) {
        throw new Error('Invalid export file format')
      }

      await db.transaction(
        'rw',
        [db.decks, db.cards, db.reviewLogs],
        async () => {
          // Clear existing data
          await clearAllData()

          // Import new data
          await db.decks.bulkAdd(
            data.decks.map((d) => ({
              ...d,
              createdAt: new Date(d.createdAt),
              updatedAt: new Date(d.updatedAt),
            }))
          )

          await db.cards.bulkAdd(
            data.cards.map((c) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
              fsrs: {
                ...c.fsrs,
                due: new Date(c.fsrs.due),
                last_review: c.fsrs.last_review
                  ? new Date(c.fsrs.last_review)
                  : undefined,
              },
            }))
          )

          if (data.reviewLogs) {
            await db.reviewLogs.bulkAdd(
              data.reviewLogs.map((l) => ({
                ...l,
                due: new Date(l.due),
                review: new Date(l.review),
              }))
            )
          }
        }
      )

      alert('Data imported successfully!')
    } catch {
      alert('Failed to import data. Please check the file format.')
    }

    // Reset file input
    e.target.value = ''
  }

  const handleClearData = async () => {
    await clearAllData()
    alert('All data has been cleared.')
  }

  const handleCheckServer = async () => {
    const status = await checkServerStatus()
    setServerOnline(status)
    setSyncMessage(status ? 'Server is online' : 'Server is offline')
    setTimeout(() => setSyncMessage(null), 3000)
  }

  const handleSyncToServer = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const [decks, cards, reviewLogs, studySessions] = await Promise.all([
        db.decks.toArray(),
        db.cards.toArray(),
        db.reviewLogs.toArray(),
        db.studySessions.toArray(),
      ])

      const result = await syncToServer({ decks, cards, reviewLogs, studySessions })
      setSyncMessage(result.message)
      if (!result.success) {
        setServerOnline(false)
      }
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const handleSyncFromServer = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncFromServer()

      if (result.success && result.data) {
        // Clear local data and import from server
        await clearAllData()

        // Import decks
        await db.decks.bulkAdd(result.data.decks)

        // Import cards
        await db.cards.bulkAdd(result.data.cards)

        // Import review logs
        if (result.data.reviewLogs.length > 0) {
          await db.reviewLogs.bulkAdd(result.data.reviewLogs)
        }

        // Import study sessions
        if (result.data.studySessions.length > 0) {
          await db.studySessions.bulkAdd(result.data.studySessions)
        }

        setSyncMessage(result.message)
      } else {
        setSyncMessage(result.message)
        setServerOnline(false)
      }
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the app looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings?.theme || 'system'}
              onValueChange={(value) =>
                updateTheme(value as 'light' | 'dark' | 'system')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Study Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Study Settings</CardTitle>
          <CardDescription>Configure your study preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Daily Goal (cards)</Label>
            <Input
              id="dailyGoal"
              type="number"
              min={1}
              max={500}
              value={dailyGoal}
              onChange={(e) => updateDailyGoal(parseInt(e.target.value) || 20)}
            />
            <p className="text-xs text-muted-foreground">
              Number of cards you aim to study each day
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>Choose a Chinese voice for text-to-speech</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chinese Voice</Label>
            <Select
              value={selectedVoice}
              onValueChange={(value) => handleVoiceChange(value as VoiceKey)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CHINESE_VOICES) as VoiceKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <span>{CHINESE_VOICES[key].name}</span>
                      <span className="text-muted-foreground">
                        ({CHINESE_VOICES[key].gender} - {CHINESE_VOICES[key].desc})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Uses Microsoft Edge neural voices for natural-sounding Chinese speech
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backend Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Backend Sync
          </CardTitle>
          <CardDescription>
            Sync your data with the SQLite backend server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Server:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">{getApiUrl()}</code>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                serverOnline === null
                  ? 'bg-gray-100 text-gray-600'
                  : serverOnline
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {serverOnline === null ? 'Unknown' : serverOnline ? 'Online' : 'Offline'}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCheckServer} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={handleSyncToServer}
              disabled={syncing || serverOnline === false}
            >
              <CloudUpload className="mr-2 h-4 w-4" />
              {syncing ? 'Syncing...' : 'Upload to Server'}
            </Button>

            <Button
              variant="outline"
              onClick={handleSyncFromServer}
              disabled={syncing || serverOnline === false}
            >
              <CloudDownload className="mr-2 h-4 w-4" />
              {syncing ? 'Syncing...' : 'Download from Server'}
            </Button>
          </div>

          {syncMessage && (
            <p className="text-sm text-muted-foreground">{syncMessage}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Upload saves your local data to the server. Download replaces local data with server data.
          </p>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, or clear your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
              <Download className="mr-2 h-4 w-4" />
              {exportLoading ? 'Exporting...' : 'Export Data'}
            </Button>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your decks, cards, and study history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData}>
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Flashcard App</strong> v1.0.0
          </p>
          <p>
            Built with React, TypeScript, and the FSRS algorithm for optimal
            spaced repetition learning.
          </p>
          <p>
            FSRS (Free Spaced Repetition Scheduler) is a modern spaced
            repetition algorithm that adapts to your learning patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
