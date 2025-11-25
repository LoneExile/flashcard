import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Sun, Monitor, Trash2, Download, Upload } from 'lucide-react'
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

  useEffect(() => {
    if (settings) {
      setDailyGoal(settings.dailyGoal)
    }
  }, [settings])

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
