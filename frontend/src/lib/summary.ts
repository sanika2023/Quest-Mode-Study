import type { Verdict } from '../api/client'
import { durationsSec, type Settings } from './timer'

// Correct counts 1, partial 0.5. Null when nothing was graded.
export function masteryPercent(counts: Record<Verdict, number>): number | null {
  const total = counts.correct + counts.partial + counts.missed + counts.wrong
  if (total === 0) return null
  return Math.round(((counts.correct + counts.partial * 0.5) / total) * 100)
}

// Estimated from the current timer setting, not measured.
export function focusMinutes(chaptersDone: number, settings: Settings): number {
  return Math.round((chaptersDone * durationsSec(settings).focus) / 60)
}
