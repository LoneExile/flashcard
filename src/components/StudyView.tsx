import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, RotateCcw, X, Eye, Volume2, VolumeX, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStudySession, Rating } from '@/hooks/useStudySession'
import { useCards } from '@/hooks/useCards'
import type { CardDirection } from '@/types'
import { useTTS } from '@/hooks/useTTS'
import { getCardState, isDue } from '@/lib/fsrs'
import type { Deck } from '@/types'

interface StudyViewProps {
  deck: Deck | null  // null = study all decks
  onBack: () => void
  onComplete: () => void
}

type DirectionFilter = 'all' | CardDirection

export function StudyView({ deck, onBack, onComplete }: StudyViewProps) {
  // Direction filter state (persisted in localStorage)
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>(() => {
    return (localStorage.getItem('study-direction-filter') as DirectionFilter) || 'all'
  })

  const handleFilterChange = (filter: DirectionFilter) => {
    setDirectionFilter(filter)
    localStorage.setItem('study-direction-filter', filter)
  }

  const deckId = deck?.id ?? null
  const deckName = deck?.name ?? 'All Decks'

  const { dueCards } = useCards(deckId ?? undefined)

  const {
    isStudying,
    currentCard,
    currentIndex,
    totalCards,
    showingAnswer,
    sessionStats,
    startSession,
    showAnswer,
    answerCard,
    endSession,
    getSchedulingInfo,
  } = useStudySession(deckId)

  const {
    speak,
    stop: stopTTS,
    isPlaying: isTTSPlaying,
    isLoading: isTTSLoading,
    serverAvailable: ttsServerAvailable,
  } = useTTS()

  const schedulingInfo = useMemo(() => {
    if (currentCard && showingAnswer) {
      return getSchedulingInfo()
    }
    return null
  }, [currentCard, showingAnswer, getSchedulingInfo])

  // Check if this is a reverse card
  const isReverseCard = currentCard?.direction === 'reverse'

  // Filter due cards by direction
  // Cards without direction field are treated as 'normal'
  const filteredDueCards = useMemo(() => {
    const dueDeck = dueCards.filter(c => isDue(c.fsrs))
    if (directionFilter === 'all') return dueDeck
    return dueDeck.filter(c => (c.direction || 'normal') === directionFilter)
  }, [dueCards, directionFilter])

  const filteredDueCount = filteredDueCards.length

  // TTS language based on card direction
  // Normal card: front is Chinese (Pinyin), back is English
  // Reverse card: front is English, back is Chinese (Pinyin)
  const questionLang = isReverseCard ? 'en-US' : undefined  // undefined = Chinese (default)
  const answerLang = isReverseCard ? undefined : 'en-US'

  // Don't auto-start - let user choose filter first
  const handleStartStudy = useCallback(() => {
    if (filteredDueCount > 0) {
      startSession(filteredDueCards)
    }
  }, [filteredDueCount, filteredDueCards, startSession])

  // Play audio for question (front of card)
  const playQuestionAudio = useCallback(() => {
    if (currentCard) {
      // For normal cards: use audio field (Chinese) if available, otherwise front (Pinyin)
      // For reverse cards: front is English, no audio field needed
      const audioText = isReverseCard
        ? currentCard.front
        : (currentCard.audio || currentCard.front)
      speak(audioText, questionLang ? { lang: questionLang } : undefined)
    }
  }, [currentCard, isReverseCard, questionLang, speak])

  // Play audio for answer (back of card)
  const playAnswerAudio = useCallback(() => {
    if (currentCard) {
      // For normal cards: back is English
      // For reverse cards: back is Pinyin, use audio field (Chinese) if available
      const audioText = isReverseCard
        ? (currentCard.audio || currentCard.back)
        : currentCard.back
      speak(audioText, answerLang ? { lang: answerLang } : undefined)
    }
  }, [currentCard, isReverseCard, answerLang, speak])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isStudying) return

      // 'S' key to speak question
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        playQuestionAudio()
        return
      }

      // 'A' key to speak answer (when showing answer)
      if ((e.key === 'a' || e.key === 'A') && showingAnswer) {
        e.preventDefault()
        playAnswerAudio()
        return
      }

      if (!showingAnswer) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault()
          showAnswer()
        }
      } else {
        switch (e.key) {
          case '1':
            answerCard(Rating.Again)
            break
          case '2':
            answerCard(Rating.Hard)
            break
          case '3':
            answerCard(Rating.Good)
            break
          case '4':
            answerCard(Rating.Easy)
            break
        }
      }
    },
    [isStudying, showingAnswer, showAnswer, answerCard, playQuestionAudio, playAnswerAudio]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleEnd = () => {
    endSession()
    onComplete()
  }

  // Session Complete View
  if (!isStudying && sessionStats.studied > 0) {
    const correctRate =
      sessionStats.studied > 0
        ? Math.round(
            ((sessionStats.good + sessionStats.easy) / sessionStats.studied) *
              100
          )
        : 0

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground">Great job studying today</p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-center">Session Stats</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{sessionStats.studied}</p>
                <p className="text-sm text-muted-foreground">Cards Studied</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-green-500">
                  {correctRate}%
                </p>
                <p className="text-sm text-muted-foreground">Correct Rate</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-semibold text-red-500">
                  {sessionStats.again}
                </p>
                <p className="text-xs text-muted-foreground">Again</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-orange-500">
                  {sessionStats.hard}
                </p>
                <p className="text-xs text-muted-foreground">Hard</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-500">
                  {sessionStats.good}
                </p>
                <p className="text-xs text-muted-foreground">Good</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-blue-500">
                  {sessionStats.easy}
                </p>
                <p className="text-xs text-muted-foreground">Easy</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {/* Direction filter for next session */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={directionFilter} onValueChange={(v) => handleFilterChange(v as DirectionFilter)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cards</SelectItem>
                  <SelectItem value="normal">中 → EN</SelectItem>
                  <SelectItem value="reverse">EN → 中</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onBack}>
                {deck ? 'Back to Deck' : 'Back to Decks'}
              </Button>
              {filteredDueCount > 0 && (
                <Button onClick={() => startSession(filteredDueCards)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Study More ({filteredDueCount})
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Pre-session: Show filter and start button
  if (!isStudying && filteredDueCount > 0) {
    const totalDue = dueCards.filter(c => isDue(c.fsrs)).length
    // Cards without direction are treated as 'normal'
    const normalCount = dueCards.filter(c => isDue(c.fsrs) && (c.direction || 'normal') === 'normal').length
    const reverseCount = dueCards.filter(c => isDue(c.fsrs) && c.direction === 'reverse').length

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-bold">{deckName}</h2>
          <div />
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-center">Ready to Study</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{totalDue}</p>
                <p className="text-xs text-muted-foreground">Total Due</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{normalCount}</p>
                <p className="text-xs text-muted-foreground">中 → EN</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{reverseCount}</p>
                <p className="text-xs text-muted-foreground">EN → 中</p>
              </div>
            </div>

            {/* Direction filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Card Direction
              </label>
              <Select value={directionFilter} onValueChange={(v) => handleFilterChange(v as DirectionFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cards ({totalDue})</SelectItem>
                  <SelectItem value="normal">中 → EN only ({normalCount})</SelectItem>
                  <SelectItem value="reverse">EN → 中 only ({reverseCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleStartStudy}>
              Start Studying ({filteredDueCount} cards)
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // No Cards Due
  if (!isStudying && filteredDueCount === 0) {
    const totalDue = dueCards.filter(c => isDue(c.fsrs)).length
    const normalCount = dueCards.filter(c => isDue(c.fsrs) && (c.direction || 'normal') === 'normal').length
    const reverseCount = dueCards.filter(c => isDue(c.fsrs) && c.direction === 'reverse').length
    const hasOtherDirection = totalDue > 0 && filteredDueCount === 0

    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">All caught up!</h2>
        <p className="text-muted-foreground mb-4">
          {hasOtherDirection
            ? `No ${directionFilter === 'normal' ? '中 → EN' : 'EN → 中'} cards due. ${totalDue} cards available in other direction.`
            : 'No cards are due for review right now. Come back later!'}
        </p>

        {/* Direction filter */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={directionFilter} onValueChange={(v) => handleFilterChange(v as DirectionFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cards ({totalDue})</SelectItem>
              <SelectItem value="normal">中 → EN ({normalCount})</SelectItem>
              <SelectItem value="reverse">EN → 中 ({reverseCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {deck ? 'Back to Deck' : 'Back to Decks'}
        </Button>
      </div>
    )
  }

  // Study Card View
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleEnd}>
          <X className="mr-2 h-4 w-4" />
          End Session
        </Button>
        <div className="flex items-center gap-4">
          {directionFilter !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {directionFilter === 'normal' ? '中 → EN' : 'EN → 中'}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalCards}
          </span>
          <Progress
            value={((currentIndex + 1) / totalCards) * 100}
            className="w-32"
          />
        </div>
      </div>

      {/* Card */}
      {currentCard && (
        <Card className="min-h-[400px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    getCardState(currentCard.fsrs) === 'New'
                      ? 'info'
                      : getCardState(currentCard.fsrs) === 'Learning' ||
                          getCardState(currentCard.fsrs) === 'Relearning'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {getCardState(currentCard.fsrs)}
                </Badge>
                {isReverseCard && (
                  <Badge variant="secondary" className="text-xs">
                    EN → 中
                  </Badge>
                )}
              </div>
              {currentCard.tags.length > 0 && (
                <div className="flex gap-1">
                  {currentCard.tags.filter(t => t !== 'reverse').slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center">
            {/* Question */}
            <div className="text-center mb-8">
              {/* Show Chinese characters above pinyin for normal cards */}
              {!isReverseCard && currentCard.audio && (
                <p className="text-3xl font-medium mb-2 text-primary">
                  {currentCard.audio}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mb-2">
                <p className="text-xl font-medium whitespace-pre-wrap">
                  {currentCard.front}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={playQuestionAudio}
                  disabled={isTTSLoading}
                  title="Play audio (S)"
                >
                  {isTTSLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isTTSPlaying ? (
                    <VolumeX className="h-4 w-4" onClick={(e) => { e.stopPropagation(); stopTTS(); }} />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {ttsServerAvailable === false && (
                <p className="text-xs text-muted-foreground">
                  TTS server offline - using browser speech
                </p>
              )}
            </div>

            {/* Answer */}
            {showingAnswer && (
              <>
                <Separator className="my-6" />
                <div className="text-center">
                  {/* Show Chinese characters above pinyin for reverse cards */}
                  {isReverseCard && currentCard.audio && (
                    <p className="text-2xl font-medium mb-2 text-primary">
                      {currentCard.audio}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg whitespace-pre-wrap text-muted-foreground">
                      {currentCard.back}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={playAnswerAudio}
                      disabled={isTTSLoading}
                      title="Play answer audio (A)"
                    >
                      {isTTSLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex-shrink-0">
            {!showingAnswer ? (
              <Button className="w-full" size="lg" onClick={showAnswer}>
                <Eye className="mr-2 h-4 w-4" />
                Show Answer
                <span className="ml-2 text-xs opacity-70">(Space)</span>
              </Button>
            ) : (
              <div className="w-full grid grid-cols-4 gap-2">
                <Button
                  variant="destructive"
                  className="flex-col h-auto py-3"
                  onClick={() => answerCard(Rating.Again)}
                >
                  <span>Again</span>
                  <span className="text-xs opacity-70">
                    {schedulingInfo?.again.interval}
                  </span>
                  <span className="text-xs opacity-50">(1)</span>
                </Button>
                <Button
                  variant="warning"
                  className="flex-col h-auto py-3 bg-orange-500 hover:bg-orange-600"
                  onClick={() => answerCard(Rating.Hard)}
                >
                  <span>Hard</span>
                  <span className="text-xs opacity-70">
                    {schedulingInfo?.hard.interval}
                  </span>
                  <span className="text-xs opacity-50">(2)</span>
                </Button>
                <Button
                  variant="success"
                  className="flex-col h-auto py-3"
                  onClick={() => answerCard(Rating.Good)}
                >
                  <span>Good</span>
                  <span className="text-xs opacity-70">
                    {schedulingInfo?.good.interval}
                  </span>
                  <span className="text-xs opacity-50">(3)</span>
                </Button>
                <Button
                  className="flex-col h-auto py-3 bg-blue-500 hover:bg-blue-600"
                  onClick={() => answerCard(Rating.Easy)}
                >
                  <span>Easy</span>
                  <span className="text-xs opacity-70">
                    {schedulingInfo?.easy.interval}
                  </span>
                  <span className="text-xs opacity-50">(4)</span>
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      <p className="text-center text-xs text-muted-foreground">
        Keyboard: Space/Enter = show, 1-4 = rate, S = speak question, A = speak answer
      </p>
    </div>
  )
}
