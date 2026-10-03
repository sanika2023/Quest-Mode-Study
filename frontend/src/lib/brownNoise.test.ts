import { describe, expect, it } from 'vitest'
import { fillBrownNoise } from './brownNoise'

describe('fillBrownNoise', () => {
  it('stays within [-1, 1] for any input', () => {
    const buf = new Float32Array(10_000)
    fillBrownNoise(buf)
    expect(Math.max(...buf)).toBeLessThanOrEqual(1)
    expect(Math.min(...buf)).toBeGreaterThanOrEqual(-1)
  })

  it('is smoother than white noise (random walk)', () => {
    const buf = new Float32Array(10_000)
    fillBrownNoise(buf)
    const meanStep = buf.reduce((s, v, i) => (i ? s + Math.abs(v - buf[i - 1]) : s), 0) / (buf.length - 1)
    expect(meanStep).toBeLessThan(0.1)
  })

  it('is deterministic given the same random source', () => {
    const seq = () => {
      let i = 0
      return () => ((i++ * 7919) % 1000) / 1000
    }
    const a = new Float32Array(100)
    const b = new Float32Array(100)
    fillBrownNoise(a, seq())
    fillBrownNoise(b, seq())
    expect(a).toEqual(b)
  })
})
