import type { GradeResult, Verdict } from '../api/client'

const BADGE: Record<Verdict, string> = {
  correct: 'border-emerald-300/50 bg-emerald-600/30 text-emerald-100',
  partial: 'border-amber-300/50 bg-amber-600/30 text-amber-100',
  missed: 'border-rose-300/50 bg-rose-700/30 text-rose-100',
  wrong: 'border-rose-300/50 bg-rose-700/30 text-rose-100',
}

interface Props {
  results: GradeResult[]
  hasNotes: boolean
  practice: boolean
  finishLabel: string
  onFinish: () => void
}

export default function Results({ results, hasNotes, practice, finishLabel, onFinish }: Props) {
  const villains = results.filter((r) => r.verdict === 'missed' || r.verdict === 'wrong')

  return (
    <div className="mt-8">
      <h2 className="rune-title text-3xl">The Verdict</h2>
      {!hasNotes && <p className="mt-1 text-xs text-violet-300/50">Not checked against notes.</p>}
      {results.length === 0 && <p className="mt-2 text-violet-200/70">No concepts were covered in this review.</p>}

      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.concept} className="panel p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-violet-50">{r.concept}</span>
              <span className={`rounded-full border px-3 py-0.5 text-xs uppercase tracking-wider ${BADGE[r.verdict]}`}>
                {r.verdict}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-200/70">You said: {r.student_said}</p>
            {r.quote_verified === true && (
              <blockquote className="mt-3 border-l-2 border-teal-300/60 pl-3 text-sm italic text-teal-100/90">
                📜 "{r.source_quote}"
              </blockquote>
            )}
            {r.quote_verified === false && (
              <p className="mt-2 text-xs text-violet-300/50">Source quote could not be verified against your notes.</p>
            )}
          </li>
        ))}
      </ul>

      {villains.length > 0 && (
        <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-950/50 p-3 text-sm text-rose-200">
          ☠ {villains.map((v) => v.concept).join(', ')} {practice ? 'would return' : 'will return'} as{' '}
          {villains.length > 1 ? 'villains' : 'a villain'} in the next chapter{practice ? ' (practice, not saved)' : ''}.
        </p>
      )}

      <button onClick={onFinish} className="btn mt-6">
        {finishLabel}
      </button>
    </div>
  )
}
