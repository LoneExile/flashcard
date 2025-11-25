import { useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, RotateCcw, X, Eye } from 'lucide-react'
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
import { useStudySession, Rating } from '@/hooks/useStudySession'
import { getCardState } from '@/lib/fsrs'
import type { Deck } from '@/types'

interface StudyViewProps {
  deck: Deck
  onBack: () => void
  onComplete: () => void
}

export function StudyView({ deck, onBack, onComplete }: StudyViewProps) {
  const {
    isStudying,
    currentCard,
    currentIndex,
    totalCards,
    showingAnswer,
    sessionStats,
    dueCount,
    startSession,
    showAnswer,
    answerCard,
    endSession,
    getSchedulingInfo,
  } = useStudySession(deck.id)

  const schedulingInfo = useMemo(() => {
    if (currentCard && showingAnswer) {
      return getSchedulingInfo()
    }
    return null
  }, [currentCard, showingAnswer, getSchedulingInfo])

  useEffect(() => {
    if (!isStudying && dueCount > 0) {
      startSession()
    }
  }, [isStudying, dueCount, startSession])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isStudying) return

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
    [isStudying, showingAnswer, showAnswer, answerCard]
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
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={onBack}>
              Back to Deck
            </Button>
            {dueCount > 0 && (
              <Button onClick={() => startSession()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Study More ({dueCount})
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  // No Cards Due
  if (!isStudying && dueCount === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">All caught up!</h2>
        <p className="text-muted-foreground mb-6">
          No cards are due for review right now. Come back later!
        </p>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deck
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
              {currentCard.tags.length > 0 && (
                <div className="flex gap-1">
                  {currentCard.tags.slice(0, 3).map((tag) => (
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
              <p className="text-xl font-medium whitespace-pre-wrap">
                {currentCard.front}
              </p>
            </div>

            {/* Answer */}
            {showingAnswer && (
              <>
                <Separator className="my-6" />
                <div className="text-center">
                  <p className="text-lg whitespace-pre-wrap text-muted-foreground">
                    {currentCard.back}
                  </p>
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
        Keyboard shortcuts: Space/Enter to show answer, 1-4 to rate
      </p>
    </div>
  )
}
