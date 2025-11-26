import { useState, useEffect } from 'react'
import {
  FolderOpen,
  Plus,
  MoreHorizontal,
  Play,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useDecks } from '@/hooks/useDecks'
import type { Deck, DeckStats } from '@/types'

interface DeckListProps {
  onSelectDeck: (deck: Deck) => void
  onStudyDeck: (deck: Deck) => void
  onStudyAllDecks: () => void
  onCreateDeck: () => void
  onEditDeck: (deck: Deck) => void
}

export function DeckList({
  onSelectDeck,
  onStudyDeck,
  onStudyAllDecks,
  onCreateDeck,
  onEditDeck,
}: DeckListProps) {
  const { decks, deleteDeck, getDeckStats } = useDecks()
  const [stats, setStats] = useState<Record<string, DeckStats>>({})

  useEffect(() => {
    const loadStats = async () => {
      const newStats: Record<string, DeckStats> = {}
      for (const deck of decks) {
        newStats[deck.id] = await getDeckStats(deck.id)
      }
      setStats(newStats)
    }
    if (decks.length > 0) {
      loadStats()
    }
  }, [decks, getDeckStats])

  const rootDecks = decks.filter((d) => d.parentId === null)

  const handleDelete = async (deck: Deck) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${deck.name}" and all its cards?`
      )
    ) {
      await deleteDeck(deck.id)
    }
  }

  if (rootDecks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No decks yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first deck to start studying
        </p>
        <Button onClick={onCreateDeck}>
          <Plus className="mr-2 h-4 w-4" />
          Create Deck
        </Button>
      </div>
    )
  }

  // Calculate total due cards across all decks
  const totalDueCards = Object.values(stats).reduce((sum, s) => sum + s.dueCards, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Decks</h2>
        <div className="flex gap-2">
          {totalDueCards > 0 && (
            <Button variant="secondary" onClick={onStudyAllDecks}>
              <Play className="mr-2 h-4 w-4" />
              Study All ({totalDueCards})
            </Button>
          )}
          <Button onClick={onCreateDeck}>
            <Plus className="mr-2 h-4 w-4" />
            New Deck
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rootDecks.map((deck) => {
          const deckStats = stats[deck.id]
          return (
            <Card
              key={deck.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectDeck(deck)}
                  >
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      {deck.name}
                    </CardTitle>
                    {deck.description && (
                      <CardDescription className="mt-1">
                        {deck.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onStudyDeck(deck)}>
                        <Play className="mr-2 h-4 w-4" />
                        Study Now
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditDeck(deck)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Deck
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(deck)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {deckStats && (
                    <>
                      <Badge variant="info">{deckStats.newCards} new</Badge>
                      <Badge variant="warning">
                        {deckStats.learningCards} learning
                      </Badge>
                      <Badge variant="success">
                        {deckStats.reviewCards} review
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {deckStats?.totalCards || 0} cards total
                  </span>
                  {deckStats && deckStats.dueCards > 0 && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStudyDeck(deck)
                      }}
                    >
                      Study ({deckStats.dueCards})
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
