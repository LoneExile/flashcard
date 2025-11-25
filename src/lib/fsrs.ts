import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FSRSCard,
  type RecordLogItem,
  type FSRSParameters,
  type Grade,
} from 'ts-fsrs'

const defaultParams: Partial<FSRSParameters> = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
}

const f = fsrs(generatorParameters(defaultParams))

export function createNewFSRSCard(): FSRSCard {
  return createEmptyCard()
}

export function scheduleCard(card: FSRSCard, rating: Rating, now: Date = new Date()): RecordLogItem {
  const result = f.next(card, now, rating as Grade)
  return result
}

export function getSchedulingOptions(card: FSRSCard, now: Date = new Date()) {
  const scheduling = f.repeat(card, now)

  return {
    again: {
      card: scheduling[Rating.Again].card,
      log: scheduling[Rating.Again].log,
      interval: getIntervalText(scheduling[Rating.Again].card, now),
    },
    hard: {
      card: scheduling[Rating.Hard].card,
      log: scheduling[Rating.Hard].log,
      interval: getIntervalText(scheduling[Rating.Hard].card, now),
    },
    good: {
      card: scheduling[Rating.Good].card,
      log: scheduling[Rating.Good].log,
      interval: getIntervalText(scheduling[Rating.Good].card, now),
    },
    easy: {
      card: scheduling[Rating.Easy].card,
      log: scheduling[Rating.Easy].log,
      interval: getIntervalText(scheduling[Rating.Easy].card, now),
    },
  }
}

function getIntervalText(card: FSRSCard, now: Date): string {
  const dueDate = card.due
  const diffMs = dueDate.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 30) return `${diffDays}d`
  if (diffDays < 365) return `${Math.round(diffDays / 30)}mo`
  return `${Math.round(diffDays / 365)}y`
}

export function getCardState(card: FSRSCard): string {
  switch (card.state) {
    case State.New:
      return 'New'
    case State.Learning:
      return 'Learning'
    case State.Review:
      return 'Review'
    case State.Relearning:
      return 'Relearning'
    default:
      return 'Unknown'
  }
}

export function isDue(card: FSRSCard, now: Date = new Date()): boolean {
  return card.due <= now
}

export function getRetention(card: FSRSCard): number {
  if (card.state === State.New) return 0
  const stability = card.stability
  const elapsed = card.elapsed_days
  if (stability === 0 || elapsed === 0) return 1
  return Math.exp(-elapsed / stability)
}

export { Rating, State }
export type { FSRSCard, RecordLogItem }
