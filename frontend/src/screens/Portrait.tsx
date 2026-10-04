import { useState } from 'react'
import type { Character } from '../characters'

const SIZE = { sm: 'h-10 w-10 text-lg', lg: 'h-32 w-32 text-5xl' }

export default function Portrait({ character, size = 'sm' }: { character: Character; size?: 'sm' | 'lg' }) {
  const [missing, setMissing] = useState(false)
  const frame = `${SIZE[size]} shrink-0 overflow-hidden rounded-full border-2 border-violet-300/50 bg-gradient-to-br from-violet-800 to-teal-900 shadow-[0_0_20px_-4px_rgba(167,139,250,0.8)]`

  return missing ? (
    <div className={`${frame} flex items-center justify-center font-display text-violet-100`}>{character.glyph}</div>
  ) : (
    <img src={character.image} alt={character.name} onError={() => setMissing(true)} className={`${frame} object-cover`} />
  )
}
