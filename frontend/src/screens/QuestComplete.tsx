import { useEffect, useState } from 'react'
import { getSummary, type Campaign, type Summary, type Verdict } from '../api/client'
import { focusMinutes, masteryPercent } from '../lib/summary'
import type { Settings } from '../lib/timer'

const COUNT: Record<Verdict, string> = {
  correct: 'text-emerald-200',
  partial: 'text-amber-200',
  missed: 'text-rose-200',
  wrong: 'text-rose-200',
}

const VERDICTS: Verdict[] = ['correct', 'partial', 'missed', 'wrong']

interface Props {
  campaign: Campaign
  settings: Settings
  onRoadmap: () => void
  onNew: () => void
}

export default function QuestComplete({ campaign, settings, onRoadmap, onNew }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSummary(campaign.id)
      .then(setSummary)
      .catch((e: Error) => setError(e.message))
  }, [campaign.id])

  const mastery = summary && masteryPercent(summary.counts)

  return (
    <div className="mx-auto max-w-3xl p-6 text-center">
      <img
        src="/crystal.svg"
        alt=""
        className="animate-float mx-auto mt-6 h-16 w-16 drop-shadow-[0_0_16px_rgba(167,139,250,0.9)]"
      />
      <p className="label mt-6">Quest complete</p>
      <h1 className="rune-title text-4xl leading-tight">{campaign.title}</h1>
      <p className="mt-2 text-violet-200/70">Congratulations, adventurer. Every chapter is conquered.</p>

      {error && <p className="mt-6 text-sm text-rose-300">Could not load your results: {error}</p>}
      {!summary && !error && <p className="mt-6 text-violet-300/70">Tallying your deeds…</p>}

      {summary && (
        <>
          <div className="panel mt-8 p-6">
            <p className="label">Mastery</p>
            {mastery === null ? (
              <p className="mt-2 text-violet-200/70">No review breaks were graded on this quest.</p>
            ) : (
              <>
                <p className="rune-title text-7xl">{mastery}%</p>
                <div className="mt-4 flex justify-center gap-8">
                  {VERDICTS.map((v) => (
                    <div key={v}>
                      <p className={`font-display text-2xl ${COUNT[v]}`}>{summary.counts[v]}</p>
                      <p className="text-xs uppercase tracking-wider text-violet-300/70">{v}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!campaign.has_notes && <p className="mt-3 text-xs text-violet-300/50">Not checked against notes.</p>}
          </div>

          <p className="mt-5 text-sm text-violet-200/80">
            ⚔ {summary.chapters_done} {summary.chapters_done === 1 ? 'chapter' : 'chapters'} conquered · 📜{' '}
            {summary.reviews} {summary.reviews === 1 ? 'review' : 'reviews'} faced · ⏳ about{' '}
            {focusMinutes(summary.chapters_done, settings)} min of focus
          </p>
          <p className="text-xs text-violet-300/50">Focus time is estimated from your timer setting.</p>

          {summary.revisit.length > 0 && (
            <div className="mt-8 rounded-xl border border-rose-400/30 bg-rose-950/50 p-5 text-left">
              <p className="font-display text-rose-200">☠ Concepts to revisit</p>
              <ul className="mt-3 space-y-2">
                {summary.revisit.map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-rose-100">{r.concept}</span>
                    <span className="shrink-0 text-xs text-rose-200/60">
                      {r.chapter} · {r.verdict}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="mt-8 flex items-center justify-center gap-6">
        <button onClick={onNew} className="btn">
          ⚔ Start a new quest
        </button>
        <button onClick={onRoadmap} className="btn-ghost">
          View roadmap
        </button>
      </div>
    </div>
  )
}
