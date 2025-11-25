import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Play,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCards } from '@/hooks/useCards'
import { useDecks } from '@/hooks/useDecks'
import { useTTS } from '@/hooks/useTTS'
import { getCardState } from '@/lib/fsrs'
import { formatRelativeTime } from '@/lib/utils'
import { CardEditor } from './CardEditor'
import { ImportDialog } from './ImportDialog'
import type { Deck, Card as CardType, DeckStats } from '@/types'

interface DeckViewProps {
  deck: Deck
  onBack: () => void
  onStudy: () => void
}

export function DeckView({ deck, onBack, onStudy }: DeckViewProps) {
  const { cards, deleteCard, dueCards } = useCards(deck.id)
  const { getDeckStats } = useDecks()
  const { speak } = useTTS()
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<DeckStats | null>(null)
  const [cardEditorOpen, setCardEditorOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardType | null>(null)

  useEffect(() => {
    getDeckStats(deck.id).then(setStats)
  }, [deck.id, cards, getDeckStats])

  const filteredCards = cards.filter(
    (card) =>
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))
  )

  const handleEditCard = (card: CardType) => {
    setEditingCard(card)
    setCardEditorOpen(true)
  }

  const handleDeleteCard = async (card: CardType) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      await deleteCard(card.id)
    }
  }

  const handleAddCard = () => {
    setEditingCard(null)
    setCardEditorOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{deck.name}</h2>
            {deck.description && (
              <p className="text-muted-foreground">{deck.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          {dueCards.length > 0 && (
            <Button onClick={onStudy}>
              <Play className="mr-2 h-4 w-4" />
              Study ({dueCards.length} due)
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Cards</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCards}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Due Today</CardDescription>
              <CardTitle className="text-3xl text-orange-500">
                {stats.dueCards}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Retention</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {Math.round(stats.averageRetention * 100)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Streak</CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {stats.streak} days
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Search and Add */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAddCard}>
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      {/* Cards List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No cards match your search'
                  : 'No cards in this deck yet'}
              </p>
              {!searchQuery && (
                <Button variant="outline" className="mt-4" onClick={handleAddCard}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Card
                </Button>
              )}
            </div>
          ) : (
            filteredCards.map((card) => (
              <Card key={card.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            getCardState(card.fsrs) === 'New'
                              ? 'info'
                              : getCardState(card.fsrs) === 'Learning' ||
                                  getCardState(card.fsrs) === 'Relearning'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {getCardState(card.fsrs)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Due: {formatRelativeTime(card.fsrs.due)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{card.front}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Use audio field (Chinese characters) if available, otherwise fall back to front (Pinyin)
                            speak(card.audio || card.front)
                          }}
                          title="Play audio"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {card.back}
                      </p>
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCard(card)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCard(card)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <CardEditor
        open={cardEditorOpen}
        onOpenChange={setCardEditorOpen}
        deckId={deck.id}
        card={editingCard}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        deckId={deck.id}
      />
    </div>
  )
}
