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
import { useDecks } from '@/hooks/useDecks'
import type { Deck } from '@/types'

interface DeckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deck?: Deck | null
}

export function DeckDialog({ open, onOpenChange, deck }: DeckDialogProps) {
  const { createDeck, updateDeck } = useDecks()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (deck) {
      setName(deck.name)
      setDescription(deck.description)
    } else {
      setName('')
      setDescription('')
    }
  }, [deck, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      if (deck) {
        await updateDeck(deck.id, { name, description })
      } else {
        await createDeck(name, description)
      }
      onOpenChange(false)
      setName('')
      setDescription('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deck ? 'Edit Deck' : 'Create New Deck'}</DialogTitle>
          <DialogDescription>
            {deck
              ? 'Update your deck details below.'
              : 'Create a new deck to organize your flashcards.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter deck name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter deck description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Saving...' : deck ? 'Save Changes' : 'Create Deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
