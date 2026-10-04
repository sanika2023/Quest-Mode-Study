import { useState } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { formatTime } from '../lib/timer'
import BoxBreathing from './BoxBreathing'

type Activity = 'breathe' | 'free'

const TABS: { id: Activity; label: string }[] = [
  { id: 'breathe', label: '✦ Box breathing' },
  { id: 'free', label: '🌙 Free activity' },
]

interface Props {
  seconds: number
  finishLabel: string
  onFinish: () => void
}

export default function FunBreak({ seconds, finishLabel, onFinish }: Props) {
  const left = useCountdown(seconds, () => {})
  const [activity, setActivity] = useState<Activity>('breathe')
  const timeText = left > 0 ? formatTime(left) : 'Break complete. Return when you are ready.'

  return (
    <div className="mx-auto max-w-5xl p-6 text-center">
      <p className="label">Fun break</p>
      <h1 className="rune-title text-4xl">{activity === 'breathe' ? 'The Breathing Sigil' : 'Wander Freely'}</h1>

      <div className="mt-6 flex justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActivity(t.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              activity === t.id
                ? 'border-teal-300/60 bg-violet-600/50 text-white shadow-[0_0_12px_-2px_rgba(139,92,246,0.8)]'
                : 'border-violet-400/20 bg-indigo-950/60 text-violet-200/80 hover:border-violet-300/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activity === 'breathe' ? (
        <>
          <p className="mt-6 text-violet-200/70">Follow the light around the square.</p>
          <div className="mt-10">
            <BoxBreathing />
          </div>
          <p className="mt-12 font-mono text-teal-300/80">{left > 0 ? `⏳ ${timeText}` : timeText}</p>
        </>
      ) : (
        <>
          <p className="mt-6 text-violet-200/70">Stretch, take a walk, grab some water, or doodle. The timer keeps watch.</p>
          <div className="mx-auto mt-10 flex h-56 w-56 items-center justify-center rounded-full border-2 border-violet-300/40 bg-indigo-950/60 shadow-[0_0_60px_-10px_rgba(139,92,246,0.8),inset_0_0_40px_-10px_rgba(94,234,212,0.5)]">
            <p className={left > 0 ? 'font-mono text-6xl font-bold text-violet-50' : 'px-6 text-violet-100'}>{timeText}</p>
          </div>
        </>
      )}

      <button onClick={onFinish} className="btn mt-8">
        {finishLabel}
      </button>
    </div>
  )
}
