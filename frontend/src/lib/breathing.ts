export const PHASE_MS = 4_000
const LABELS = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const

export interface Breath {
  label: (typeof LABELS)[number]
  side: number
  progress: number
  count: number
}

export function breathAt(ms: number): Breath {
  const side = Math.floor(ms / PHASE_MS) % 4
  const into = ms % PHASE_MS
  return { label: LABELS[side], side, progress: into / PHASE_MS, count: Math.ceil((PHASE_MS - into) / 1000) }
}

// Unit-square coordinates (y down): up the left, across the top, down the right, back along the bottom.
export function dotPosition(side: number, p: number): { x: number; y: number } {
  if (side === 0) return { x: 0, y: 1 - p }
  if (side === 1) return { x: p, y: 0 }
  if (side === 2) return { x: 1, y: p }
  return { x: 1 - p, y: 1 }
}
