import type { ReviewMode } from './api/client'

export interface Character {
  name: string
  title: string
  image: string
  glyph: string
}

// Images live in public/characters/; the glyph shows until they exist.
export const CHARACTERS: Record<ReviewMode, Character> = {
  quiz: { name: 'Elder Orin', title: 'Keeper of the Archive', image: '/characters/orin.png', glyph: '✦' },
  teachback: { name: 'Pip', title: 'the Confused Apprentice', image: '/characters/pip.png', glyph: '?' },
}
