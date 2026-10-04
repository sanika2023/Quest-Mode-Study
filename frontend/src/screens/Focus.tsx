import { useEffect, useRef, useState } from 'react'
import type { Chapter } from '../api/client'
import { useCountdown } from '../hooks/useCountdown'
import { createBrownNoise } from '../lib/brownNoise'
import { formatTime } from '../lib/timer'

interface Props {
  chapter: Chapter
  seconds: number
  onDone: () => void
  onAbandon: () => void
}

export default function Focus({ chapter, seconds, onDone, onAbandon }: Props) {
  const noise = useRef(createBrownNoise())
  const [muted, setMuted] = useState(false)
  const left = useCountdown(seconds, onDone)

  useEffect(() => {
    const n = noise.current
    if (!muted) n.start()
    else n.stop()
    return () => n.stop()
  }, [muted])

  return (
    <div className="mx-auto max-w-5xl p-6 text-center">
      <p className="label">Chapter {chapter.position}</p>
      <h1 className="font-display text-xl text-violet-100">{chapter.title}</h1>

      <div className="mx-auto mt-8 flex h-56 w-56 items-center justify-center rounded-full border-2 border-violet-300/40 bg-indigo-950/60 shadow-[0_0_60px_-10px_rgba(139,92,246,0.8),inset_0_0_40px_-10px_rgba(94,234,212,0.5)]">
        <p className="font-mono text-6xl font-bold text-violet-50">{formatTime(left)}</p>
      </div>

      <p className="mt-8 italic text-violet-200/80">{chapter.story_beat}</p>

      <h2 className="label mt-10">Quest objectives</h2>
      <ul className="mt-3 space-y-2">
        {chapter.concepts.map((c) => (
          <li key={c.name} className="panel p-2.5">
            ✦ {c.name}
          </li>
        ))}
      </ul>

      {chapter.villains.length > 0 && (
        <>
          <h2 className="label mt-8 !text-rose-300">Villains returning</h2>
          <ul className="mt-3 space-y-2">
            {chapter.villains.map((v) => (
              <li key={v.name} className="rounded-xl border border-rose-400/30 bg-rose-950/50 p-2.5 text-rose-100">
                ☠ {v.name}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex items-center justify-center gap-6">
        <button onClick={() => setMuted(!muted)} className="panel px-4 py-1.5 text-sm hover:border-teal-300/50">
          {muted ? '🔇 Brown noise: off' : '🔊 Brown noise: on'}
        </button>
        <button onClick={onAbandon} className="btn-ghost">
          Abandon chapter
        </button>
      </div>
    </div>
  )
}
