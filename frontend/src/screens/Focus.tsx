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
    <div className="mx-auto max-w-2xl p-6 text-center">
      <p className="text-sm text-slate-400">
        Chapter {chapter.position}: {chapter.title}
      </p>
      <p className="mt-6 font-mono text-7xl font-bold">{formatTime(left)}</p>
      <p className="mt-6 italic text-slate-300">{chapter.story_beat}</p>

      <h2 className="mt-8 text-sm uppercase tracking-wide text-slate-400">Quest objectives</h2>
      <ul className="mt-2 space-y-1">
        {chapter.concepts.map((c) => (
          <li key={c.name} className="rounded bg-slate-800 p-2">
            {c.name}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center gap-4 text-sm">
        <button onClick={() => setMuted(!muted)} className="rounded bg-slate-800 px-3 py-1.5 hover:bg-slate-700">
          {muted ? 'Brown noise: off' : 'Brown noise: on'}
        </button>
        <button onClick={onAbandon} className="text-slate-400 underline">
          Abandon chapter
        </button>
      </div>
    </div>
  )
}
