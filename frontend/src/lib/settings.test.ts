import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'

function fakeStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  } as Storage
}

let storage: Storage
beforeEach(() => {
  storage = fakeStorage()
})

describe('settings', () => {
  it('defaults to 25/5 with demo off', () => {
    expect(DEFAULT_SETTINGS).toEqual({ focusMin: 25, breakMin: 5, demo: false })
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', () => {
    const s = { focusMin: 50, breakMin: 10, demo: true }
    saveSettings(s, storage)
    expect(loadSettings(storage)).toEqual(s)
  })

  it('falls back to defaults on corrupt data', () => {
    storage.setItem('settings', '{nope')
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })

  it('replaces invalid fields with defaults', () => {
    storage.setItem('settings', JSON.stringify({ focusMin: -3, breakMin: 'x', demo: true }))
    expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, demo: true })
  })

  it('survives missing storage', () => {
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS, undefined)).not.toThrow()
  })
})
