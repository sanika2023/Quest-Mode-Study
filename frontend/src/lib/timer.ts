export interface Settings {
  focusMin: number
  breakMin: number
  demo: boolean
}

const DEMO_FOCUS_SEC = 20
const DEMO_BREAK_SEC = 15

export function durationsSec(s: Settings): { focus: number; break: number } {
  if (s.demo) return { focus: DEMO_FOCUS_SEC, break: DEMO_BREAK_SEC }
  return { focus: s.focusMin * 60, break: s.breakMin * 60 }
}

export function remainingSeconds(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000))
}

export function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
