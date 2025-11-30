import { useState, useEffect } from 'react'
import {
  BookOpen,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Sparkles,
  User,
  LogOut,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeckList } from '@/components/DeckList'
import { DeckDialog } from '@/components/DeckDialog'
import { DeckView } from '@/components/DeckView'
import { StudyView } from '@/components/StudyView'
import { Statistics } from '@/components/Statistics'
import { Settings } from '@/components/Settings'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { AdminPage } from '@/pages/AdminPage'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { db, initializeDB } from '@/db'
import { useDecks } from '@/hooks/useDecks'
import { useCards } from '@/hooks/useCards'
import { useAutoSync } from '@/hooks/useAutoSync'
import { seedDecks } from '@/lib/seedData'
import { syncFromServer, checkServerStatus } from '@/lib/api'
import type { Deck } from '@/types'

type View = 'decks' | 'deck-view' | 'study'
type Tab = 'decks' | 'stats' | 'settings'
type AuthView = 'login' | 'register'

function AuthenticatedApp() {
  const { user, logout } = useAuth()
  const [currentTab, setCurrentTab] = useState<Tab>('decks')
  const [currentView, setCurrentView] = useState<View>('decks')
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [deckDialogOpen, setDeckDialogOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const { decks, createDeck } = useDecks()
  const { importCards } = useCards()

  // Enable auto sync when user is authenticated
  useAutoSync()

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

      // Check if IndexedDB is empty (first login on this device)
      // If so, automatically sync from backend
      const deckCount = await db.decks.count()
      if (deckCount === 0) {
        console.log('[Init] No local data found, checking server for data...')
        const serverOnline = await checkServerStatus()
        if (serverOnline) {
          console.log('[Init] Server online, syncing from backend...')
          const result = await syncFromServer()
          if (result.success && result.data) {
            // Import data from server
            if (result.data.decks.length > 0) {
              await db.decks.bulkAdd(result.data.decks)
            }
            if (result.data.cards.length > 0) {
              await db.cards.bulkAdd(result.data.cards)
            }
            if (result.data.reviewLogs.length > 0) {
              await db.reviewLogs.bulkAdd(result.data.reviewLogs)
            }
            if (result.data.studySessions.length > 0) {
              await db.studySessions.bulkAdd(result.data.studySessions)
            }
            console.log('[Init] Synced from backend:', result.message)
          }
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

  const handleStudyAllDecks = () => {
    setSelectedDeck(null)
    setCurrentView('study')
  }

  const handleBack = () => {
    setCurrentView('decks')
    setSelectedDeck(null)
  }

  const handleStudyComplete = () => {
    // If studying all decks (no selected deck), go back to decks list
    // Otherwise go to deck view
    setCurrentView(selectedDeck ? 'deck-view' : 'decks')
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
        // Create both normal and reverse cards for bidirectional study
        await importCards(
          deck.id,
          deckData.cards.map((c) => ({
            front: c.front,
            back: c.back,
            audio: c.audio,
            tags: c.tags,
          })),
          true  // createReverse = true
        )
      }
    } finally {
      setSeeding(false)
    }
  }

  const handleLogout = async () => {
    await logout()
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

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />
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
            <div className="flex items-center gap-2">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">{user?.email}</div>
                  <DropdownMenuSeparator />
                  {user?.isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => setShowAdmin(true)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {currentView === 'study' ? (
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
                  onStudyAllDecks={handleStudyAllDecks}
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

function AppContent() {
  const { isLoading, isAuthenticated, authConfig } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('login')

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      // Clear the URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('error')) {
      // Handle OAuth error
      console.error('OAuth error:', params.get('error'))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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

  if (!isAuthenticated) {
    if (authView === 'register' && authConfig?.registrationEnabled) {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />
  }

  return <AuthenticatedApp />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
