import { describe, expect, it } from 'vitest'
import { durationsSec, formatTime, remainingSeconds } from './timer'

describe('durationsSec', () => {
  it('converts minutes to seconds', () => {
    expect(durationsSec({ focusMin: 25, breakMin: 5, demo: false })).toEqual({ focus: 1500, break: 300 })
  })

  it('demo mode overrides with 20s focus and 15s break', () => {
    expect(durationsSec({ focusMin: 25, breakMin: 5, demo: true })).toEqual({ focus: 20, break: 15 })
  })
})

describe('remainingSeconds', () => {
  it('rounds up so the display hits 0 only at the end', () => {
    expect(remainingSeconds(10_000, 9_001)).toBe(1)
    expect(remainingSeconds(10_000, 9_000)).toBe(1)
    expect(remainingSeconds(10_000, 0)).toBe(10)
  })

  it('never goes negative', () => {
    expect(remainingSeconds(10_000, 12_000)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats mm:ss', () => {
    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(0)).toBe('00:00')
  })
})
