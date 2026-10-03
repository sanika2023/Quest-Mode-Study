import type { Settings } from './timer'

const KEY = 'settings'

export const DEFAULT_SETTINGS: Settings = { focusMin: 25, breakMin: 5, demo: false }

const defaultStorage = () => {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

const positive = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback

export function loadSettings(storage: Storage | undefined = defaultStorage()): Settings {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? '{}')
    return {
      focusMin: positive(raw.focusMin, DEFAULT_SETTINGS.focusMin),
      breakMin: positive(raw.breakMin, DEFAULT_SETTINGS.breakMin),
      demo: raw.demo === true,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: Settings, storage: Storage | undefined = defaultStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage unavailable; settings just won't persist
  }
}
