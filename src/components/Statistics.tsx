import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Clock,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { db } from '@/db'
import { State } from '@/lib/fsrs'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export function Statistics() {
  const cards = useLiveQuery(() => db.cards.toArray())
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray())
  const sessions = useLiveQuery(() => db.studySessions.toArray())

  const dailyStats = useMemo(() => {
    if (!sessions) return []

    // Calculate daily stats for the last 7 days
    const stats: Array<{ date: string; studied: number; correct: number }> = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const daySessions = sessions.filter(
        (s) => s.startTime >= dayStart && s.startTime <= dayEnd
      )

      const studied = daySessions.reduce((sum, s) => sum + s.cardsStudied, 0)
      const correct = daySessions.reduce((sum, s) => sum + s.correctCount, 0)

      stats.push({
        date: format(date, 'EEE'),
        studied,
        correct,
      })
    }

    return stats
  }, [sessions])

  if (!cards || !reviewLogs || !sessions) {
    return <div className="text-center py-8">Loading statistics...</div>
  }

  // Calculate overview stats
  const totalCards = cards.length
  const newCards = cards.filter((c) => c.fsrs.state === State.New).length
  const learningCards = cards.filter(
    (c) => c.fsrs.state === State.Learning || c.fsrs.state === State.Relearning
  ).length
  const matureCards = cards.filter((c) => c.fsrs.state === State.Review).length

  const totalReviews = reviewLogs.length
  const correctReviews = reviewLogs.filter((l) => l.rating >= 3).length
  const retentionRate =
    totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

  // Calculate streak
  const today = startOfDay(new Date())
  let streak = 0
  let checkDate = new Date(today)

  const sortedSessions = [...sessions].sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime()
  )

  for (const session of sortedSessions) {
    const sessionDate = startOfDay(session.startTime)
    if (sessionDate.getTime() === checkDate.getTime()) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else if (sessionDate.getTime() < checkDate.getTime()) {
      break
    }
  }

  // Calculate study time
  const totalStudyTime = sessions.reduce((sum, s) => {
    if (s.endTime) {
      return sum + (s.endTime.getTime() - s.startTime.getTime())
    }
    return sum
  }, 0)
  const totalMinutes = Math.round(totalStudyTime / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  // Today's progress
  const todaySessions = sessions.filter((s) => {
    const sessionDate = startOfDay(s.startTime)
    return sessionDate.getTime() === today.getTime()
  })
  const todayStudied = todaySessions.reduce((sum, s) => sum + s.cardsStudied, 0)
  const dailyGoal = 20 // Could come from settings

  const maxStudied = Math.max(...dailyStats.map((d) => d.studied), 1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistics</h2>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">
              {newCards} new, {learningCards} learning, {matureCards} mature
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {correctReviews} / {totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {streak} days
            </div>
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hours}h {minutes}m
            </div>
            <p className="text-xs text-muted-foreground">Total time studied</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Progress
          </CardTitle>
          <CardDescription>
            {todayStudied} / {dailyGoal} cards studied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min((todayStudied / dailyGoal) * 100, 100)}
            className="h-3"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {todayStudied >= dailyGoal
              ? 'Daily goal achieved!'
              : `${dailyGoal - todayStudied} more to reach your goal`}
          </p>
        </CardContent>
      </Card>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Cards studied in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-48 gap-2">
            {dailyStats.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs font-medium">{day.studied}</span>
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{
                      height: `${(day.studied / maxStudied) * 150}px`,
                      minHeight: day.studied > 0 ? '4px' : '0',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card States Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Card Distribution</CardTitle>
          <CardDescription>Breakdown by learning state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>New</span>
                <span className="text-muted-foreground">
                  {newCards} ({totalCards > 0 ? Math.round((newCards / totalCards) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={totalCards > 0 ? (newCards / totalCards) * 100 : 0}
                className="h-2 bg-blue-100 [&>div]:bg-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learning</span>
                <span className="text-muted-foreground">
                  {learningCards} ({totalCards > 0 ? Math.round((learningCards / totalCards) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={totalCards > 0 ? (learningCards / totalCards) * 100 : 0}
                className="h-2 bg-orange-100 [&>div]:bg-orange-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mature</span>
                <span className="text-muted-foreground">
                  {matureCards} ({totalCards > 0 ? Math.round((matureCards / totalCards) * 100) : 0}%)
                </span>
              </div>
              <Progress
                value={totalCards > 0 ? (matureCards / totalCards) * 100 : 0}
                className="h-2 bg-green-100 [&>div]:bg-green-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
