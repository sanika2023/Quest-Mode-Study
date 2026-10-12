import { describe, expect, it } from 'vitest'
import { focusMinutes, masteryPercent } from './summary'

describe('masteryPercent', () => {
  it('counts correct as 1 and partial as half', () => {
    expect(masteryPercent({ correct: 2, partial: 1, missed: 1, wrong: 1 })).toBe(50)
    expect(masteryPercent({ correct: 3, partial: 0, missed: 0, wrong: 0 })).toBe(100)
  })

  it('rounds to a whole percent', () => {
    expect(masteryPercent({ correct: 2, partial: 0, missed: 1, wrong: 0 })).toBe(67)
  })

  it('is null when nothing was graded', () => {
    expect(masteryPercent({ correct: 0, partial: 0, missed: 0, wrong: 0 })).toBeNull()
  })
})

describe('focusMinutes', () => {
  it('multiplies chapters by the focus setting', () => {
    expect(focusMinutes(4, { focusMin: 25, breakMin: 5, demo: false })).toBe(100)
  })

  it('uses the demo duration in demo mode', () => {
    expect(focusMinutes(3, { focusMin: 25, breakMin: 5, demo: true })).toBe(1)
  })
})
