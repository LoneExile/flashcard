import { useState, useEffect } from 'react'
import {
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DeckList } from '@/components/DeckList'
import { DeckDialog } from '@/components/DeckDialog'
import { DeckView } from '@/components/DeckView'
import { StudyView } from '@/components/StudyView'
import { Statistics } from '@/components/Statistics'
import { Settings } from '@/components/Settings'
import { db, initializeDB } from '@/db'
import { useDecks } from '@/hooks/useDecks'
import { useCards } from '@/hooks/useCards'
import { seedDecks } from '@/lib/seedData'
import type { Deck } from '@/types'

type View = 'decks' | 'deck-view' | 'study'
type Tab = 'decks' | 'stats' | 'settings'

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('decks')
  const [currentView, setCurrentView] = useState<View>('decks')
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [deckDialogOpen, setDeckDialogOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const { decks, createDeck } = useDecks()
  const { importCards } = useCards()

  useEffect(() => {
    const init = async () => {
      await initializeDB()

      // Apply saved theme
      const settings = await db.settings.get('app-settings')
      if (settings?.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (settings?.theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark')
        }
      }

      setIsLoading(false)
    }
    init()
  }, [])

  const handleSelectDeck = (deck: Deck) => {
    setSelectedDeck(deck)
    setCurrentView('deck-view')
  }

  const handleStudyDeck = (deck: Deck) => {
    setSelectedDeck(deck)
    setCurrentView('study')
  }

  const handleBack = () => {
    setCurrentView('decks')
    setSelectedDeck(null)
  }

  const handleStudyComplete = () => {
    setCurrentView('deck-view')
  }

  const handleCreateDeck = () => {
    setEditingDeck(null)
    setDeckDialogOpen(true)
  }

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck)
    setDeckDialogOpen(true)
  }

  const handleSeedData = async () => {
    setSeeding(true)
    try {
      for (const deckData of seedDecks) {
        const deck = await createDeck(deckData.name, deckData.description)
        await importCards(
          deck.id,
          deckData.cards.map((c) => ({
            front: c.front,
            back: c.back,
            tags: c.tags,
          }))
        )
      }
    } finally {
      setSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b sticky top-0 bg-background z-50">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Flashcard</span>
            </div>
            {currentView === 'decks' && decks.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedData}
                disabled={seeding}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {seeding ? 'Loading...' : 'Load Sample Data'}
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {currentView === 'study' && selectedDeck ? (
            <StudyView
              deck={selectedDeck}
              onBack={handleBack}
              onComplete={handleStudyComplete}
            />
          ) : currentView === 'deck-view' && selectedDeck ? (
            <DeckView
              deck={selectedDeck}
              onBack={handleBack}
              onStudy={() => setCurrentView('study')}
            />
          ) : (
            <Tabs
              value={currentTab}
              onValueChange={(v) => setCurrentTab(v as Tab)}
            >
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-6">
                <TabsTrigger value="decks" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Decks
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="decks">
                <DeckList
                  onSelectDeck={handleSelectDeck}
                  onStudyDeck={handleStudyDeck}
                  onCreateDeck={handleCreateDeck}
                  onEditDeck={handleEditDeck}
                />
              </TabsContent>

              <TabsContent value="stats">
                <Statistics />
              </TabsContent>

              <TabsContent value="settings">
                <Settings />
              </TabsContent>
            </Tabs>
          )}
        </main>

        {/* Floating Action Button (mobile-friendly) */}
        {currentView === 'decks' && currentTab === 'decks' && (
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
            onClick={handleCreateDeck}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        {/* Deck Dialog */}
        <DeckDialog
          open={deckDialogOpen}
          onOpenChange={setDeckDialogOpen}
          deck={editingDeck}
        />
      </div>
    </TooltipProvider>
  )
}

export default App
