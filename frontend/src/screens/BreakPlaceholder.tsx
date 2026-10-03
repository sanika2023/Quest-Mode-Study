import { useCountdown } from '../hooks/useCountdown'
import { formatTime } from '../lib/timer'
import type { BreakKind } from './BreakChoice'

interface Props {
  kind: BreakKind
  seconds: number
  onFinish: () => void
}

// Stand-in until the box breathing screen (step 7) exists.
export default function BreakPlaceholder({ kind, seconds, onFinish }: Props) {
  const left = useCountdown(seconds, () => {})

  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-3xl font-bold">{kind === 'fun' ? 'Fun break' : 'Break'}</h1>
      <p className="mt-6 font-mono text-6xl font-bold">{formatTime(left)}</p>
      <p className="mt-4 text-slate-400">
        Box breathing arrives later.
      </p>
      <button onClick={onFinish} className="mt-8 rounded bg-indigo-600 px-5 py-2 font-semibold">
        Finish chapter
      </button>
    </div>
  )
}
