import { describe, expect, it } from 'vitest'
import { breathAt, dotPosition } from './breathing'

describe('breathAt', () => {
  it('cycles inhale, hold, exhale, hold every 4 seconds', () => {
    expect(breathAt(0).label).toBe('Inhale')
    expect(breathAt(4_000).label).toBe('Hold')
    expect(breathAt(8_000).label).toBe('Exhale')
    expect(breathAt(12_000).label).toBe('Hold')
    expect(breathAt(16_000).label).toBe('Inhale')
  })

  it('reports side and progress within the phase', () => {
    expect(breathAt(6_000)).toMatchObject({ side: 1, progress: 0.5 })
    expect(breathAt(17_000)).toMatchObject({ side: 0, progress: 0.25 })
  })

  it('counts down whole seconds left in the phase', () => {
    expect(breathAt(0).count).toBe(4)
    expect(breathAt(3_999).count).toBe(1)
    expect(breathAt(4_000).count).toBe(4)
  })
})

describe('dotPosition', () => {
  it('walks the square clockwise from the bottom-left corner', () => {
    expect(dotPosition(0, 0)).toEqual({ x: 0, y: 1 })
    expect(dotPosition(0, 1)).toEqual({ x: 0, y: 0 })
    expect(dotPosition(1, 0.5)).toEqual({ x: 0.5, y: 0 })
    expect(dotPosition(2, 0.5)).toEqual({ x: 1, y: 0.5 })
    expect(dotPosition(3, 0.5)).toEqual({ x: 0.5, y: 1 })
  })
})
