import type { GradeResult, Verdict } from '../api/client'

const BADGE: Record<Verdict, string> = {
  correct: 'bg-emerald-700',
  partial: 'bg-amber-600',
  missed: 'bg-red-700',
  wrong: 'bg-red-700',
}

interface Props {
  results: GradeResult[]
  hasNotes: boolean
  onFinish: () => void
}

export default function Results({ results, hasNotes, onFinish }: Props) {
  const villains = results.filter((r) => r.verdict === 'missed' || r.verdict === 'wrong')

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">Results</h2>
      {!hasNotes && <p className="mt-1 text-xs text-slate-500">Not checked against notes.</p>}
      {results.length === 0 && <p className="mt-2 text-slate-400">No concepts were covered in this review.</p>}

      <ul className="mt-3 space-y-3">
        {results.map((r) => (
          <li key={r.concept} className="rounded bg-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{r.concept}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${BADGE[r.verdict]}`}>{r.verdict}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">You said: {r.student_said}</p>
            {r.quote_verified === true && (
              <blockquote className="mt-2 border-l-2 border-slate-600 pl-3 text-sm italic text-slate-300">
                "{r.source_quote}"
              </blockquote>
            )}
            {r.quote_verified === false && (
              <p className="mt-2 text-xs text-slate-500">Source quote could not be verified against your notes.</p>
            )}
          </li>
        ))}
      </ul>

      {villains.length > 0 && (
        <p className="mt-4 text-sm text-red-300">
          {villains.map((v) => v.concept).join(', ')} will return as a villain in the next chapter.
        </p>
      )}

      <button onClick={onFinish} className="mt-6 rounded bg-indigo-600 px-5 py-2 font-semibold">
        Finish chapter
      </button>
    </div>
  )
}
