import { useState } from 'react'
import { Upload, FileText, AlertCircle, ArrowLeftRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCards } from '@/hooks/useCards'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string
}

export function ImportDialog({ open, onOpenChange, deckId }: ImportDialogProps) {
  const { importCards } = useCards(deckId)
  const [textInput, setTextInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [createReverse, setCreateReverse] = useState(() => {
    return localStorage.getItem('import-create-reverse') === 'true'
  })

  const handleCreateReverseChange = (checked: boolean) => {
    setCreateReverse(checked)
    localStorage.setItem('import-create-reverse', String(checked))
  }

  const parseTextInput = (text: string) => {
    const cards: Array<{ front: string; back: string; tags?: string[] }> = []
    const lines = text.trim().split('\n')

    let currentFront = ''
    let currentBack = ''
    let currentTags: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines
      if (!trimmedLine) {
        if (currentFront && currentBack) {
          cards.push({
            front: currentFront.trim(),
            back: currentBack.trim(),
            tags: currentTags.length > 0 ? currentTags : undefined,
          })
          currentFront = ''
          currentBack = ''
          currentTags = []
        }
        continue
      }

      // Check for Q: / A: format
      if (trimmedLine.startsWith('Q:') || trimmedLine.startsWith('q:')) {
        if (currentFront && currentBack) {
          cards.push({
            front: currentFront.trim(),
            back: currentBack.trim(),
            tags: currentTags.length > 0 ? currentTags : undefined,
          })
          currentTags = []
        }
        currentFront = trimmedLine.slice(2).trim()
        currentBack = ''
      } else if (trimmedLine.startsWith('A:') || trimmedLine.startsWith('a:')) {
        currentBack = trimmedLine.slice(2).trim()
      } else if (trimmedLine.startsWith('Tags:') || trimmedLine.startsWith('tags:')) {
        currentTags = trimmedLine
          .slice(5)
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      }
      // Check for tab-separated format
      else if (trimmedLine.includes('\t')) {
        const parts = trimmedLine.split('\t')
        if (parts.length >= 2) {
          cards.push({
            front: parts[0].trim(),
            back: parts[1].trim(),
            tags: parts[2]
              ? parts[2]
                  .split(',')
                  .map((t) => t.trim().toLowerCase())
                  .filter(Boolean)
              : undefined,
          })
        }
      }
      // Check for double-colon separator (Anki-style)
      else if (trimmedLine.includes('::')) {
        const parts = trimmedLine.split('::')
        if (parts.length >= 2) {
          cards.push({
            front: parts[0].trim(),
            back: parts[1].trim(),
          })
        }
      }
    }

    // Don't forget the last card
    if (currentFront && currentBack) {
      cards.push({
        front: currentFront.trim(),
        back: currentBack.trim(),
        tags: currentTags.length > 0 ? currentTags : undefined,
      })
    }

    return cards
  }

  const handleImport = async () => {
    setError(null)
    setImportedCount(null)

    if (!textInput.trim()) {
      setError('Please enter some cards to import')
      return
    }

    setIsLoading(true)
    try {
      const cards = parseTextInput(textInput)

      if (cards.length === 0) {
        setError(
          'No valid cards found. Please use the correct format:\n• Q:/A: format\n• Tab-separated (front\\tback)\n• Double colon (front::back)'
        )
        return
      }

      const count = await importCards(deckId, cards, createReverse)
      setImportedCount(count)
      setTextInput('')
    } catch {
      setError('Failed to import cards. Please check the format and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setImportedCount(null)

    try {
      const text = await file.text()
      setTextInput(text)
    } catch {
      setError('Failed to read file')
    }
  }

  const handleClose = () => {
    setTextInput('')
    setError(null)
    setImportedCount(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Cards</DialogTitle>
          <DialogDescription>
            Import flashcards from text or file. Multiple formats are supported.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="mr-2 h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label>Cards (use one of the supported formats)</Label>
              <Textarea
                placeholder={`Supported formats:

Q: What is the capital of France?
A: Paris
Tags: geography, europe

OR tab-separated:
Front\tBack\ttags

OR double-colon:
Question::Answer`}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload a text file</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    .txt, .csv, or .tsv files
                  </p>
                </label>
              </div>
            </div>
            {textInput && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {importedCount !== null && (
          <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
            Successfully imported {importedCount} cards!
          </div>
        )}

        {importedCount === null && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="createReverseImport"
              checked={createReverse}
              onChange={(e) => handleCreateReverseChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="createReverseImport" className="flex items-center gap-2 cursor-pointer text-sm">
              <ArrowLeftRight className="h-4 w-4" />
              <span>Also create reverse cards for bidirectional study</span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importedCount !== null ? 'Close' : 'Cancel'}
          </Button>
          {importedCount === null && (
            <Button
              onClick={handleImport}
              disabled={isLoading || !textInput.trim()}
            >
              {isLoading ? 'Importing...' : 'Import Cards'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
