import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, ArrowLeftRight } from 'lucide-react'
import { useCards } from '@/hooks/useCards'
import type { Card } from '@/types'

interface CardEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deckId: string
  card?: Card | null
}

export function CardEditor({
  open,
  onOpenChange,
  deckId,
  card,
}: CardEditorProps) {
  const { createCard, updateCard } = useCards(deckId)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [audio, setAudio] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [createReverse, setCreateReverse] = useState(() => {
    return localStorage.getItem('card-create-reverse') === 'true'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (card) {
      setFront(card.front)
      setBack(card.back)
      setAudio(card.audio || '')
      setTags(card.tags)
    } else {
      setFront('')
      setBack('')
      setAudio('')
      setTags([])
    }
    setTagInput('')
  }, [card, open])

  const handleCreateReverseChange = (checked: boolean) => {
    setCreateReverse(checked)
    localStorage.setItem('card-create-reverse', String(checked))
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return

    setIsLoading(true)
    try {
      if (card) {
        await updateCard(card.id, { front, back, audio: audio || undefined, tags })
      } else {
        await createCard(deckId, front, back, {
          tags,
          audio: audio || undefined,
          createReverse,
        })
      }
      onOpenChange(false)
      setFront('')
      setBack('')
      setAudio('')
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Card' : 'Add New Card'}</DialogTitle>
          <DialogDescription>
            {card
              ? 'Update the card content below.'
              : 'Create a new flashcard for this deck.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Question (Front)</Label>
              <Textarea
                id="front"
                placeholder="Enter the question or prompt"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Answer (Back)</Label>
              <Textarea
                id="back"
                placeholder="Enter the answer"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audio">Audio Text (Optional)</Label>
              <Input
                id="audio"
                placeholder="Chinese characters for TTS (if different from front)"
                value={audio}
                onChange={(e) => setAudio(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                For Pinyin cards, enter Chinese characters here for correct pronunciation
              </p>
            </div>
            {!card && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <input
                  type="checkbox"
                  id="createReverse"
                  checked={createReverse}
                  onChange={(e) => handleCreateReverseChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="createReverse" className="flex items-center gap-2 cursor-pointer">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Also create reverse card</span>
                </Label>
                <span className="text-xs text-muted-foreground ml-auto">
                  Creates both directions for bidirectional study
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !front.trim() || !back.trim()}
            >
              {isLoading ? 'Saving...' : card ? 'Save Changes' : 'Add Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
